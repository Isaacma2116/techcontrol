const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/audit');
const notificacionModel = require('./notificacionModel');
const { CODIGO_PREFIJO } = require('../utils/redes');
const { formatCodigo, localDateString } = require('../utils/inventario');

/**
 * Dispositivos de red (routers, switches, access points, firewalls...).
 * La relacion con las redes que usa/sirve cada dispositivo vive aparte
 * (dispositivos_red_redes, M:N): un dispositivo no "pertenece" a una red.
 */

const ENTITY = 'dispositivo_red';
const EDITABLE = [
  'nombre', 'tipo', 'marca', 'modelo', 'numero_serie', 'mac_address', 'ip_address', 'ip_publica',
  'ubicacion_id', 'rack', 'puerto', 'vlan_admin_id', 'responsable_id', 'fecha_instalacion',
  'fecha_garantia', 'proveedor_id', 'observaciones',
];
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

const SELECT_FIELDS = `
  d.id, d.codigo, d.nombre, d.tipo, d.marca, d.modelo, d.numero_serie, d.mac_address,
  d.ip_address, d.ip_publica, d.ubicacion_id, d.rack, d.puerto, d.vlan_admin_id, d.estado,
  d.responsable_id, DATE_FORMAT(d.fecha_instalacion, '%Y-%m-%d') AS fecha_instalacion,
  DATE_FORMAT(d.fecha_garantia, '%Y-%m-%d') AS fecha_garantia, d.proveedor_id, d.imagen,
  d.observaciones, d.created_at, d.updated_at,
  u.nombre AS ubicacion_nombre, resp.name AS responsable_nombre, p.nombre AS proveedor_nombre,
  vr.nombre AS vlan_admin_nombre, vr.vlan_numero AS vlan_admin_numero,
  COALESCE(dr.total, 0) AS redes_total`;

const FROM = `
  FROM dispositivos_red d
  LEFT JOIN ubicaciones u ON u.id = d.ubicacion_id
  LEFT JOIN users resp    ON resp.id = d.responsable_id
  LEFT JOIN proveedores p ON p.id = d.proveedor_id
  LEFT JOIN redes vr      ON vr.id = d.vlan_admin_id
  LEFT JOIN (
    SELECT dispositivo_id, COUNT(*) AS total FROM dispositivos_red_redes GROUP BY dispositivo_id
  ) dr ON dr.dispositivo_id = d.id`;

function toDto(row) {
  const {
    ubicacion_id, ubicacion_nombre, responsable_id, responsable_nombre,
    proveedor_id, proveedor_nombre, vlan_admin_id, vlan_admin_nombre, vlan_admin_numero, ...rest
  } = row;
  return {
    ...rest,
    ubicacion_id, responsable_id, proveedor_id, vlan_admin_id,
    redes_total: Number(row.redes_total),
    ubicacion: ubicacion_id ? { id: ubicacion_id, nombre: ubicacion_nombre } : null,
    responsable: responsable_id ? { id: responsable_id, nombre: responsable_nombre } : null,
    proveedor: proveedor_id ? { id: proveedor_id, nombre: proveedor_nombre } : null,
    vlan_admin: vlan_admin_id ? { id: vlan_admin_id, nombre: vlan_admin_nombre, vlan_numero: vlan_admin_numero } : null,
  };
}

function buildFilters({ search, tipo, estado, ubicacionId, redId }) {
  const where = [];
  const params = {};
  if (search?.trim()) {
    where.push('(d.codigo LIKE :search OR d.nombre LIKE :search OR d.numero_serie LIKE :search OR d.ip_address LIKE :search OR d.mac_address LIKE :search)');
    params.search = `%${escapeLike(search.trim())}%`;
  }
  if (tipo) { where.push('d.tipo = :tipo'); params.tipo = tipo; }
  if (estado) { where.push('d.estado = :estado'); params.estado = estado; }
  if (ubicacionId) { where.push('d.ubicacion_id = :ubicacionId'); params.ubicacionId = ubicacionId; }
  if (redId) { where.push('EXISTS (SELECT 1 FROM dispositivos_red_redes x WHERE x.dispositivo_id = d.id AND x.red_id = :redId)'); params.redId = redId; }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filters = {}) {
  const { clause, params } = buildFilters(filters);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM dispositivos_red d ${clause}`, params);

  const limit = Math.min(Number(filters.limit) || 12, 200);
  const page = Math.max(1, Number(filters.page) || 1);
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM} ${clause} ORDER BY d.nombre LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );
  return { dispositivos: rows.map(toDto), pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function stats() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(tipo = 'router'), 0) AS routers,
            COALESCE(SUM(tipo = 'switch'), 0) AS switches,
            COALESCE(SUM(tipo = 'access_point'), 0) AS access_points,
            COALESCE(SUM(tipo = 'firewall'), 0) AS firewalls,
            COALESCE(SUM(estado = 'mantenimiento'), 0) AS en_mantenimiento,
            COALESCE(SUM(estado = 'inactivo'), 0) AS inactivos
       FROM dispositivos_red`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function findById(id) {
  const [[row]] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE d.id = :id`, { id });
  if (!row) throw new AppError('El dispositivo no existe.', 404);
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
  const nullable = ['ubicacion_id', 'responsable_id', 'proveedor_id', 'vlan_admin_id', 'fecha_instalacion', 'fecha_garantia'];
  for (const f of EDITABLE) {
    if (nullable.includes(f)) { out[f] = data[f] || null; continue; }
    out[f] = typeof data[f] === 'string' ? data[f].trim() || null : data[f] ?? null;
  }
  out.nombre = (data.nombre || '').trim();
  if (out.mac_address) out.mac_address = out.mac_address.toUpperCase();
  return out;
}

async function nextCodigo(conn) {
  const [[{ n }]] = await conn.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo, ${CODIGO_PREFIJO.length + 2}) AS UNSIGNED)), 0) + 1 AS n
       FROM dispositivos_red WHERE codigo REGEXP '^${CODIGO_PREFIJO}-[0-9]+$'`
  );
  return formatCodigo(CODIGO_PREFIJO, Number(n));
}

async function withCodigoRetry(fn) {
  for (let intento = 1; ; intento++) {
    try {
      return await fn();
    } catch (err) {
      const choque = err.code === 'ER_DUP_ENTRY' && /uq_dispred_codigo/.test(err.sqlMessage || '');
      const interbloqueo = err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT';
      if ((!choque && !interbloqueo) || intento >= 5) throw err;
      await new Promise((r) => setTimeout(r, 15 * intento));
    }
  }
}

async function requireVlanAdmin(id) {
  if (!id) return null;
  const [[row]] = await pool.query("SELECT id FROM redes WHERE id = :id AND tipo = 'vlan'", { id });
  if (!row) throw fieldError(404, 'La VLAN de administración seleccionada no existe.', 'vlan_admin_id');
  return id;
}

async function dupError(err) {
  if (err.code !== 'ER_DUP_ENTRY') return null;
  if (/uq_dispred_serie/.test(err.sqlMessage || '')) return fieldError(409, 'Ya existe un dispositivo con ese número de serie.', 'numero_serie');
  if (/uq_dispred_mac/.test(err.sqlMessage || '')) return fieldError(409, 'Ya existe un dispositivo con esa dirección MAC.', 'mac_address');
  return null;
}

async function create(data, userId, ip) {
  const values = normalize(data);
  await requireFk('ubicaciones', values.ubicacion_id, 'La ubicación seleccionada no existe.', 'ubicacion_id');
  await requireFk('proveedores', values.proveedor_id, 'El proveedor seleccionado no existe.', 'proveedor_id');
  await requireVlanAdmin(values.vlan_admin_id);

  const id = await withCodigoRetry(() =>
    (async () => {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const codigo = await nextCodigo(conn);
        const [result] = await conn.query(
          `INSERT INTO dispositivos_red (codigo, ${EDITABLE.join(', ')}, creado_por, actualizado_por)
           VALUES (:codigo, ${EDITABLE.map((f) => `:${f}`).join(', ')}, :userId, :userId)`,
          { codigo, ...values, userId }
        );
        await conn.commit();
        return result.insertId;
      } catch (err) {
        await conn.rollback();
        const e = await dupError(err);
        throw e || err;
      } finally {
        conn.release();
      }
    })()
  );

  await logAudit(null, { userId, ip, action: 'creado', entity: ENTITY, entityId: id, details: { nombre: values.nombre, tipo: values.tipo } });
  return findById(id);
}

async function update(id, data, userId, ip) {
  await findById(id);
  const values = normalize(data);
  await requireFk('ubicaciones', values.ubicacion_id, 'La ubicación seleccionada no existe.', 'ubicacion_id');
  await requireFk('proveedores', values.proveedor_id, 'El proveedor seleccionado no existe.', 'proveedor_id');
  await requireVlanAdmin(values.vlan_admin_id);

  try {
    await pool.query(
      `UPDATE dispositivos_red SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')}, actualizado_por = :userId WHERE id = :id`,
      { ...values, userId, id }
    );
  } catch (err) {
    const e = await dupError(err);
    throw e || err;
  }
  await logAudit(null, { userId, ip, action: 'editado', entity: ENTITY, entityId: id, details: { nombre: values.nombre } });
  return findById(id);
}

