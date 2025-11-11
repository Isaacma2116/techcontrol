import React, { useState } from "react";

type Equipo = {
  id: number;
  marca: string;
  modelo: string;
  tipo: string;
};

type Props = {
  equipo?: Equipo | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const BASE_URL = import.meta.env.VITE_API_URL;

const AgendarMantenimientoForm: React.FC<Props> = ({ equipo, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    equipo_id: equipo?.id || "",
    tipo_mantenimiento: "preventivo",
    fecha_programada: "",
    prioridad: "media",
    descripcion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipo_id || !form.fecha_programada || !form.descripcion) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch(`${BASE_URL}/api/mantenimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipo_id: Number(form.equipo_id),
          tipo_mantenimiento: form.tipo_mantenimiento,
          fecha_programada: form.fecha_programada,
          prioridad: form.prioridad,
          descripcion: form.descripcion,
          estado: "pendiente",
        }),
      });
      if (!resp.ok) throw new Error("No se pudo agendar el mantenimiento");
      setLoading(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      {/* Equipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo *</label>
        <input
          type="text"
          name="equipo_id"
          value={equipo ? `${equipo.marca} ${equipo.modelo}` : ""}
          className="border rounded px-3 py-2 w-full bg-gray-100"
          readOnly
          required
        />
      </div>
      {/* Tipo de mantenimiento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de mantenimiento *</label>
        <select
          name="tipo_mantenimiento"
          value={form.tipo_mantenimiento}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full"
          required
        >
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
        </select>
      </div>
      {/* Fecha programada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora programada *</label>
        <input
          type="datetime-local"
          name="fecha_programada"
          value={form.fecha_programada}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full"
          required
        />
      </div>
      {/* Prioridad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
        <select
          name="prioridad"
          value={form.prioridad}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full"
          required
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>
      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full"
          rows={3}
          required
          placeholder="Describe el motivo o tareas del mantenimiento"
        />
      </div>
      {/* Botones */}
      <div className="flex gap-2 justify-end mt-2">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          disabled={loading}
        >
          {loading ? "Agendando..." : "Agendar"}
        </button>
      </div>
    </form>
  );
};

export default AgendarMantenimientoForm;