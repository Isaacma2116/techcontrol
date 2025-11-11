import React, { useState, useEffect, useMemo } from "react";

// Tipos para el formulario
export interface SoftwareFormData {
  nombre: string;
  version: string;
  tipo: string;
  descripcion?: string;
  licencias: LicenciaFormData[];
}

interface LicenciaFormData {
  correo: string;
  contrasena: string;
  clave_licencia: string;
  fecha_adquisicion?: string;
  fecha_caducidad?: string;
  tipo_licencia: "mensual" | "anual" | "vitalicia";
  estado: "activa" | "caducada" | "no_asignada";
  max_dispositivos: number;
  observaciones?: string;
  equipos: number[]; // IDs de equipos relacionados
}

interface Equipo {
  id: number;
  nombre: string;
}

interface SoftwareFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SoftwareFormData;
}

const TIPO_LICENCIA = [
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
  { value: "vitalicia", label: "Vitalicia" },
];

const ESTADOS = [
  { value: "activa", label: "Activa" },
  { value: "caducada", label: "Caducada" },
  { value: "no_asignada", label: "No asignada" },
];

const defaultLicencia: LicenciaFormData = {
  correo: "",
  contrasena: "",
  clave_licencia: "",
  fecha_adquisicion: "",
  fecha_caducidad: "",
  tipo_licencia: "mensual",
  estado: "activa",
  max_dispositivos: 1,
  observaciones: "",
  equipos: [],
};

const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

