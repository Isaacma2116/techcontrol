import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Select, Input } from '../ui/FormField.jsx';
import { catalogoService } from '../../services/colaboradorService';

/**
 * Select de un catalogo (areas | cargos) con opcion de crear una entrada
 * nueva sin salir del formulario. Si se crea, avisa con onCreated(item).
 */
export default function CatalogSelect({ id, tipo, singular, items, value, onChange, onCreated, error }) {
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const cancel = () => {
    setAdding(false);
    setNombre('');
    setAddError('');
  };

  const save = async () => {
    const trimmed = nombre.trim();
    if (trimmed.length < 2) return setAddError('Escribe al menos 2 caracteres.');

    setSaving(true);
    setAddError('');
    try {
      const res = await catalogoService.create(tipo, trimmed);
      onCreated(res.data.item);
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
            maxLength={100}
            placeholder={`Nombre del ${singular}`}
            error={addError}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // no enviar el formulario principal
                save();
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                cancel();
              }
            }}
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-label={`Guardar ${singular}`}
            className="shrink-0 rounded-lg bg-brand-900 px-3 text-oncolor hover:bg-brand-800 disabled:opacity-60"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancelar"
            className="shrink-0 rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>
        {addError && <p className="mt-1 text-xs text-red-600" role="alert">{addError}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select id={id} value={value} error={error} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona…</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.nombre}</option>
        ))}
      </Select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title={`Agregar ${singular} nuevo`}
        aria-label={`Agregar ${singular} nuevo`}
        className="shrink-0 rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50 hover:text-brand-500"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
