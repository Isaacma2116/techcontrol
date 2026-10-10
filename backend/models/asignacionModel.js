const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/audit');
const notificacionModel = require('./notificacionModel');
const {
  KINDS,
  ESTADOS_MANUALES,
  localDateString,
  localDateTimeString,
  resolveFecha,
} = require('../utils/inventario');

/**
 * Asignaciones y devoluciones (equipos, accesorios, impresoras y celulares).
 * Toda operacion corre en UNA transaccion con los registros bloqueados
 * (SELECT ... FOR UPDATE), de modo que dos personas asignando el mismo equipo
 * a la vez nunca dejan datos inconsistentes; ademas la base tiene un indice
 * unico que impide dos asignaciones vigentes del mismo equipo.
 *
 * Reglas:
 *  - Solo se asigna un item en estado DISPONIBLE a un colaborador ACTIVO.
 *  - Asignar => item ASIGNADO. Devolver => item pasa al estado elegido
 *    (por defecto DISPONIBLE). El historial nunca se borra ni se edita.
 */

// condicion al devolver -> estado fisico del equipo
const ESTADO_FISICO_POR_CONDICION = { bueno: 'bueno', regular: 'regular', danado: 'malo' };

function cfgOf(kind) {
  const cfg = KINDS[kind];
  if (!cfg) throw new Error(`Tipo de inventario desconocido: ${kind}`);
  return cfg;
}

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Crea una asignacion dentro de la transaccion `conn`.
 * Devuelve el id de la asignacion.
 */
async function assignTx(conn, kind, { itemId, colaboradorId, fecha, observaciones, userId, ip }) {
  const cfg = cfgOf(kind);

  const [[item]] = await conn.query(
    `SELECT id, codigo_inventario, estado FROM ${cfg.table} WHERE id = :id FOR UPDATE`,
    { id: itemId }
  );
  if (!item) throw new AppError(`${cfg.Art} ${cfg.label} no existe.`, 404);
  if (item.estado !== 'disponible') {
    throw new AppError(
      `${cfg.Art} ${cfg.label} no está disponible para asignar (estado actual: ${item.estado}).`,
      409
    );
  }

  const [[colaborador]] = await conn.query(
    `SELECT id, activo, CONCAT_WS(' ', nombre, apellido_paterno, apellido_materno) AS nombre_completo
       FROM colaboradores WHERE id = :id FOR SHARE`,
    { id: colaboradorId }
  );
  if (!colaborador) throw fieldError(404, 'El colaborador no existe.', 'colaborador_id');
  if (!colaborador.activo) {
    throw fieldError(409, 'El colaborador está inactivo; no se le pueden asignar equipos.', 'colaborador_id');
  }

  let insertId;
  try {
    const [result] = await conn.query(
      `INSERT INTO ${cfg.asigTable}
         (${cfg.asigFk}, colaborador_id, fecha_asignacion, asignado_por, observaciones_asignacion)
       VALUES (:itemId, :colaboradorId, :fecha, :userId, :observaciones)`,
      {
        itemId,
        colaboradorId,
        fecha: resolveFecha(fecha),
        userId: userId ?? null,
        observaciones: observaciones || null,
      }
    );
    insertId = result.insertId;
  } catch (err) {
    // Red de seguridad del indice unico (asignacion vigente duplicada).
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(`${cfg.Art} ${cfg.label} ya tiene una asignación activa.`, 409);
    }
    throw err;
  }

  await conn.query(`UPDATE ${cfg.table} SET estado = 'asignado', fecha_baja = NULL WHERE id = :id`, {
    id: itemId,
  });

  await logAudit(conn, {
    userId, ip, action: 'asignado', entity: cfg.label, entityId: itemId,
    details: { codigo_inventario: item.codigo_inventario, colaborador_id: colaboradorId, colaborador_nombre: colaborador.nombre_completo },
  });

  // La clave de dedup usa el id de ESTA asignacion (no el del equipo): un equipo se
  // asigna muchas veces a lo largo de su vida y cada una debe poder notificar.
  await notificacionModel.notificarRoles(conn, {
    roles: notificacionModel.ALL_ROLES, tipo: 'asignacion_nueva', prioridad: 'info',
    titulo: 'Nueva asignación',
    mensaje: `Se asignó ${cfg.art} ${cfg.label} ${item.codigo_inventario} a ${colaborador.nombre_completo}.`,
    modulo: cfg.kind, entidadId: itemId, enlace: `/${cfg.kind}/${itemId}`,
    claveDedup: notificacionModel.claveDedup('asignacion_nueva', cfg.kind, insertId),
  });

  return insertId;
}