const SoftwareForm: React.FC<SoftwareFormProps> = ({
  open,
  onClose,
  onSaved,
  initialData,
}) => {
  const [form, setForm] = useState<SoftwareFormData>(
    initialData || {
      nombre: "",
      version: "",
      tipo: "",
      descripcion: "",
      licencias: [],
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Equipos desde backend
  const [equiposDb, setEquiposDb] = useState<Equipo[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [equiposError, setEquiposError] = useState<string | null>(null);

  // Filtro de equipos
  const [searchEquipo, setSearchEquipo] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchEquipos() {
      setLoadingEquipos(true);
      setEquiposError(null);
      try {
        const res = await fetch(`${BASE_URL}/api/equipos`);
        if (!res.ok) throw new Error("Error de red o API: " + res.statusText);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.data || [];
        const equipos = arr.map((e: any) => ({
          id: e.id,
          nombre: e.nombre || [e.marca, e.modelo].filter(Boolean).join(" ") || `Equipo #${e.id}`,
        }));
        if (!cancelled) setEquiposDb(equipos);
      } catch (err) {
        if (!cancelled) setEquiposError("Error al cargar equipos.");
      } finally {
        if (!cancelled) setLoadingEquipos(false);
      }
    }
    fetchEquipos();
    return () => { cancelled = true; };
  }, [open]);

  // Si se está editando, inicializa el form con los datos
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        nombre: "",
        version: "",
        tipo: "",
        descripcion: "",
        licencias: [],
      });
    }
  }, [initialData, open]);

  // Handlers básicos
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Cambio de licencia dinámica
  const handleLicenciaChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as any;
    setForm((prev) => {
      const nuevas = [...prev.licencias];
      if (name === "max_dispositivos") {
        let nuevoMax = Number(value);
        if (nuevoMax < 1) nuevoMax = 1;
        nuevas[idx][name] = nuevoMax;
        if (nuevas[idx].equipos.length > nuevoMax) {
          nuevas[idx].equipos = nuevas[idx].equipos.slice(0, nuevoMax);
        }
      } else if (name === "tipo_licencia") {
        nuevas[idx][name] = value;
        if (value === "vitalicia") {
          nuevas[idx].fecha_caducidad = "";
        }
      } else {
        nuevas[idx][name] = value;
      }
      return { ...prev, licencias: nuevas };
    });
  };

  // Selección de equipos
  const handleEquipoCheckbox = (idx: number, equipoId: number, checked: boolean) => {
    setForm((prev) => {
      const nuevas = [...prev.licencias];
      let actual = nuevas[idx].equipos || [];
      if (checked) {
        if (!actual.includes(equipoId) && actual.length < nuevas[idx].max_dispositivos) {
          actual = [...actual, equipoId];
        }
      } else {
        actual = actual.filter((id) => id !== equipoId);
      }
      nuevas[idx].equipos = actual;
      return { ...prev, licencias: nuevas };
    });
  };

  // Opción sin equipo asignado
  const handleSinEquipo = (idx: number) => {
    setForm((prev) => {
      const nuevas = [...prev.licencias];
      nuevas[idx].equipos = [];
      return { ...prev, licencias: nuevas };
    });
  };

  // Agregar/quitar licencia
  const agregarLicencia = () =>
    setForm((prev) => ({
      ...prev,
      licencias: [...prev.licencias, { ...defaultLicencia }],
    }));

  const quitarLicencia = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      licencias: prev.licencias.filter((_, i) => i !== idx),
    }));

  // Validación y submit con envío al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del software es obligatorio.");
      return;
    }
    if (
      form.licencias &&
      form.licencias.length > 0 &&
      form.licencias.some((l) => !l.clave_licencia.trim())
    ) {
      setError("Cada licencia debe tener clave de licencia.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const isEditar = !!initialData;
      const url = isEditar
        ? `${BASE_URL}/api/software/${(initialData as any).id}`
        : `${BASE_URL}/api/software`;
      const method = isEditar ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let msg = "Error al guardar software";
        try {
          const data = await res.json();
          msg = data?.error || data?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      onSaved && onSaved();
      onClose && onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar software");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrado equipos
  const equiposFiltrados = useMemo(() => {
    if (!searchEquipo.trim()) return equiposDb;
    return equiposDb.filter(eq =>
      eq.nombre.toLowerCase().includes(searchEquipo.trim().toLowerCase())
    );
  }, [equiposDb, searchEquipo]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative animate-fade-in overflow-y-auto max-h-[95vh] border-2 border-orange-500 transition-all">
        {/* Cerrar */}
        <button
          onClick={isSaving ? undefined : onClose}
          className="absolute top-4 right-4 text-black hover:text-orange-600 text-xl font-bold transition-colors"
          aria-label="Cerrar"
          disabled={isSaving}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-extrabold text-orange-700 mb-4 flex items-center gap-2">
          <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="20" height="20" x="2" y="2" rx="5" fill="#fff" stroke="#ff6600" strokeWidth="2"/>
            <path d="M7 12h10M12 7v10" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {initialData ? "Editar Software" : "Agregar Nuevo Software"}
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 rounded p-2 mb-4 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Datos de software --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-black">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleInputChange}
                className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-4 py-2 bg-white text-black font-semibold transition-all"
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Versión</label>
              <input
                name="version"
                value={form.version}
                onChange={handleInputChange}
                className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-4 py-2 bg-white text-black font-semibold transition-all"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Tipo</label>
              <input
                name="tipo"
                value={form.tipo}
                onChange={handleInputChange}
                className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-4 py-2 bg-white text-black font-semibold transition-all"
                disabled={isSaving}
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-black">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion || ""}
              onChange={handleInputChange}
              className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-4 py-2 bg-white text-black font-semibold transition-all"
              rows={2}
              disabled={isSaving}
            />
          </div>

          {/* --- Licencias dinámicas --- */}
          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-bold text-orange-700 flex-1 flex items-center gap-1">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Licencias
              </h3>
              <button
                type="button"
                className="bg-black hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 transition-all"
                onClick={agregarLicencia}
                disabled={isSaving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Añadir licencia
              </button>
            </div>
            {form.licencias.length === 0 && (
              <div className="text-gray-500 text-sm mb-2">* Este software no tiene licencias registradas aún.</div>
            )}
            {form.licencias.map((lic, idx) => (
              <div key={idx} className="border-2 border-orange-200 rounded-xl p-4 mb-4 bg-white relative shadow-lg animate-fade-in">
                {form.licencias.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold text-lg transition-all"
                    onClick={() => quitarLicencia(idx)}
                    aria-label="Quitar licencia"
                    disabled={isSaving}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1 text-black">Correo</label>
                    <input
                      name="correo"
                      value={lic.correo}
                      onChange={e => handleLicenciaChange(idx, e)}
                      type="email"
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-black">Contraseña</label>
                    <input
                      name="contrasena"
                      value={lic.contrasena}
                      onChange={e => handleLicenciaChange(idx, e)}
                      type="password"
                      autoComplete="new-password"
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-black">Clave de licencia *</label>
                    <input
                      name="clave_licencia"
                      value={lic.clave_licencia}
                      onChange={e => handleLicenciaChange(idx, e)}
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-black">Tipo de licencia</label>
                    <select
                      name="tipo_licencia"
                      value={lic.tipo_licencia}
                      onChange={e => handleLicenciaChange(idx, e)}
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    >
                      {TIPO_LICENCIA.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-black">Fecha de adquisición</label>
                    <input
                      name="fecha_adquisicion"
                      type="date"
                      value={lic.fecha_adquisicion || ""}
                      onChange={e => handleLicenciaChange(idx, e)}
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    />
                  </div>
                  {lic.tipo_licencia !== "vitalicia" && (
                    <div>
                      <label className="block font-semibold mb-1 text-black">Fecha de caducidad</label>
                      <input
                        name="fecha_caducidad"
                        type="date"
                        value={lic.fecha_caducidad || ""}
                        onChange={e => handleLicenciaChange(idx, e)}
                        className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                        disabled={isSaving}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-semibold mb-1 text-black">Estado</label>
                    <select
                      name="estado"
                      value={lic.estado}
                      onChange={e => handleLicenciaChange(idx, e)}
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-black">Máx. dispositivos</label>
                    <input
                      name="max_dispositivos"
                      type="number"
                      min={1}
                      value={lic.max_dispositivos}
                      onChange={e => handleLicenciaChange(idx, e)}
                      className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                {/* Equipos asignados */}
                <div className="mt-4">
                  <label className="block font-semibold mb-1 text-black">Buscar equipo</label>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-black opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar por nombre"
                      className="border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-3 py-1 bg-white text-black font-semibold w-full transition-all"
                      value={searchEquipo}
                      onChange={e => setSearchEquipo(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer mb-2 transition-all">
                    <input
                      type="checkbox"
                      checked={lic.equipos.length === 0}
                      onChange={() => handleSinEquipo(idx)}
                      className="accent-orange-600 w-5 h-5 rounded transition-all"
                      disabled={isSaving}
                    />
                    <span className="text-black font-medium">Sin equipo asignado</span>
                  </label>
                  {lic.max_dispositivos > 0 && lic.equipos.length >= lic.max_dispositivos && (
                    <div className="text-orange-700 text-xs mt-1 mb-2">
                      Has alcanzado el máximo de equipos permitidos para esta licencia.
                    </div>
                  )}
                  {loadingEquipos ? (
                    <div className="text-sm text-black">Cargando equipos...</div>
                  ) : equiposError ? (
                    <div className="text-sm text-red-500">{equiposError}</div>
                  ) : (
                    <div
                      className="overflow-y-auto border border-orange-200 rounded-lg bg-white shadow-inner transition-all"
                      style={{ maxHeight: 320, minHeight: 0, transition: "all 0.3s" }}
                    >
                      <ul className="divide-y divide-orange-100">
                        {equiposFiltrados.length === 0 && (
                          <li className="text-sm text-gray-500 py-2 px-3">No hay equipos</li>
                        )}
                        {equiposFiltrados.slice(0, 50).map((equipo) => (
                          <li key={equipo.id}>
                            <label
                              className={`flex items-center gap-3 py-2 px-3 cursor-pointer group transition-all ${
                                lic.equipos.includes(equipo.id)
                                  ? "bg-orange-50"
                                  : "hover:bg-orange-100"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 flex items-center justify-center rounded border-2 ${
                                  lic.equipos.includes(equipo.id)
                                    ? "border-orange-700 bg-orange-600"
                                    : "border-orange-300 bg-white"
                                } transition-all`}
                                tabIndex={0}
                              >
                                {lic.equipos.includes(equipo.id) ? (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : null}
                                <input
                                  type="checkbox"
                                  checked={lic.equipos.includes(equipo.id)}
                                  onChange={e => {
                                    handleEquipoCheckbox(idx, equipo.id, e.target.checked);
                                  }}
                                  disabled={
                                    (!lic.equipos.includes(equipo.id) &&
                                    lic.equipos.length >= lic.max_dispositivos) || isSaving
                                  }
                                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                  tabIndex={-1}
                                />
                              </span>
                              <span className="text-black font-semibold transition-all">{equipo.nombre}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <small className="text-gray-500 block mt-2">Máx. 8-10 visibles a la vez. Usa la búsqueda o la barra para desplazarte.</small>
                </div>
                <div className="mt-2">
                  <label className="block font-semibold mb-1 text-black">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={lic.observaciones || ""}
                    onChange={e => handleLicenciaChange(idx, e)}
                    className="w-full border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg px-2 py-1 bg-white text-black font-semibold transition-all"
                    rows={2}
                    disabled={isSaving}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-black hover:bg-orange-700 text-white font-semibold transition-all"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-black text-white font-semibold transition-all"
              disabled={isSaving}
            >
              {isSaving
                ? "Guardando..."
                : initialData
                ? "Actualizar"
                : "Agregar"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        .scrollbar::-webkit-scrollbar { width: 8px; }
        .scrollbar::-webkit-scrollbar-thumb { background: #ff6600; border-radius: 7px; }
        .scrollbar { scrollbar-color: #ff6600 #fff; scrollbar-width: thin; }
      `}</style>
    </div>
  );
};

export default SoftwareForm;