import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-900 text-oncolor hover:bg-brand-800 focus-visible:ring-brand-500/40',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-oncolor hover:bg-red-700 focus-visible:ring-red-300',
};

export default function Button({
  variant = 'primary',
  loading = false,
  icon: Icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold
        transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