/** "Eliminar" en la UI = dar de baja (nada se borra fisicamente). */
async function setEstado(id, estado, userId, ip) {
  const actual = await findById(id);
  if (actual.estado === estado) throw new AppError(`El dispositivo ya está en estado "${estado}".`, 409);
  await pool.query('UPDATE dispositivos_red SET estado = :estado, actualizado_por = :userId WHERE id = :id', { id, estado, userId });
  await logAudit(null, { userId, ip, action: 'estado_cambiado', entity: ENTITY, entityId: id, details: { estado } });

  if (estado === 'inactivo') {
    // La fecha en la clave permite que, si vuelve a activarse y luego se marca
    // inactivo otro dia, SI genere una notificacion nueva (no es un evento unico).
    await notificacionModel.notificarRoles(pool, {
      roles: notificacionModel.STAFF_ROLES, tipo: 'dispositivo_red_inactivo', prioridad: 'advertencia',
      titulo: 'Dispositivo de red inactivo',
      mensaje: `El dispositivo ${actual.nombre} (${actual.codigo}) se marcó como inactivo.`,
      modulo: 'dispositivos-red', entidadId: id, enlace: `/dispositivos-red/${id}`,
      claveDedup: `dispositivo_red_inactivo:dispositivos-red:${id}:${localDateString()}`,
    });
  }

  return findById(id);
}

async function setImagen(id, filename, userId) {
  await pool.query('UPDATE dispositivos_red SET imagen = :filename, actualizado_por = :userId WHERE id = :id', { id, filename, userId });
}

async function historial(id) {
  const [[existe]] = await pool.query('SELECT id FROM dispositivos_red WHERE id = :id', { id });
  if (!existe) throw new AppError('El dispositivo no existe.', 404);
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS usuario
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.entity = :entity AND a.entity_id = :id
      ORDER BY a.id DESC`,
    { entity: ENTITY, id: String(id) }
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Relacion con redes (M:N)
// ---------------------------------------------------------------------------

async function redesDelDispositivo(dispositivoId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.nombre, r.tipo, r.vlan_numero, r.estado, dr.created_at AS asociada_desde
       FROM dispositivos_red_redes dr
       JOIN redes r ON r.id = dr.red_id
      WHERE dr.dispositivo_id = :dispositivoId
      ORDER BY r.nombre`,
    { dispositivoId }
  );
  return rows;
}

async function asociarRed(dispositivoId, redId, userId, ip) {
  await findById(dispositivoId);
  const [[red]] = await pool.query('SELECT id, nombre FROM redes WHERE id = :id', { id: redId });
  if (!red) throw fieldError(404, 'La red seleccionada no existe.', 'red_id');

  try {
    await pool.query(
      'INSERT INTO dispositivos_red_redes (dispositivo_id, red_id, creado_por) VALUES (:dispositivoId, :redId, :userId)',
      { dispositivoId, redId, userId }
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Este dispositivo ya está asociado a esa red.', 409);
    throw err;
  }
  await logAudit(null, { userId, ip, action: 'red_asociada', entity: ENTITY, entityId: dispositivoId, details: { red: red.nombre } });
  return redesDelDispositivo(dispositivoId);
}

async function desasociarRed(dispositivoId, redId, userId, ip) {
  const [result] = await pool.query(
    'DELETE FROM dispositivos_red_redes WHERE dispositivo_id = :dispositivoId AND red_id = :redId',
    { dispositivoId, redId }
  );
  if (!result.affectedRows) throw new AppError('Ese dispositivo no está asociado a esa red.', 404);
  await logAudit(null, { userId, ip, action: 'red_desasociada', entity: ENTITY, entityId: dispositivoId, details: { red_id: redId } });
  return redesDelDispositivo(dispositivoId);
}

/** Todas las relaciones dispositivo<->red (pestaña "Conexiones"). */
async function conexiones() {
  const [rows] = await pool.query(
    `SELECT d.id AS dispositivo_id, d.codigo, d.nombre AS dispositivo_nombre, d.tipo AS dispositivo_tipo, d.estado AS dispositivo_estado,
            r.id AS red_id, r.nombre AS red_nombre, r.tipo AS red_tipo, r.estado AS red_estado
       FROM dispositivos_red_redes dr
       JOIN dispositivos_red d ON d.id = dr.dispositivo_id
       JOIN redes r            ON r.id = dr.red_id
      ORDER BY d.nombre, r.nombre`
  );
  return rows;
}

module.exports = {
  list, stats, findById, create, update, setEstado, setImagen, historial,
  redesDelDispositivo, asociarRed, desasociarRed, conexiones,
};
