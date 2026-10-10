const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/audit');

/**
 * Software: el PROGRAMA (AutoCAD, Chrome...), no una licencia especifica.
 * Puede tener 0..N licencias (models/licenciaModel.js). "Utilizadas" y
 * "disponibles" que se muestran aqui son la SUMA de sus licencias, calculada
 * con la vista v_licencias_uso (nunca se guardan).
 */

const ENTITY = 'software';
const EDITABLE = [
  'nombre', 'fabricante_id', 'categoria_id', 'tipo', 'version_referencia',
  'requiere_licencia', 'requiere_activacion', 'sitio_web', 'descripcion', 'observaciones',
];
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

const SELECT_FIELDS = `
  s.id, s.nombre, s.fabricante_id, s.categoria_id, s.tipo, s.version_referencia,
  s.requiere_licencia, s.requiere_activacion, s.sitio_web, s.descripcion, s.observaciones,
  s.estado, s.created_at, s.updated_at,
  f.nombre AS fabricante_nombre, c.nombre AS categoria_nombre,
  COALESCE(u.licencias, 0) AS licencias_total,
  COALESCE(u.cantidad_total, 0) AS puestos_total,
  COALESCE(u.utilizadas, 0) AS puestos_utilizados,
  COALESCE(u.cantidad_total, 0) - COALESCE(u.utilizadas, 0) AS puestos_disponibles,
  u.proximo_vencimiento,
  COALESCE(u.vencidas, 0) AS licencias_vencidas,
  COALESCE(u.por_vencer, 0) AS licencias_por_vencer`;

const FROM = `
  FROM software s
  LEFT JOIN proveedores f        ON f.id = s.fabricante_id
  LEFT JOIN categorias_software c ON c.id = s.categoria_id
  LEFT JOIN (
    SELECT l.software_id,
           COUNT(*) AS licencias,
           SUM(v.cantidad_total) AS cantidad_total,
           SUM(v.utilizadas) AS utilizadas,
           MIN(CASE WHEN l.estado = 'activa' THEN l.fecha_vencimiento END) AS proximo_vencimiento,
           SUM(l.estado = 'activa' AND v.estado_efectivo = 'vencida') AS vencidas,
           SUM(l.estado = 'activa' AND v.estado_efectivo = 'por_vencer') AS por_vencer
      FROM licencias l
      JOIN v_licencias_uso v ON v.licencia_id = l.id
     GROUP BY l.software_id
  ) u ON u.software_id = s.id`;

function toDto(row) {
  const { fabricante_nombre, categoria_nombre, fabricante_id, categoria_id, requiere_licencia, requiere_activacion, ...rest } = row;
  return {
    ...rest,
    fabricante_id,
    categoria_id,
    requiere_licencia: !!requiere_licencia,
    requiere_activacion: !!requiere_activacion,
    fabricante: fabricante_id ? { id: fabricante_id, nombre: fabricante_nombre } : null,
    categoria: categoria_id ? { id: categoria_id, nombre: categoria_nombre } : null,
    puestos_total: Number(row.puestos_total),
    puestos_utilizados: Number(row.puestos_utilizados),
    puestos_disponibles: Number(row.puestos_disponibles),
    licencias_total: Number(row.licencias_total),
    licencias_vencidas: Number(row.licencias_vencidas),
    licencias_por_vencer: Number(row.licencias_por_vencer),
  };
}

