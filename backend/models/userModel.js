const { pool } = require('../config/db');

/**
 * Modelo de Usuario.
 * IMPORTANTE: ninguna funcion aqui debe devolver password_hash
 * en un objeto que luego se envie tal cual como respuesta JSON,
 * salvo findByIdentifierWithPassword / findByIdWithPassword, usadas
 * UNICAMENTE internamente para verificar contrasenas.
 *
 * `name` es el nombre visible (lo usan asignaciones, cartas, etc.); se recalcula
 * a partir de nombres + apellidos cuando el perfil se edita.
 * Los usuarios NO se borran fisicamente (hay historial que apunta a ellos):
 * se desactivan (`active = 0`).
 */

const PUBLIC_FIELDS = `id, name, nombres, apellidos, username, email, telefono, cargo, foto,
  role, active, last_login, password_changed_at, must_change_password, preferencias_ui, two_factor_enabled,
  created_at, updated_at`;

const PREFERENCIAS_DEFECTO = { tema: 'automatico', densidad: 'comoda', acento: 'azul' };

/** Nombre visible a partir de nombres + apellidos. */
const composeName = (nombres, apellidos) => [nombres, apellidos].filter(Boolean).join(' ').trim();

function toDto(row) {
  if (!row) return null;
  // `nombres` puede faltar en usuarios creados por otra via: se muestra entonces el nombre completo.
  return {
    ...row,
    nombres: row.nombres ?? row.name,
    must_change_password: !!row.must_change_password,
    two_factor_enabled: !!row.two_factor_enabled,
    preferencias_ui: { ...PREFERENCIAS_DEFECTO, ...(row.preferencias_ui || {}) },
  };
}

/**
 * Busca un usuario por correo O por nombre de usuario (login flexible).
 * `identifier` es lo que el usuario escribio en el campo de login.
 */
async function findByIdentifierWithPassword(identifier) {
  const [rows] = await pool.query(
    `SELECT id, name, username, email, password_hash, role, active
     FROM users WHERE email = :identifier OR username = :identifier LIMIT 1`,
    { identifier }
  );
  return rows[0] || null;
}

/** Para verificar la contrasena actual del usuario autenticado. */
async function findByIdWithPassword(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password_hash, active FROM users WHERE id = :id LIMIT 1',
    { id }
  );
  return rows[0] || null;
}

async function findByEmailOrUsername(email, username) {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1`,
    { email, username }
  );
  return rows[0] || null;
}

/** ¿Otro usuario (distinto de `exceptId`) ya usa ese correo? */
async function emailTaken(email, exceptId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE email = :email AND id <> :exceptId LIMIT 1',
    { email, exceptId }
  );
  return rows.length > 0;
}

/** ¿Otro usuario (distinto de `exceptId`) ya usa ese correo o ese nombre de usuario? */
async function identifierTakenByOther(email, username, exceptId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE (email = :email OR username = :username) AND id <> :exceptId LIMIT 1',
    { email, username, exceptId }
  );
  return rows.length > 0;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = :id LIMIT 1`,
    { id }
  );
  return toDto(rows[0]);
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC`
  );
  return rows.map(toDto);
}

async function create({ name, username, email, passwordHash, role = 'viewer' }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, nombres, username, email, password_hash, role, active, password_changed_at, must_change_password)
     VALUES (:name, :name, :username, :email, :passwordHash, :role, 1, NOW(), 1)`,
    { name, username, email, passwordHash, role }
  );
  return findById(result.insertId);
}

