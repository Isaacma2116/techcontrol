const { pool } = require('../config/db');

/**
 * Sesiones de inicio de sesion (tabla user_sessions).
 * Cada login crea una fila cuyo id viaja en el JWT (jti). `protect` exige que la
 * sesion siga vigente: al revocarla (cerrar sesion, "cerrar otras", cambio de
 * contrasena) el token deja de funcionar de inmediato aunque no haya vencido.
 */

async function create({ id, userId, userAgent, ip, expiresAt }) {
  await pool.query(
    `INSERT INTO user_sessions (id, user_id, user_agent, ip, expires_at)
     VALUES (:id, :userId, :userAgent, :ip, :expiresAt)`,
    {
      id,
      userId,
      userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
      ip: ip ? String(ip).slice(0, 45) : null,
      expiresAt,
    }
  );
}

/** Sesion vigente (no revocada ni vencida) de ese usuario, o null. */
async function findValid(id, userId) {
  const [[row]] = await pool.query(
    `SELECT id FROM user_sessions
      WHERE id = :id AND user_id = :userId AND revoked_at IS NULL AND expires_at > NOW()`,
    { id, userId }
  );
  return row || null;
}

/** Actualiza "ultimo acceso" como maximo cada 5 minutos (evita una escritura por peticion). */
async function touch(id) {
  await pool.query(
    'UPDATE user_sessions SET last_seen_at = NOW() WHERE id = :id AND last_seen_at < NOW() - INTERVAL 5 MINUTE',
    { id }
  );
}

async function listActive(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_agent, ip, created_at, last_seen_at, expires_at
       FROM user_sessions
      WHERE user_id = :userId AND revoked_at IS NULL AND expires_at > NOW()
      ORDER BY last_seen_at DESC`,
    { userId }
  );
  return rows;
}

/** Revoca UNA sesion del usuario. Devuelve cuantas revoco (0 o 1). */
async function revoke(id, userId) {
  const [result] = await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE id = :id AND user_id = :userId AND revoked_at IS NULL',
    { id, userId }
  );
  return result.affectedRows;
}

/** Revoca todas las sesiones del usuario menos `exceptId` (la actual). Devuelve cuantas. */
async function revokeOthers(userId, exceptId) {
  const [result] = await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = :userId AND id <> :exceptId AND revoked_at IS NULL',
    { userId, exceptId }
  );
  return result.affectedRows;
}

/** Revoca TODAS las sesiones del usuario (p. ej. al desactivar su cuenta). */
async function revokeAll(userId) {
  const [result] = await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL',
    { userId }
  );
  return result.affectedRows;
}

/** Marca la sesion actual como "reautenticada" (confirmo su contrasena de nuevo, ahora mismo). */
async function marcarReautenticado(id) {
  await pool.query('UPDATE user_sessions SET reautenticado_en = NOW() WHERE id = :id', { id });
}

/** ¿Esta sesion confirmo su contrasena en los ultimos `minutos`? Base del paso adicional para datos sensibles. */
async function estaReautenticado(id, minutos) {
  const [[row]] = await pool.query(
    'SELECT id FROM user_sessions WHERE id = :id AND reautenticado_en >= NOW() - INTERVAL :minutos MINUTE',
    { id, minutos }
  );
  return !!row;
}

/** Limpieza: borra sesiones vencidas o revocadas hace mas de 30 dias. */
async function purgeOld() {
  await pool.query(
    `DELETE FROM user_sessions
      WHERE expires_at < NOW() - INTERVAL 30 DAY
         OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL 30 DAY)`
  );
}

module.exports = {
  create, findValid, touch, listActive, revoke, revokeOthers, revokeAll, purgeOld,
  marcarReautenticado, estaReautenticado,
};