function buildFilters({ search, tipo, categoriaId, fabricanteId, requiereLicencia, estado }) {
  const where = [];
  const params = {};
  if (search?.trim()) {
    where.push('(s.nombre LIKE :search OR f.nombre LIKE :search)');
    params.search = `%${escapeLike(search.trim())}%`;
  }
  if (tipo) { where.push('s.tipo = :tipo'); params.tipo = tipo; }
  if (categoriaId) { where.push('s.categoria_id = :categoriaId'); params.categoriaId = categoriaId; }
  if (fabricanteId) { where.push('s.fabricante_id = :fabricanteId'); params.fabricanteId = fabricanteId; }
  if (requiereLicencia !== undefined && requiereLicencia !== '') {
    // Puede llegar como boolean (uso interno) o como string 'true'/'false' (query string):
    // 'false' es un string NO vacío y por lo tanto truthy en JS, hay que compararlo a mano.
    where.push('s.requiere_licencia = :requiereLicencia');
    params.requiereLicencia = requiereLicencia === false || requiereLicencia === 'false' ? 0 : 1;
  }
  if (estado) { where.push('s.estado = :estado'); params.estado = estado; }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filters = {}) {
  const { clause, params } = buildFilters(filters);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM software s LEFT JOIN proveedores f ON f.id = s.fabricante_id ${clause}`, params);

  const limit = Math.min(Number(filters.limit) || 12, 100);
  const page = Math.max(1, Number(filters.page) || 1);
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM} ${clause}
      ORDER BY s.nombre
      LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );

  return {
    software: rows.map(toDto),
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Tarjetas del dashboard de /software. */
async function stats() {
  const [[row]] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(requiere_licencia = 1), 0) AS con_licencia,
       COALESCE(SUM(tipo IN ('gratuito','open_source','freeware')), 0) AS gratuito,
       (SELECT COUNT(DISTINCT l.software_id) FROM licencias l JOIN v_licencias_uso v ON v.licencia_id = l.id
         WHERE l.estado = 'activa' AND v.estado_efectivo = 'vencida') AS con_vencidas,
       (SELECT COUNT(DISTINCT l.software_id) FROM licencias l JOIN v_licencias_uso v ON v.licencia_id = l.id
         WHERE l.estado = 'activa' AND v.estado_efectivo = 'por_vencer') AS con_por_vencer
     FROM software`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function findById(id) {
  const [[row]] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE s.id = :id`, { id });
  if (!row) throw new AppError('El software no existe.', 404);
  return toDto(row);
}

async function requireFk(table, id, message, field) {
  if (id === undefined || id === null || id === '') return null;
  const [[row]] = await pool.query(`SELECT id FROM ${table} WHERE id = :id`, { id });
  if (!row) throw fieldError(404, message, field);
  return id;
}

const TIPOS_SIN_LICENCIA = new Set(['gratuito', 'open_source', 'freeware']);

function normalize(data) {
  const out = {};
  for (const f of EDITABLE) {
    if (f === 'requiere_licencia') {
      // Si el formulario no manda el valor, se propone segun el tipo (gratuito/open
      // source/freeware -> no requiere; el resto -> si), en vez de asumir "no".
      out[f] = data[f] === undefined ? (TIPOS_SIN_LICENCIA.has(data.tipo) ? 0 : 1) : (data[f] ? 1 : 0);
      continue;
    }
    if (f === 'requiere_activacion') { out[f] = data[f] ? 1 : 0; continue; }
    if (f === 'fabricante_id' || f === 'categoria_id') { out[f] = data[f] || null; continue; }
    out[f] = typeof data[f] === 'string' ? data[f].trim() || null : data[f] ?? null;
  }
  out.nombre = (data.nombre || '').trim();
  return out;
}

async function create(data, userId, ip) {
  const values = normalize(data);
  await requireFk('proveedores', values.fabricante_id, 'El fabricante seleccionado no existe.', 'fabricante_id');
  await requireFk('categorias_software', values.categoria_id, 'La categoría seleccionada no existe.', 'categoria_id');

  try {
    const cols = EDITABLE;
    const [result] = await pool.query(
      `INSERT INTO software (${cols.join(', ')}, creado_por, actualizado_por)
       VALUES (${cols.map((c) => `:${c}`).join(', ')}, :userId, :userId)`,
      { ...values, userId }
    );
    await logAudit(null, { userId, ip, action: 'creado', entity: ENTITY, entityId: result.insertId, details: { nombre: values.nombre } });
    return findById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw fieldError(409, 'Ya existe ese software registrado para el mismo fabricante.', 'nombre');
    }
    throw err;
  }
}

async function update(id, data, userId, ip) {
  await findById(id);
  const values = normalize(data);
  await requireFk('proveedores', values.fabricante_id, 'El fabricante seleccionado no existe.', 'fabricante_id');
  await requireFk('categorias_software', values.categoria_id, 'La categoría seleccionada no existe.', 'categoria_id');

  try {
    await pool.query(
      `UPDATE software SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')}, actualizado_por = :userId WHERE id = :id`,
      { ...values, userId, id }
    );
    await logAudit(null, { userId, ip, action: 'editado', entity: ENTITY, entityId: id });
    return findById(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw fieldError(409, 'Ya existe ese software registrado para el mismo fabricante.', 'nombre');
    }
    throw err;
  }
}

async function setEstado(id, estado, userId, ip) {
  await findById(id);
  await pool.query('UPDATE software SET estado = :estado, actualizado_por = :userId WHERE id = :id', { id, estado, userId });
  await logAudit(null, { userId, ip, action: 'estado_cambiado', entity: ENTITY, entityId: id, details: { estado } });
  return findById(id);
}

module.exports = { list, stats, findById, create, update, setEstado };
