import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldHalf,
  Loader2,
  Laptop2,
  Lock,
  BarChart3,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const REMEMBER_KEY = 'techcontrol_remembered_identifier';

const features = [
  { icon: Laptop2, text: 'Inventario centralizado de todos los equipos' },
  { icon: Lock, text: 'Acceso protegido con roles y permisos' },
  { icon: BarChart3, text: 'Reportes y alertas en tiempo real' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Al montar, si el usuario habia marcado "Recordarme" antes,
  // recuperamos su correo/usuario guardado (nunca la contrasenia:
  // esa la ofrece guardar el propio gestor de contrasenias del navegador).
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'Ingresa tu correo o nombre de usuario.';
    if (!password) errs.password = 'La contraseña es obligatoria.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(identifier.trim(), password, remember);

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, identifier.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Panel de marca - oculto en movil */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-12 text-oncolor lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <ShieldHalf size={24} className="text-brand-400" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight tracking-wide">TECHCONTROL</p>
            <p className="text-xs text-slate-300">Gestión de Activos TI</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Todo tu inventario de TI, en un solo lugar.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Administra equipos, licencias, mantenimientos y garantías con una
            plataforma pensada para equipos de tecnología.
          </p>

          <div className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={18} className="text-brand-400" />
                </div>
                <p className="text-sm text-slate-200">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} TechControl. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900/5 text-brand-500">
              <ShieldHalf size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-brand-500">TECHCONTROL</h1>
            <p className="mt-1 text-sm text-slate-500">Gestión de Activos TI</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-slate-800">Iniciar sesión</h2>
            <p className="mt-1 mb-6 text-sm text-slate-500">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-8 lg:p-0 lg:shadow-none lg:ring-0"
            noValidate
          >
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Correo electrónico o usuario
              </label>
              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="tu.correo@empresa.com o tu.usuario"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors
                    focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                    ${fieldErrors.identifier ? 'border-red-400' : 'border-slate-300'}`}
                />
              </div>
              {fieldErrors.identifier && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.identifier}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-colors
                    focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                    ${fieldErrors.password ? 'border-red-400' : 'border-slate-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="mb-5 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/30"
                />
                Recordarme en este dispositivo
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-oncolor transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Tu contraseña puede guardarse de forma segura con el gestor de
              contraseñas de tu navegador.
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 lg:hidden">
            © {new Date().getFullYear()} TechControl. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
