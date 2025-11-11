import React from 'react';

export interface AuxiliarFields {
  nombre: string;
  numero_serie: string;
}

interface AuxiliaresFormProps {
  auxiliares: AuxiliarFields[];
  setAuxiliares: React.Dispatch<React.SetStateAction<AuxiliarFields[]>>;
  auxiliaresDisponibles?: string[]; // Prop opcional, default vacío
}

const AuxiliaresForm: React.FC<AuxiliaresFormProps> = ({
  auxiliares,
  setAuxiliares,
  auxiliaresDisponibles = [], // Valor por defecto para evitar errores
}) => {
  const handleAuxiliarChange = (idx: number, field: keyof AuxiliarFields, value: string) => {
    setAuxiliares(prev =>
      prev.map((aux, i) => i === idx ? { ...aux, [field]: value } : aux)
    );
  };

  const handleAddAuxiliar = () => {
    setAuxiliares(prev => [...prev, { nombre: '', numero_serie: '' }]);
  };

  const handleRemoveAuxiliar = (idx: number) => {
    setAuxiliares(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-orange-700 mb-2">Auxiliares</h3>
      {auxiliares.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">No hay auxiliares agregados.</p>
      )}
      {auxiliares.map((aux, idx) => (
        <div key={idx} className="flex gap-2 mt-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-orange-700">Nombre</label>
            <input
              type="text"
              list={`auxiliares-list-${idx}`}
              value={aux.nombre}
              onChange={e => handleAuxiliarChange(idx, 'nombre', e.target.value)}
              className="w-full px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nombre del auxiliar"
              required
            />
            <datalist id={`auxiliares-list-${idx}`}>
              {auxiliaresDisponibles.map((nombre, i) => (
                <option value={nombre} key={i} />
              ))}
            </datalist>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-orange-700">Número de Serie</label>
            <input
              type="text"
              value={aux.numero_serie}
              onChange={e => handleAuxiliarChange(idx, 'numero_serie', e.target.value)}
              className="w-full px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Número de serie"
              required
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveAuxiliar(idx)}
            className="ml-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full p-1 transition"
            title="Eliminar auxiliar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* Botón centrado y más visible */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={handleAddAuxiliar}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg shadow-lg font-bold text-base hover:bg-orange-600 transition"
        >
          + Agregar auxiliar
        </button>
      </div>
    </div>
  );
};

export default AuxiliaresForm;