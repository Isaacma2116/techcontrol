import React, { useState } from "react";
import {
  FiCalendar, FiTool, FiAlertCircle, FiClock, FiEdit3, FiHash, FiXCircle, FiChevronLeft, FiEdit2, FiSave
} from "react-icons/fi";

type MantenimientoProgramado = {
  id: number;
  equipo_id: number;
  tipo_mantenimiento: "preventivo" | "correctivo";
  fecha_programada: string;
  prioridad: "alta" | "media" | "baja";
  descripcion: string;
  estado: "pendiente" | "realizado" | "reprogramado" | "no_realizado";
  fecha_creacion: string;
  fecha_reprogramada?: string | null;
};

type Props = {
  mantenimiento: MantenimientoProgramado;
  onClose: () => void;
  onReprogramado?: (nuevo: MantenimientoProgramado) => void;
};

const prioridadColor: Record<string, string> = {
  alta: "bg-orange-500 text-white",
  media: "bg-orange-200 text-orange-900",
  baja: "bg-gray-200 text-gray-800",
};

const estadoBadge: Record<string, string> = {
  pendiente: "bg-orange-100 text-orange-800 border-orange-300",
  realizado: "bg-black text-white border-black",
  reprogramado: "bg-white text-black border-gray-400",
  no_realizado: "bg-white text-black border-gray-400",
};

const mantenimientoIcon = (tipo: string) =>
  tipo === "preventivo" ? (
    <FiTool className="w-5 h-5 inline-block mr-1 text-orange-500" />
  ) : (
    <FiAlertCircle className="w-5 h-5 inline-block mr-1 text-orange-700" />
  );

const BASE_URL = import.meta.env.VITE_API_URL;

const VerMantenimientoProgramado: React.FC<Props> = ({
  mantenimiento,
  onClose,
  onReprogramado,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState(mantenimiento.fecha_programada);
  const [fechaReprogramada, setFechaReprogramada] = useState(mantenimiento.fecha_reprogramada);

  const puedeReprogramar =
    mantenimiento.estado !== "realizado";

  const handleAbrirModal = () => {
    setNuevaFecha(
      (fechaReprogramada || fechaProgramada).slice(0, 16)
    );
    setShowModal(true);
  };

  const handleGuardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const resp = await fetch(`${BASE_URL}/api/mantenimientos/${mantenimiento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_programada: nuevaFecha,
          fecha_reprogramada: nuevaFecha,
          estado: "reprogramado",
        }),
      });
      if (!resp.ok) throw new Error("Error al reprogramar");
      setShowModal(false);
      setFechaProgramada(nuevaFecha);
      setFechaReprogramada(nuevaFecha);
      const actualizado = { ...mantenimiento, fecha_programada: nuevaFecha, fecha_reprogramada: nuevaFecha, estado: "reprogramado" };
      if (onReprogramado) onReprogramado(actualizado);
    } catch (err) {
      alert("No se pudo reprogramar el mantenimiento");
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative border-t-8 border-orange-500 animate-slide-up">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl transition"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FiXCircle />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-orange-500 text-white rounded-full p-2 shadow">
            <FiCalendar className="w-6 h-6" />
          </span>
          <span className="text-2xl font-bold text-black">Detalle del Mantenimiento</span>
        </div>
        <ul className="space-y-4">
          <li className="flex items-center gap-2">
            <FiHash className="text-orange-400" />
            <span className="font-medium text-gray-900">ID:</span>
            <span className="text-gray-800">{mantenimiento.id}</span>
          </li>
          <li className="flex items-center gap-2">
            <FiTool className="text-orange-400" />
            <span className="font-medium text-gray-900">Equipo ID:</span>
            <span className="text-gray-800">{mantenimiento.equipo_id}</span>
          </li>
          <li className="flex items-center gap-2">
            {mantenimientoIcon(mantenimiento.tipo_mantenimiento)}
            <span className="font-medium text-gray-900">Tipo de mantenimiento:</span>
            <span className="capitalize text-gray-800">{mantenimiento.tipo_mantenimiento}</span>
          </li>
          <li className="flex items-center gap-2">
            <FiClock className="text-orange-400" />
            <span className="font-medium text-gray-900">Fecha programada:</span>
            <span className="text-gray-800 font-semibold">
              {new Date(fechaProgramada).toLocaleString()}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <FiChevronLeft className="text-orange-400" />
            <span className="font-medium text-gray-900">Prioridad:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${prioridadColor[mantenimiento.prioridad]}`}
            >
              {mantenimiento.prioridad.charAt(0).toUpperCase() + mantenimiento.prioridad.slice(1)}
            </span>
          </li>
          <li>
            <div className="flex items-center gap-2 mb-1">
              <FiEdit3 className="text-orange-400" />
              <span className="font-medium text-gray-900">Descripción:</span>
            </div>
            <div className="border rounded px-3 py-2 bg-orange-50 text-gray-800 shadow-inner text-sm whitespace-pre-line">
              {mantenimiento.descripcion}
            </div>
          </li>
          <li className="flex items-center gap-2">
            <FiCalendar className="text-orange-400" />
            <span className="font-medium text-gray-900">Estado:</span>
            <span
              className={`px-3 py-1 rounded-full border text-sm font-semibold capitalize ${
                estadoBadge[mantenimiento.estado]
              }`}
            >
              {mantenimiento.estado.replace("_", " ")}
            </span>
          </li>
        </ul>

        {puedeReprogramar && (
          <div className="mt-8 flex justify-center">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              onClick={handleAbrirModal}
            >
              <FiEdit2 className="w-5 h-5" /> Reprogramar fecha
            </button>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            className="px-6 py-2 rounded-full font-bold bg-black hover:bg-orange-500 text-white shadow transition-all duration-200"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal para editar la fecha */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fade-in">
          <form
            onSubmit={handleGuardarReprogramacion}
            className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative border-t-8 border-orange-500 animate-slide-up space-y-4"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl transition"
              onClick={() => setShowModal(false)}
              type="button"
            >
              <FiXCircle />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FiEdit2 className="text-orange-500 w-6 h-6" />
              <span className="text-lg font-bold text-black">Reprogramar Fecha</span>
            </div>
            <label className="block text-gray-800 font-medium mb-2">
              Nueva fecha y hora
              <input
                type="datetime-local"
                className="mt-2 border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                value={nuevaFecha}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setNuevaFecha(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="w-full py-2 rounded-full font-bold bg-orange-500 hover:bg-black text-white shadow transition-all duration-200 flex items-center justify-center gap-2"
              disabled={guardando || !nuevaFecha || nuevaFecha === (fechaReprogramada || fechaProgramada).slice(0, 16)}
            >
              <FiSave />
              {guardando ? "Guardando..." : "Guardar nueva fecha"}
            </button>
          </form>
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(60px); opacity:0; }
          to { transform: translateY(0); opacity:1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(.33,1.03,.69,.98);}
      `}</style>
    </div>
  );
};

export default VerMantenimientoProgramado;