import React, { useState, useEffect } from 'react';
import AuxiliaresForm, { AuxiliarFields } from './Auxiliares/AuxiliaresForm';

interface Colaborador {
  id: number; // Asegúrate que tu backend entrega el campo como 'id' (numérico)
  nombre: string;
  email: string;
}

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<EquipmentFormFields>;
}

interface EquipmentFormFields {
  colaborador_id: string;
  tipo: string;
  marca: string;
  modelo: string;
  procesador: string;
  ram: string;
  almacenamiento: string;
  sistema_operativo: string;
  numero_serie: string;
  estado: 'activo' | 'inactivo' | 'en_reparacion' | 'dado_de_baja';
  observaciones: string;
  fecha_adquisicion: string;
  foto_equipo: File | null;
}

const estados = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'dado_de_baja', label: 'Dado de baja' },
];

const initialState: EquipmentFormFields = {
  colaborador_id: '',
  tipo: '',
  marca: '',
  modelo: '',
  procesador: '',
  ram: '',
  almacenamiento: '',
  sistema_operativo: '',
  numero_serie: '',
  estado: 'activo',
  observaciones: '',
  fecha_adquisicion: '',
  foto_equipo: null,
};

const EquipmentForm: React.FC<EquipmentFormProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [form, setForm] = useState<EquipmentFormFields>({ ...initialState, ...initialData });
  const [preview, setPreview] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [auxiliares, setAuxiliares] = useState<AuxiliarFields[]>([]);
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    setForm({ ...initialState, ...initialData });
    if (initialData?.foto_equipo && typeof initialData.foto_equipo === 'string') {
      setPreview(initialData.foto_equipo);
    } else {
      setPreview(null);
    }
    setAuxiliares([]);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch(`${BASE_URL}/api/colaboradores`)
        .then(res => res.json())
        .then(data => {
          if (data?.data) setColaboradores(data.data);
        }).catch(() => { });
    }
  }, [isOpen, BASE_URL]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, foto_equipo: e.target.files![0] }));
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key === 'foto_equipo' && value) {
        data.append(key, value as File);
      } else if (key === 'colaborador_id') {
        // Si está vacío, envía vacío (el backend decide null), si no, envía el ID como string
        data.append('colaborador_id', value === '' ? '' : String(value));
      } else if (key !== 'foto_equipo') {
        data.append(key, value as string);
      }
    });
    data.append('auxiliares', JSON.stringify(auxiliares));

    // Puedes depurar lo que se envía:
    // for (var pair of data.entries()) {
    //   console.log(pair[0]+ ': ' + pair[1]);
    // }

    try {
      const response = await fetch(`${BASE_URL}/api/equipos`, {
        method: "POST",
        body: data,
        credentials: "include"
      });
      setLoading(false);
      if (!response.ok) {
        const err = await response.json();
        alert("Error: " + (err.message || "No se pudo registrar el equipo"));
        return;
      }
      alert("¡Equipo registrado!");
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      alert("Error de red al registrar equipo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl border-2 border-orange-500">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-orange-500 hover:text-white hover:bg-orange-500 rounded-full p-1 transition"
          aria-label="Cerrar"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-orange-200 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-t-lg">
          <h2 className="text-2xl font-bold text-white">Registrar Equipo</h2>
        </div>
        {/* Scrollable Form */}
        <div className="px-8 py-6 space-y-4 bg-white rounded-b-lg overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-orange-700">Colaborador</label>
                <select
                  name="colaborador_id"
                  value={form.colaborador_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Ninguno / Sin asignar</option>
                  {colaboradores.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.nombre} ({col.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Tipo</label>
                <input
                  type="text"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="Laptop, PC, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Procesador</label>
                <input
                  type="text"
                  name="procesador"
                  value={form.procesador}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">RAM</label>
                <input
                  type="text"
                  name="ram"
                  value={form.ram}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="Ej: 8GB"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Almacenamiento</label>
                <input
                  type="text"
                  name="almacenamiento"
                  value={form.almacenamiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="Ej: 256GB SSD"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Sistema Operativo</label>
                <input
                  type="text"
                  name="sistema_operativo"
                  value={form.sistema_operativo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Número de Serie</label>
                <input
                  type="text"
                  name="numero_serie"
                  value={form.numero_serie}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {estados.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-orange-700">Fecha de Adquisición</label>
                <input
                  type="date"
                  name="fecha_adquisicion"
                  value={form.fecha_adquisicion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-700">Observaciones</label>
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-700">Foto del equipo</label>
              <input
                type="file"
                name="foto_equipo"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full mt-1 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {preview && (
                <img src={preview} alt="Previsualización" className="mt-2 w-32 h-32 object-cover rounded border border-orange-200 shadow" />
              )}
            </div>

            {/* --- AUXILIARES --- */}
            <AuxiliaresForm auxiliares={auxiliares} setAuxiliares={setAuxiliares} />

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="px-4 py-2 bg-black text-white rounded hover:bg-orange-700 transition font-semibold"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-semibold"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentForm;