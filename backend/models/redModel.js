const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/audit');
const { cifrar, descifrar } = require('../utils/cripto');

/**
 * Redes (Wi-Fi, LAN, VLAN, invitados, servidores...). La contraseña Wi-Fi se
 * guarda cifrada y NUNCA sale en los listados ni en el detalle normal: solo
 * `revelarPassword` la descifra, y exige permiso + deja auditoría.
 */

const ENTITY = 'red';
const EDITABLE = [
  'nombre', 'tipo', 'ubicacion_id', 'area_id', 'vlan_numero', 'rango_ip', 'gateway', 'dns',
  'dhcp_habilitado', 'seguridad_wifi', 'responsable_id', 'descripcion',
];
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

const SELECT_FIELDS = `
  r.id, r.nombre, r.tipo, r.ubicacion_id, r.area_id, r.vlan_numero, r.rango_ip, r.gateway, r.dns,
  r.dhcp_habilitado, r.seguridad_wifi, r.estado, r.responsable_id, r.descripcion,
  r.created_at, r.updated_at,
  u.nombre AS ubicacion_nombre, a.nombre AS area_nombre, resp.name AS responsable_nombre,
  (r.wifi_password_cifrado IS NOT NULL) AS tiene_password,
  COALESCE(dr.total, 0) AS dispositivos_total`;

const FROM = `
  FROM redes r
  LEFT JOIN ubicaciones u ON u.id = r.ubicacion_id
  LEFT JOIN areas a       ON a.id = r.area_id
  LEFT JOIN users resp    ON resp.id = r.responsable_id
  LEFT JOIN (
    SELECT red_id, COUNT(*) AS total FROM dispositivos_red_redes GROUP BY red_id
  ) dr ON dr.red_id = r.id`;

function toDto(row) {
  const { ubicacion_id, ubicacion_nombre, area_id, area_nombre, responsable_id, responsable_nombre, ...rest } = row;
  return {
    ...rest,
    ubicacion_id, area_id, responsable_id,
    dhcp_habilitado: !!row.dhcp_habilitado,
    tiene_password: !!row.tiene_password,
    dispositivos_total: Number(row.dispositivos_total),
    ubicacion: ubicacion_id ? { id: ubicacion_id, nombre: ubicacion_nombre } : null,
    area: area_id ? { id: area_id, nombre: area_nombre } : null,
    responsable: responsable_id ? { id: responsable_id, nombre: responsable_nombre } : null,
  };
}

function buildFilters({ search, tipo, estado, ubicacionId, areaId }) {
  const where = [];
  const params = {};
  if (search?.trim()) {
    where.push('(r.nombre LIKE :search OR r.descripcion LIKE :search)');
    params.search = `%${escapeLike(search.trim())}%`;
  }
  if (tipo) { where.push('r.tipo = :tipo'); params.tipo = tipo; }
  if (estado) { where.push('r.estado = :estado'); params.estado = estado; }
  if (ubicacionId) { where.push('r.ubicacion_id = :ubicacionId'); params.ubicacionId = ubicacionId; }
  if (areaId) { where.push('r.area_id = :areaId'); params.areaId = areaId; }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filters = {}) {
  const { clause, params } = buildFilters(filters);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM redes r ${clause}`, params);

  const limit = Math.min(Number(filters.limit) || 12, 200);
  const page = Math.max(1, Number(filters.page) || 1);
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM} ${clause} ORDER BY r.nombre LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );
  return { redes: rows.map(toDto), pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

/** Sin filtros ni paginación: para selects (formulario de dispositivos, "asociar red"). */
async function listAll() {
  const [rows] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE r.estado = 'activa' ORDER BY r.nombre`);
  return rows.map(toDto);
}

async function stats() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(estado = 'activa'), 0) AS activas,
            COALESCE(SUM(estado = 'inactiva'), 0) AS inactivas
       FROM redes`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function findById(id) {
  const [[row]] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE r.id = :id`, { id });
  if (!row) throw new AppError('La red no existe.', 404);
  return toDto(row);
}

async function requireFk(table, id, message, field) {
  if (id === undefined || id === null || id === '') return null;
  const [[row]] = await pool.query(`SELECT id FROM ${table} WHERE id = :id`, { id });
  if (!row) throw fieldError(404, message, field);
  return id;
}

function normalize(data) {
  const out = {};
  for (const f of EDITABLE) {
    if (f === 'dhcp_habilitado') { out[f] = data[f] ? 1 : 0; continue; }
    if (['ubicacion_id', 'area_id', 'responsable_id', 'vlan_numero'].includes(f)) { out[f] = data[f] || null; continue; }
    out[f] = typeof data[f] === 'string' ? data[f].trim() || null : data[f] ?? null;
  }
  out.nombre = (data.nombre || '').trim();
  out.seguridad_wifi = out.seguridad_wifi || null;
  return out;
}

/** `wifiPassword`: string nueva a cifrar, '' para borrarla, undefined para no tocarla. */
async function create(data, userId, ip) {
  const values = normalize(data);
  await requireFk('ubicaciones', values.ubicacion_id, 'La ubicación seleccionada no existe.', 'ubicacion_id');
  await requireFk('areas', values.area_id, 'El área seleccionada no existe.', 'area_id');

  const passwordCifrado = data.wifi_password ? cifrar(data.wifi_password) : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO redes (${EDITABLE.join(', ')}, wifi_password_cifrado, creado_por, actualizado_por)
       VALUES (${EDITABLE.map((f) => `:${f}`).join(', ')}, :passwordCifrado, :userId, :userId)`,
      { ...values, passwordCifrado, userId }
    );
    await logAudit(null, { userId, ip, action: 'creada', entity: ENTITY, entityId: result.insertId, details: { nombre: values.nombre, tipo: values.tipo } });
    return findById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw fieldError(409, 'Ya existe una red con ese nombre en esa ubicación.', 'nombre');
    throw err;
  }
}

async function update(id, data, userId, ip) {
  await findById(id);
  const values = normalize(data);
  await requireFk('ubicaciones', values.ubicacion_id, 'La ubicación seleccionada no existe.', 'ubicacion_id');
  await requireFk('areas', values.area_id, 'El área seleccionada no existe.', 'area_id');

  const tocaPassword = data.wifi_password !== undefined;
  const passwordSql = tocaPassword ? ', wifi_password_cifrado = :passwordCifrado' : '';
  const passwordCifrado = data.wifi_password ? cifrar(data.wifi_password) : null;

  try {
    await pool.query(
      `UPDATE redes SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')}, actualizado_por = :userId ${passwordSql} WHERE id = :id`,
      { ...values, userId, id, ...(tocaPassword ? { passwordCifrado } : {}) }
    );
    await logAudit(null, { userId, ip, action: 'editada', entity: ENTITY, entityId: id, details: { nombre: values.nombre } });
    return findById(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw fieldError(409, 'Ya existe una red con ese nombre en esa ubicación.', 'nombre');
    throw err;
  }
}

/** "Eliminar" en la UI = desactivar (nada se borra fisicamente, igual que el resto del inventario). */
async function setEstado(id, estado, userId, ip) {
  const actual = await findById(id);
  if (actual.estado === estado) throw new AppError(`La red ya está ${estado === 'activa' ? 'activa' : 'inactiva'}.`, 409);
  await pool.query('UPDATE redes SET estado = :estado, actualizado_por = :userId WHERE id = :id', { id, estado, userId });
  await logAudit(null, { userId, ip, action: estado === 'inactiva' ? 'desactivada' : 'reactivada', entity: ENTITY, entityId: id, details: { nombre: actual.nombre } });
  return findById(id);
}

/** Descifra y devuelve la contraseña Wi-Fi. Requiere permiso (ruta) y deja auditoría (aquí). */
async function revelarPassword(id, userId, ip) {
  const [[row]] = await pool.query('SELECT nombre, wifi_password_cifrado FROM redes WHERE id = :id', { id });
  if (!row) throw new AppError('La red no existe.', 404);
  if (!row.wifi_password_cifrado) throw new AppError('Esta red no tiene una contraseña Wi-Fi registrada.', 404);

  const password = descifrar(row.wifi_password_cifrado);
  await logAudit(null, { userId, ip, action: 'password_consultada', entity: ENTITY, entityId: id, details: { nombre: row.nombre } });
  return password;
}

async function historial(id) {
  const [[existe]] = await pool.query('SELECT id FROM redes WHERE id = :id', { id });
  if (!existe) throw new AppError('La red no existe.', 404);
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS usuario
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.entity = :entity AND a.entity_id = :id
      ORDER BY a.id DESC`,
    { entity: ENTITY, id: String(id) }
  );
  return rows;
}

/** Dispositivos asociados a la red (para su ficha). */
async function dispositivosDeRed(redId) {
  const [rows] = await pool.query(
    `SELECT d.id, d.codigo, d.nombre, d.tipo, d.estado
       FROM dispositivos_red_redes dr
       JOIN dispositivos_red d ON d.id = dr.dispositivo_id
      WHERE dr.red_id = :redId
      ORDER BY d.nombre`,
    { redId }
  );
  return rows;
}

module.exports = { list, listAll, stats, findById, create, update, setEstado, revelarPassword, dispositivosDeRed, historial };
