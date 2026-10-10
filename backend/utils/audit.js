const { pool } = require('../config/db');

/**
 * Registra una accion en `audit_logs` (historial / auditoria).
 * Acepta una conexion de transaccion (`db`) para que el registro se confirme o
 * revierta junto con la operacion; sin ella usa el pool.
 *
 *   await logAudit(conn, { userId, action: 'creada', entity: 'carta_responsiva',
 *                          entityId: id, details: { folio }, ip: req.ip });
 */
async function logAudit(db, { userId, action, entity, entityId, details, ip }) {
  await (db || pool).query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, details)
     VALUES (:userId, :action, :entity, :entityId, :ip, :details)`,
    {
      userId: userId ?? null,
      action,
      entity,
      entityId: entityId === undefined || entityId === null ? null : String(entityId),
      ip: ip ? String(ip).slice(0, 45) : null,
      details: details ? JSON.stringify(details) : null,
    }
  );
}

module.exports = { logAudit };
