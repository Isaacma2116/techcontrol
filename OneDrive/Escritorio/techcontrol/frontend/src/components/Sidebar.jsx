import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ShieldHalf, X } from 'lucide-react';
import { getVisibleMenu } from '../utils/menuConfig';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const sections = getVisibleMenu(user?.role);

  return (
    <>
      {/* Overlay en movil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-900 text-slate-200
          transition-transform duration-200 lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-oncolor/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-400/20 text-brand-400">
              <ShieldHalf size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight tracking-wide text-oncolor">
                TECHCONTROL
              </p>
              <p className="text-[11px] leading-tight text-slate-400">
                Gestión de Activos TI
              </p>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="table-scroll flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = Icons[item.icon] || Icons.Circle;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? 'bg-brand-400/15 text-oncolor'
                              : 'text-slate-300 hover:bg-oncolor/5 hover:text-oncolor'
                          }`
                        }
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-oncolor/10 px-4 py-3 text-[11px] text-slate-500">
          TechControl v1.0 · Etapa 1
        </div>
      </aside>
    </>
  );
}