async function updateById(id, fields) {
  const allowed = ['name', 'username', 'email', 'role', 'active'];
  const setClauses = [];
  const params = { id };

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  // El nombre editado por un administrador queda tambien como "nombres".
  if (fields.name !== undefined) setClauses.push('nombres = :name', 'apellidos = NULL');

  if (setClauses.length === 0) return findById(id);

  await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = :id`,
    params
  );
  return findById(id);
}

/** Perfil editado por el propio usuario (nunca rol, estado ni permisos). */
async function updateProfile(id, { nombres, apellidos, telefono, cargo, email }) {
  await pool.query(
    `UPDATE users
        SET nombres = :nombres, apellidos = :apellidos, name = :name,
            telefono = :telefono, cargo = :cargo, email = :email
      WHERE id = :id`,
    {
      id,
      nombres,
      apellidos: apellidos || null,
      name: composeName(nombres, apellidos),
      telefono: telefono || null,
      cargo: cargo || null,
      email,
    }
  );
  return findById(id);
}

async function setFoto(id, foto) {
  await pool.query('UPDATE users SET foto = :foto WHERE id = :id', { id, foto });
}

/** Guarda una contrasena YA hasheada y deja constancia de cuando cambio. */
async function updatePassword(id, passwordHash) {
  await pool.query(
    `UPDATE users
        SET password_hash = :passwordHash, password_changed_at = NOW(), must_change_password = 0
      WHERE id = :id`,
    { id, passwordHash }
  );
}

async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = :id', { id });
}

/** Activa o desactiva un usuario (nunca se borra fisicamente: hay historial que apunta a el). */
async function setActivo(id, activo) {
  await pool.query('UPDATE users SET active = :activo WHERE id = :id', { id, activo: activo ? 1 : 0 });
  return findById(id);
}

/**
 * Restablecimiento de contrasena hecho por un administrador: guarda el hash de
 * la contrasena temporal y obliga a cambiarla en el siguiente inicio de sesion.
 */
async function resetPassword(id, passwordHash) {
  await pool.query(
    `UPDATE users
        SET password_hash = :passwordHash, password_changed_at = NOW(), must_change_password = 1
      WHERE id = :id`,
    { id, passwordHash }
  );
}

/** Preferencias visuales personales (tema/densidad/acento). Se combinan con las que ya tenia. */
async function updatePreferencias(id, preferencias) {
  const actual = await findById(id);
  const nuevas = { ...actual.preferencias_ui, ...preferencias };
  await pool.query('UPDATE users SET preferencias_ui = :preferencias WHERE id = :id', {
    id, preferencias: JSON.stringify(nuevas),
  });
  return findById(id);
}

/** Cuenta administradores activos, para no dejar el sistema sin ninguno habilitado. */
async function countActiveAdmins() {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND active = 1"
  );
  return rows[0].total;
}

/**
 * Borrado fisico. OJO: solo existe por compatibilidad; los usuarios con historial
 * (asignaciones, cartas, auditoria) deben DESACTIVARSE, no borrarse.
 */
async function deleteById(id) {
  await pool.query('DELETE FROM users WHERE id = :id', { id });
}

/**
 * Eliminacion de cuenta hecha por el propio usuario ("Zona peligrosa"): desactiva el
 * acceso y borra sus datos de contacto (correo, telefono, fotografia). NO borra la
 * fila (hay FKs desde asignaciones, cartas y auditoria); `name`/`username` se
 * conservan para que ese historial siga siendo legible.
 * El correo se reemplaza por uno anonimo unico (la columna es NOT NULL UNIQUE) para
 * dejar libre el original.
 */
async function anonymizarYDesactivar(id) {
  await pool.query(
    `UPDATE users
        SET active = 0,
            email = CONCAT('eliminado-', id, '@eliminado.local'),
            telefono = NULL,
            foto = NULL,
            desactivado_en = NOW(),
            desactivado_por = :id
      WHERE id = :id`,
    { id }
  );
}

module.exports = {
  composeName,
  findByIdentifierWithPassword,
  findByIdWithPassword,
  findByEmailOrUsername,
  emailTaken,
  identifierTakenByOther,
  findById,
  findAll,
  create,
  updateById,
  updateProfile,
  setFoto,
  updatePreferencias,
  updatePassword,
  updateLastLogin,
  setActivo,
  resetPassword,
  countActiveAdmins,
  deleteById,
  anonymizarYDesactivar,
};
