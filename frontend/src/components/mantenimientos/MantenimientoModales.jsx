import MantenimientoForm from './MantenimientoForm.jsx';
import MantenimientoDetalle from './MantenimientoDetalle.jsx';
import RealizarModal from './RealizarModal.jsx';
import ReprogramarModal from './ReprogramarModal.jsx';
import CancelarModal from './CancelarModal.jsx';

/**
 * Ventanas del modulo (agendar/editar, detalle, registrar lo realizado,
 * reprogramar y cancelar). Las usan tanto la pantalla de Mantenimientos como la
 * seccion de mantenimientos en la ficha de una unidad.
 *
 *  - modal: { tipo: 'form' | 'detalle' | 'realizar' | 'reprogramar' | 'cancelar', ... }
 *  - onGuardado(mantenimiento): se guardo algo (cierra y recarga)
 *  - onCambio(): hubo un cambio que no cierra la ventana (p. ej. "en proceso")
 */
export default function MantenimientoModales({ modal, setModal, onGuardado, onCambio, canManage, unidad }) {
  if (!modal) return null;

  return (
    <>
      {modal.tipo === 'form' && (
        <MantenimientoForm
          mantenimiento={modal.mantenimiento}
          fecha={modal.fecha}
          unidad={modal.mantenimiento ? undefined : unidad}
          onClose={() => setModal(null)}
          onSaved={onGuardado}
        />
      )}
      {modal.tipo === 'detalle' && (
        <MantenimientoDetalle
          id={modal.id}
          canManage={canManage}
          onClose={() => setModal(null)}
          onChanged={onCambio}
          onEditar={(m) => setModal({ tipo: 'form', mantenimiento: m })}
          onRealizar={(m) => setModal({ tipo: 'realizar', mantenimiento: m })}
          onReprogramar={(m) => setModal({ tipo: 'reprogramar', mantenimiento: m })}
          onCancelar={(m) => setModal({ tipo: 'cancelar', mantenimiento: m })}
        />
      )}
      {modal.tipo === 'realizar' && (
        <RealizarModal mantenimiento={modal.mantenimiento} onClose={() => setModal(null)} onDone={onGuardado} />
      )}
      {modal.tipo === 'reprogramar' && (
        <ReprogramarModal mantenimiento={modal.mantenimiento} onClose={() => setModal(null)} onDone={onGuardado} />
      )}
      {modal.tipo === 'cancelar' && (
        <CancelarModal mantenimiento={modal.mantenimiento} onClose={() => setModal(null)} onDone={onGuardado} />
      )}
    </>
  );
}
