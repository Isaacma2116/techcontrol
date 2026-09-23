const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Proveedores (fabricantes y/o distribuidores). Una licencia puede usar el
 * mismo proveedor para ambos roles. Nunca se borran fisicamente: se
 * desactivan (igual que colaboradores, usuarios...).
 */

const EDITABLE = ['nombre', 'rfc', 'contacto_nombre', 'telefono', 'correo', 'sitio_web', 'notas'];
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

async function list({ search, activo, page = 1, limit = 50 } = {}) {
  const where = [];
  const params = {};
  if (activo !== undefined && activo !== '') {
    where.push('activo = :activo');
    params.activo = activo ? 1 : 0;
  }
  if (search?.trim()) {
    where.push('nombre LIKE :search');
    params.search = `%${escapeLike(search.trim())}%`;
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM proveedores ${clause}`, params);
  const lim = Math.min(Number(limit) || 50, 200);
  const pg = Math.max(1, Number(page) || 1);
  const [rows] = await pool.query(
    `SELECT id, nombre, rfc, contacto_nombre, telefono, correo, sitio_web, notas, activo, created_at
       FROM proveedores ${clause}
      ORDER BY nombre
      LIMIT :limit OFFSET :offset`,
    { ...params, limit: lim, offset: (pg - 1) * lim }
  );
  return {
    proveedores: rows.map((r) => ({ ...r, activo: !!r.activo })),
    pagination: { total, page: pg, limit: lim, totalPages: Math.max(1, Math.ceil(total / lim)) },
  };
}

async function findById(id) {
  const [[row]] = await pool.query('SELECT * FROM proveedores WHERE id = :id', { id });
  if (!row) throw new AppError('El proveedor no existe.', 404);
  return { ...row, activo: !!row.activo };
}

async function create(data) {
  try {
    const [result] = await pool.query(
      `INSERT INTO proveedores (${EDITABLE.join(', ')}) VALUES (${EDITABLE.map((f) => `:${f}`).join(', ')})`,
      Object.fromEntries(EDITABLE.map((f) => [f, data[f]?.trim() || null]))
    );
    return findById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Ya existe un proveedor con ese nombre.', 409);
    throw err;
  }
}

async function update(id, data) {
  await findById(id);
  try {
    await pool.query(
      `UPDATE proveedores SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')} WHERE id = :id`,
      { id, ...Object.fromEntries(EDITABLE.map((f) => [f, data[f]?.trim() || null])) }
    );
    return findById(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Ya existe un proveedor con ese nombre.', 409);
    throw err;
  }
}

async function setActivo(id, activo) {
  await findById(id);
  await pool.query('UPDATE proveedores SET activo = :activo WHERE id = :id', { id, activo: activo ? 1 : 0 });
  return findById(id);
}

module.exports = { list, findById, create, update, setActivo };
