import { useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

/**
 * Envoltura comun de los formularios de Equipo y Accesorio: modal con
 * cabecera/pie, banner de error general y confirmacion al cerrar con cambios.
 * El formulario (<form id={formId}>) va como `children`.
 */
export default function InventarioFormShell({
  title,
  subtitle,
  formId,
  submitLabel,
  saving,
  dirty,
  formError,
  onClose,
  children,
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        size="lg"
        title={title}
        subtitle={subtitle}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} icon={Save} loading={saving}>
              {submitLabel}
            </Button>
          </>
        }
      >
        {formError && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {children}
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar los cambios?"
        message="Hay información sin guardar. Si cierras ahora, se perderá."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        variant="danger"
        onConfirm={onClose}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
