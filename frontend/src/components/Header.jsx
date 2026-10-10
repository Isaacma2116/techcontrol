import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { roleLabels } from '../utils/menuConfig';
import Avatar from './ui/Avatar.jsx';
import NotificacionesPanel from './NotificacionesPanel.jsx';
import { perfilFotoUrl } from '../services/perfilService';

export default function Header({ pageTitle, onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { noLeidas, notificaciones, cargando, cargarLista, marcarLeida, marcarTodas } = useNotificaciones();

  const toggleNotif = () => {
    setNotifOpen((v) => {
      const next = !v;
      if (next) cargarLista();
      return next;
    });
  };
  // No se vuelve a pedir el contador al cerrar: las acciones (leer una, marcar
  // todas) ya lo actualizan de forma optimista; pedirlo aqui podia llegar antes
  // de que el PATCH de "leida" terminara en el servidor y pisar ese valor con
  // el viejo. El sondeo periodico (useNotificaciones) lo mantiene al dia solo.
  const closeNotif = () => setNotifOpen(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-800 sm:text-lg">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            onClick={toggleNotif}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label={noLeidas ? `Notificaciones (${noLeidas} sin leer)` : 'Notificaciones'}
            aria-haspopup="menu"
            aria-expanded={notifOpen}
          >
            <Bell size={20} />
            {noLeidas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-oncolor">
                {noLeidas > 99 ? '99+' : noLeidas}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeNotif} aria-hidden="true" />
              <NotificacionesPanel
                notificaciones={notificaciones}
                cargando={cargando}
                onLeer={marcarLeida}
                onMarcarTodas={marcarTodas}
                onClose={closeNotif}
              />
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menú de usuario"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <Avatar
              size="sm"
              src={perfilFotoUrl(user?.foto)}
              nombre={user?.nombres || user?.name}
              apellido={user?.apellidos}
              className="!bg-brand-900 !text-oncolor"
            />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs leading-tight text-slate-500">
                {roleLabels[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => goTo('/configuracion/perfil')}
                >
                  <User size={16} /> Mi perfil
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => goTo('/configuracion')}
                >
                  <Settings size={16} /> Configuración
                </button>
                <button
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