/**
 * Cierra una asignacion vigente dentro de la transaccion `conn`.
 *  - condicion: bueno | regular | danado | perdido (opcional en cambios internos)
 *  - nuevoEstado: estado del item tras la devolucion (default 'disponible')
 */
async function returnTx(conn, kind, asignacionId, { fecha, condicion, observaciones, nuevoEstado, userId, ip }) {
  const cfg = cfgOf(kind);

  const [[asignacion]] = await conn.query(
    `SELECT * FROM ${cfg.asigTable} WHERE id = :id FOR UPDATE`,
    { id: asignacionId }
  );
  if (!asignacion) throw new AppError('Asignación no encontrada.', 404);
  if (asignacion.fecha_devolucion) throw new AppError('Esta asignación ya fue devuelta.', 409);

  const itemId = asignacion[cfg.asigFk];
  const [[itemRow]] = await conn.query(`SELECT id, codigo_inventario FROM ${cfg.table} WHERE id = :id FOR UPDATE`, { id: itemId });

  // La devolucion no puede ser anterior a la entrega.
  const asignadoDate = localDateString(asignacion.fecha_asignacion);
  if (fecha && fecha < asignadoDate) {
    throw fieldError(400, 'La fecha de devolución no puede ser anterior a la de asignación.', 'fecha_devolucion');
  }
  let devolucion = resolveFecha(fecha);
  const asignadoDateTime = localDateTimeString(asignacion.fecha_asignacion);
  if (devolucion < asignadoDateTime) devolucion = asignadoDateTime; // mismo dia, hora anterior

  let destino = nuevoEstado || 'disponible';
  if (condicion === 'perdido') destino = 'perdido';
  if (!ESTADOS_MANUALES.includes(destino)) {
    throw fieldError(400, 'Estado posterior a la devolución inválido.', 'nuevo_estado');
  }

  await conn.query(
    `UPDATE ${cfg.asigTable}
        SET fecha_devolucion = :devolucion, recibido_por = :userId,
            condicion_devolucion = :condicion, observaciones_devolucion = :observaciones
      WHERE id = :id`,
    {
      id: asignacionId,
      devolucion,
      userId: userId ?? null,
      condicion: condicion || null,
      observaciones: observaciones || null,
    }
  );

  await conn.query(
    `UPDATE ${cfg.table}
        SET estado = :destino, fecha_baja = IF(:destino = 'baja', :fechaBaja, NULL)
      WHERE id = :id`,
    { id: itemId, destino, fechaBaja: devolucion.slice(0, 10) }
  );

  // Los equipos registran ademas su estado fisico segun como regresaron.
  if (kind === 'equipos' && ESTADO_FISICO_POR_CONDICION[condicion]) {
    await conn.query('UPDATE equipos SET estado_fisico = :ef WHERE id = :id', {
      id: itemId,
      ef: ESTADO_FISICO_POR_CONDICION[condicion],
    });
  }

  await logAudit(conn, {
    userId, ip, action: 'devuelto', entity: cfg.label, entityId: itemId,
    details: { codigo_inventario: itemRow?.codigo_inventario, colaborador_id: asignacion.colaborador_id, nuevo_estado: destino },
  });

  // "Equipos sin asignar": solo equipos (segun lo pedido), y solo cuando queda
  // disponible de verdad (no si pasa a mantenimiento/baja/perdido al devolverse).
  if (kind === 'equipos' && destino === 'disponible') {
    await notificacionModel.notificarRoles(conn, {
      roles: notificacionModel.ALL_ROLES, tipo: 'equipo_sin_asignar', prioridad: 'info',
      titulo: 'Equipo disponible sin asignar',
      mensaje: `El equipo ${itemRow?.codigo_inventario} quedó disponible y sin colaborador asignado.`,
      modulo: kind, entidadId: itemId, enlace: `/${kind}/${itemId}`,
      claveDedup: notificacionModel.claveDedup('equipo_sin_asignar', kind, asignacionId),
    });
  }

  return { itemId, colaboradorId: asignacion.colaborador_id };
}

/** Asignacion vigente de un item (bloqueada) o null si esta sin asignar. */
async function findActiveTx(conn, kind, itemId) {
  const cfg = cfgOf(kind);
  const [[row]] = await conn.query(
    `SELECT id, colaborador_id FROM ${cfg.asigTable} WHERE ${cfg.vigenteCol} = :id FOR UPDATE`,
    { id: itemId }
  );
  return row || null;
}

const assign = (kind, data) => withTransaction((conn) => assignTx(conn, kind, data));
const devolver = (kind, asignacionId, data) =>
  withTransaction((conn) => returnTx(conn, kind, asignacionId, data));

module.exports = { withTransaction, assignTx, returnTx, findActiveTx, assign, devolver };
