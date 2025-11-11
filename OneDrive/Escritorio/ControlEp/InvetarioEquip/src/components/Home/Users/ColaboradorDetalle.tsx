import React from "react";

interface Colaborador {
  _id: string;
  nombre: string;
  foto?: string;
  email: string;
  telefono?: string;
  departamento?: string;
  creado_en: string;
  actualizado_en: string;
}

interface ColaboradorDetalleProps {
  colaborador: Colaborador;
  onBack: () => void;
  onEdit: () => void;
}

const ColaboradorDetalle: React.FC<ColaboradorDetalleProps> = ({ colaborador, onBack, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-orange-600 hover:text-orange-800 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver al listado
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Detalles del Colaborador</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 flex flex-col items-center">
          {colaborador.foto ? (
            <img
              src={colaborador.foto}
              alt={colaborador.nombre}
              className="h-40 w-40 rounded-full object-cover border-4 border-orange-200"
            />
          ) : (
            <div className="h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-orange-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          <h2 className="mt-4 text-xl font-semibold text-gray-800">{colaborador.nombre}</h2>
          <p className="text-orange-600">{colaborador.email}</p>
        </div>

        <div className="col-span-2">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Nombre completo</p>
                <p className="font-medium text-gray-900">{colaborador.nombre}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium text-gray-900">{colaborador.email}</p>
              </div>
              
              {colaborador.telefono && (
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{colaborador.telefono}</p>
                </div>
              )}
              
              {colaborador.departamento && (
                <div>
                  <p className="text-sm text-gray-500">Departamento</p>
                  <p className="font-medium text-gray-900">{colaborador.departamento}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Fecha de registro</p>
                <p className="font-medium text-gray-900">
                  {new Date(colaborador.creado_en).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Última actualización</p>
                <p className="font-medium text-gray-900">
                  {new Date(colaborador.actualizado_en).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Volver
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Editar Información
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColaboradorDetalle;