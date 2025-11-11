import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000/api/equipos';

type Equipo = {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  tipo: string;
  estado: string;
  fecha_adquisicion: string | null;
};

export function EquiposPanel() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener los equipos');
        return res.json();
      })
      .then(data => setEquipos(data))
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const totalEquipos = equipos.length;
  const activos = equipos.filter(eq => eq.estado?.toLowerCase() === 'activo').length;
  const tiposUnicos = Array.from(new Set(equipos.map(eq => eq.tipo)));

  // Obtén color para el estado
  function estadoColor(estado: string) {
    if (!estado) return 'bg-slate-300 text-slate-700';
    switch (estado.toLowerCase()) {
      case 'activo': return 'bg-green-100 text-green-700';
      case 'en mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'dado de baja': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  }

  return (
    <section className="w-full max-w-5xl mx-auto mb-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
        <h2 className="text-2xl font-bold mb-6 text-slate-750">Equipos</h2>
        {loading && (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-7 w-7 text-cyan-400 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-15" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-slate-500">Cargando equipos...</span>
          </div>
        )}
        {error && (
          <p className="text-red-600 rounded bg-red-50 px-4 py-2 mb-4 text-center">{error}</p>
        )}
        {!loading && !error && (
          <>
            <div className="flex flex-wrap gap-8 mb-8">
              <div className="flex-1 min-w-[160px] bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 rounded-xl py-7 px-4 shadow text-center">
                <div className="text-4xl font-bold text-orange-700">{totalEquipos}</div>
                <div className="text-slate-500 uppercase tracking-wide mt-2 text-xs font-medium">Total Equipos</div>
              </div>
              <div className="flex-1 min-w-[160px] bg-gradient-to-br from-green-100 via-white to-green-50 rounded-xl py-7 px-4 shadow text-center">
                <div className="text-4xl font-bold text-green-800">{activos}</div>
                <div className="text-slate-500 uppercase tracking-wide mt-2 text-xs font-medium">Equipos activos</div>
              </div>
              <div className="flex-1 min-w-[120px] bg-gradient-to-br from-blue-100 via-white to-sky-100 rounded-xl py-7 px-4 shadow text-center">
                <div className="text-4xl font-bold text-blue-800">{tiposUnicos.length}</div>
                <div className="text-slate-500 uppercase tracking-wide mt-2 text-xs font-medium">Tipos</div>
              </div>
            </div>
            <div className="mb-5 flex items-center gap-3">
              <h3 className="font-semibold text-lg text-slate-700">Últimos equipos</h3>
              <span className="text-[10px] rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 font-semibold">
                Mostrando {equipos.slice(0, 5).length} / {equipos.length}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-slate-50">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="py-2 px-3 font-bold">Nombre</th>
                    <th className="py-2 px-3 font-bold">Marca</th>
                    <th className="py-2 px-3 font-bold">Modelo</th>
                    <th className="py-2 px-3 font-bold hidden md:table-cell">Tipo</th>
                    <th className="py-2 px-3 font-bold">Estado</th>
                    <th className="py-2 px-3 font-bold hidden sm:table-cell">Adquisición</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.slice(0, 5).map(eq => (
                    <tr key={eq.id} className="hover:bg-amber-50 transition-all border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium">{eq.nombre}</td>
                      <td className="px-3 py-2">{eq.marca}</td>
                      <td className="px-3 py-2">{eq.modelo}</td>
                      <td className="px-3 py-2 hidden md:table-cell">{eq.tipo}</td>
                      <td className="px-3 py-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(eq.estado)}`}>
                          {eq.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">{eq.fecha_adquisicion || "-"}</td>
                    </tr>
                  ))}
                  {equipos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-5">
                        No hay equipos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}