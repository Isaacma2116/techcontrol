/** Interruptor on/off reutilizable (Notificaciones, Apariencia, Configuracion de seguridad...). */
export default function Switch({ checked, onChange, disabled, label, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
        ${checked ? 'bg-brand-900' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
