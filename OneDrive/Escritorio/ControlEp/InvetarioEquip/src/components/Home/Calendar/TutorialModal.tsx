import React from "react";
import { FiCalendar, FiPlus, FiSearch, FiEdit2, FiMousePointer } from "react-icons/fi";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TutorialModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative border-t-8 border-orange-500 animate-slide-up">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl transition"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <FiCalendar className="w-8 h-8 text-orange-500" />
          <span className="text-2xl font-bold text-black">
            Bienvenido al Calendario de Mantenimientos
          </span>
        </div>
        <ul className="space-y-5 text-base">
          <li className="flex gap-2 items-start">
            <FiSearch className="w-6 h-6 text-orange-400 mt-1" />
            <div>
              <b>Busca y filtra equipos:</b> Usa la barra lateral izquierda para buscar equipos por marca, modelo o tipo.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <FiPlus className="w-6 h-6 text-orange-400 mt-1" />
            <div>
              <b>Agendar mantenimiento:</b> Haz clic en <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"><FiPlus /> Agendar</span> junto a cualquier equipo para programar un nuevo mantenimiento.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <FiMousePointer className="w-6 h-6 text-orange-400 mt-1" />
            <div>
              <b>¡Arrastra para agendar!</b> Puedes arrastrar un equipo desde la lista y soltarlo en el calendario para agendar un mantenimiento de forma rápida.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <FiEdit2 className="w-6 h-6 text-orange-400 mt-1" />
            <div>
              <b>Personaliza colores:</b> Haz clic en el círculo de color de cada equipo para elegir un color que lo distinga en el calendario.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <FiCalendar className="w-6 h-6 text-orange-400 mt-1" />
            <div>
              <b>Ver y gestionar mantenimientos:</b> Haz clic en cualquier evento del calendario para ver sus detalles, marcarlo como realizado, reagendarlo o consultar el historial.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="inline-block w-6 h-6 bg-black rounded-full mt-1" />
            <div>
              <b>Colores de eventos:</b> El color del evento indica el estado: <span className="bg-orange-400 text-black px-2 py-1 rounded ml-1">Pendiente</span>, <span className="bg-black text-white px-2 py-1 rounded ml-1">Realizado</span>, <span className="bg-white text-black border border-gray-400 px-2 py-1 rounded ml-1">Reprogramado/No realizado</span>.
            </div>
          </li>
        </ul>
        <div className="mt-8 flex justify-end">
          <button
            className="px-6 py-2 rounded-full font-bold bg-orange-500 hover:bg-black text-white shadow transition-all duration-200"
            onClick={onClose}
          >
            ¡Entendido!
          </button>
        </div>
        <style>{`
          @keyframes slide-up {
            from { transform: translateY(60px); opacity:0; }
            to { transform: translateY(0); opacity:1; }
          }
          .animate-slide-up { animation: slide-up 0.4s cubic-bezier(.33,1.03,.69,.98);}
        `}</style>
      </div>
    </div>
  );
}