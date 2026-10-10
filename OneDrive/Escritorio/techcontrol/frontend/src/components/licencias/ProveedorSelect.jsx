import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Select, Input } from '../ui/FormField.jsx';
import { proveedorService } from '../../services/licenciaService';

/**
 * Select de proveedores (fabricante/distribuidor), con opcion de dar de alta
 * uno nuevo sin salir del formulario (solo el nombre; los demas datos se
 * completan despues editando el proveedor).
 */
export default function ProveedorSelect({ id, value, onChange, error, label = 'Proveedor' }) {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    proveedorService.list({ activo: 'true', limit: 200 }).then((res) => setItems(res.data.proveedores)).catch(() => setItems([]));
  }, []);

  const cancel = () => { setAdding(false); setNombre(''); setAddError(''); };

  const save = async () => {
    const trimmed = nombre.trim();
    if (trimmed.length < 2) return setAddError('Escribe al menos 2 caracteres.');
    setSaving(true);
    setAddError('');
    try {
      const res = await proveedorService.create({ nombre: trimmed });
      setItems((list) => [...list, res.data.proveedor].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onChange(String(res.data.proveedor.id));
      cancel();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div>
        <div className="flex gap-2">
          <Input
            id={id}
            autoFocus
            value={nombre}
            maxLength={150}
            placeholder="Nombre del proveedor"
            error={addError}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); save(); }
              if (e.key === 'Escape') { e.stopPropagation(); cancel(); }
            }}
          />
          <button type="button" onClick={save} disabled={saving} aria-label="Guardar proveedor" className="shrink-0 rounded-lg bg-brand-900 px-3 text-oncolor hover:bg-brand-800 disabled:opacity-60">
            <Check size={16} />
          </button>
          <button type="button" onClick={cancel} aria-label="Cancelar" className="shrink-0 rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50">
            <X size={16} />
          </button>
        </div>
        {addError && <p className="mt-1 text-xs text-red-600" role="alert">{addError}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select id={id} value={value} error={error} disabled={!items} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sin proveedor</option>
        {items?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </Select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title={`Agregar ${label.toLowerCase()} nuevo`}
        aria-label={`Agregar ${label.toLowerCase()} nuevo`}
        className="shrink-0 rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50 hover:text-brand-500"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
