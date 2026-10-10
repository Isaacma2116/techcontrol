/** Bloque titulado de un formulario largo (separado del anterior por una linea). */
export default function FormSection({ title, description, children }) {
  return (
    <section className="py-5 first:pt-0 last:pb-0 [&+&]:border-t [&+&]:border-slate-100">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
