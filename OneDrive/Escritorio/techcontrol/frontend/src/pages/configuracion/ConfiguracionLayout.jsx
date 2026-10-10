import { useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GRUPOS, seccionesVisibles } from './secciones.js';

const linkBase = 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
const linkClass = (danger) => ({ isActive }) =>
  `${linkBase} ${
    danger
      ? isActive ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50'
      : isActive ? 'bg-brand-900/5 text-brand-500' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

/**
 * Estructura de Configuracion: menu de secciones (columna en escritorio, pestañas con
 * desplazamiento en movil) y el contenido de la seccion activa. Las secciones de
 * "Organizacion" solo se muestran a administradores (el backend lo exige igual).
 */
export default function ConfiguracionLayout() {
  const { user } = useAuth();
  const secciones = seccionesVisibles(user?.role);
  const tabsRef = useRef(null);

  // En movil, mantiene visible la pestaña activa.
  useEffect(() => {
    tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-800">Configuración</h2>
        <p className="text-sm text-slate-500">Administra tu cuenta y personaliza TechControl.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        {/* Movil / tablet: pestañas horizontales */}
        <nav ref={tabsRef} aria-label="Secciones de configuración (móvil)" className="table-scroll -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:hidden">
          {secciones.map((sec) => (
            <NavLink
              key={sec.id}
              to={sec.id}
              className={(st) => `${linkClass(sec.danger)(st)} shrink-0 whitespace-nowrap border ${st.isActive ? 'border-transparent' : 'border-slate-200 bg-white'}`}
            >
              <sec.icon size={16} /> {sec.titulo}
            </NavLink>
          ))}
        </nav>

        {/* Escritorio: menu lateral por grupos */}
        <nav aria-label="Secciones de configuración" className="hidden self-start lg:block">
          {GRUPOS.map((grupo) => {
            const items = secciones.filter((s) => s.grupo === grupo.id);
            if (!items.length) return null;
            return (
              <div key={grupo.id} className={grupo.id === 'peligro' ? 'mt-5 border-t border-slate-200 pt-4' : 'mb-5'}>
                {grupo.titulo && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{grupo.titulo}</p>}
                <ul className="space-y-0.5">
                  {items.map((sec) => (
                    <li key={sec.id}>
                      <NavLink to={sec.id} className={linkClass(sec.danger)}>
                        <sec.icon size={16} /> {sec.titulo}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
