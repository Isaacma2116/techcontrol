import React, { useState } from "react";

type Props = {
  equipoId: number;
  colorActual?: string;
  onSave: (newColor: string) => void;
  onClose: () => void;
};

export default function EquipoColorForm({ equipoId, colorActual, onSave, onClose }: Props) {
  const [color, setColor] = useState(colorActual || "#FFA500");
  const [loading, setLoading] = useState(false);

  // Enviar el cambio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(color);
    setLoading(false);
    onClose();
  };

  return (
    <form
      className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col items-center py-4 px-6 min-w-[220px] animate-fade-in"
      style={{ left: "40px", top: "-16px" }}
      onClick={e => e.stopPropagation()}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-4 mb-4">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-inner outline-none cursor-pointer transition-all duration-200 hover:scale-110"
        />
        <span className="text-gray-600 text-sm font-medium">
          Color actual: <span className="font-bold">{color.toUpperCase()}</span>
        </span>
      </div>
      <div className="text-xs text-gray-500 mb-3 text-center">
        <span className="block">Haz clic en el círculo para elegir el color que <br /> quieres mostrar para este equipo en el calendario.</span>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-semibold text-sm transition"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded font-semibold text-sm transition"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}