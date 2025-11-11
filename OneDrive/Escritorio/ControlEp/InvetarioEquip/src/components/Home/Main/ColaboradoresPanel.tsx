import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api/colaboradores";

type Colaborador = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  departamento?: string;
  foto?: string;
  creado_en?: string;
};

export function ColaboradoresPanel() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener los colaboradores");
        return res.json();
      })
      .then((data) => setColaboradores(data.data || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Diseña Chips únicos para departamentos
  const departamentos = [...new Set(colaboradores.map(c => c.departamento || "Sin departamento"))];

  return (
    <section className="w-full max-w-5xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
        <h2 className="text-2xl font-bold mb-6 text-slate-750">Colaboradores</h2>
        {loading && (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-7 w-7 text-blue-400 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-slate-500">Cargando colaboradores...</span>
          </div>
        )}
        {error && (
          <p className="text-red-600 rounded bg-red-50 px-4 py-2 mb-4 text-center">{error}</p>
        )}
        {!loading && !error && (
          <>
            <div className="flex flex-wrap gap-8 mb-8">
              <div className="flex-1 min-w-[160px] bg-gradient-to-br from-indigo-100 via-sky-100 to-cyan-100 rounded-xl py-7 px-4 shadow text-center">
                <div className="text-4xl font-bold text-indigo-700">
                  {colaboradores.length}
                </div>
                <div className="text-slate-500 uppercase tracking-wide mt-2 text-xs font-medium">
                  Total colaboradores
                </div>
              </div>
              <div className="flex-1 min-w-[220px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl py-7 px-4 flex flex-col items-center shadow">
                <div className="text-xs font-semibold text-center text-gray-600 mb-2 uppercase">Departamentos</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {departamentos.map(dep => (
                    <span
                      key={dep}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-200 to-cyan-100 text-blue-800 font-semibold text-xs shadow"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-5 flex items-center gap-3">
              <h3 className="font-semibold text-lg text-slate-700">Últimos añadidos</h3>
              <span className="text-[10px] rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-semibold">
                Mostrando {colaboradores.slice(0, 5).length} / {colaboradores.length}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-slate-50">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="py-2 px-3 font-bold">Nombre</th>
                    <th className="py-2 px-3 font-bold">Email</th>
                    <th className="py-2 px-3 font-bold hidden sm:table-cell">Departamento</th>
                    <th className="py-2 px-3 font-bold hidden sm:table-cell">Teléfono</th>
                    <th className="py-2 px-3 font-bold">Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradores.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50 transition-all border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium flex items-center gap-2">
                        {c.foto ? (
                          <img
                            src={c.foto.startsWith("http") ? c.foto : `/uploads${c.foto}`}
                            alt={c.nombre}
                            className="w-7 h-7 object-cover rounded-full shadow"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">{c.nombre.slice(0, 1)}</span>
                        )}
                        {c.nombre}
                      </td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">{c.departamento || "-"}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">{c.telefono || "-"}</td>
                      <td className="px-3 py-2">{c.creado_en ? String(c.creado_en).slice(0, 10) : "-"}</td>
                    </tr>
                  ))}
                  {colaboradores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-500 py-5">
                        No hay colaboradores registrados.
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