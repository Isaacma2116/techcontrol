import { forwardRef } from 'react';

export const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors
   placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
   ${
     hasError
       ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
       : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
   }`;

/** Etiqueta + control + mensaje de error/ayuda. */
export function Field({ label, htmlFor, required, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={!!error}
      className={`${inputClass(!!error)} ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ error, className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={!!error}
      className={`${inputClass(!!error)} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ error, className = '', rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={!!error}
      className={`${inputClass(!!error)} ${className}`}
      {...props}
    />
  );
});
