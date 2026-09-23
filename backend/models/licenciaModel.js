const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { withTransaction } = require('./asignacionModel');
const { logAudit } = require('../utils/audit');
const { CODIGO_PREFIJO } = require('../utils/licencias');
const { formatCodigo } = require('../utils/inventario');

/**
 * Licencias: cada contrato/compra de un software (puede haber varias por
 * software, con distinta cantidad de puestos y vigencia) y sus asignaciones
 * a colaboradores/equipos.
 *
 *  - "utilizadas"/"disponibles"/"estado_efectivo" NUNCA se guardan: vienen de
 *    la vista `v_licencias_uso`, calculada a partir de las asignaciones vigentes.
 *  - Asignar/liberar es el mismo mecanismo que el resto del inventario:
 *    `fecha_liberacion IS NULL` = vigente; nada se borra.
 *  - El "ambito" del modelo de licencia (usuario/dispositivo/ambos) dice que
 *    pide la asignacion: no se puede asignar a un colaborador una licencia
 *    "por dispositivo", ni viceversa.
 */

const ENTITY = 'licencia';
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

const EDITABLE = [
  'software_id', 'proveedor_id', 'modelo_id', 'cantidad_total', 'activaciones_maximas', 'transferible',
  'fecha_compra', 'fecha_inicio', 'fecha_vencimiento', 'periodicidad', 'renovacion_automatica',
  'costo', 'moneda', 'numero_contrato', 'numero_factura', 'observaciones',
];

const SELECT_FIELDS = `
  l.id, l.codigo, l.software_id, l.proveedor_id, l.modelo_id,
  l.cantidad_total, l.activaciones_maximas, l.transferible,
  DATE_FORMAT(l.fecha_compra, '%Y-%m-%d') AS fecha_compra,
  DATE_FORMAT(l.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
  DATE_FORMAT(l.fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
  l.periodicidad, l.renovacion_automatica, l.costo, l.moneda,
  l.numero_contrato, l.numero_factura, l.renovacion_de_id, l.estado, l.observaciones,
  l.created_at, l.updated_at,
  s.nombre AS software_nombre, s.tipo AS software_tipo,
  p.nombre AS proveedor_nombre,
  m.codigo AS modelo_codigo, m.nombre AS modelo_nombre, m.ambito AS modelo_ambito,
  m.temporalidad AS modelo_temporalidad, m.requiere_desactivacion AS modelo_requiere_desactivacion,
  v.utilizadas, v.disponibles, v.dias_para_vencer, v.estado_efectivo`;

const FROM = `
  FROM licencias l
  JOIN software s        ON s.id = l.software_id
  JOIN modelos_licencia m ON m.id = l.modelo_id
  LEFT JOIN proveedores p ON p.id = l.proveedor_id
  JOIN v_licencias_uso v ON v.licencia_id = l.id`;

function toDto(row) {
  const {
    software_nombre, software_tipo, proveedor_nombre,
    modelo_codigo, modelo_nombre, modelo_ambito, modelo_temporalidad, modelo_requiere_desactivacion,
    utilizadas, disponibles, dias_para_vencer, costo, ...rest
  } = row;
  return {
    ...rest,
    costo: costo === null || costo === undefined ? null : Number(costo),
    transferible: !!row.transferible,
    renovacion_automatica: !!row.renovacion_automatica,
    utilizadas: Number(utilizadas),
    disponibles: Number(disponibles),
    dias_para_vencer: dias_para_vencer === null ? null : Number(dias_para_vencer),
    software: { id: row.software_id, nombre: software_nombre, tipo: software_tipo },
    proveedor: row.proveedor_id ? { id: row.proveedor_id, nombre: proveedor_nombre } : null,
    modelo: {
      id: row.modelo_id, codigo: modelo_codigo, nombre: modelo_nombre, ambito: modelo_ambito,
      temporalidad: modelo_temporalidad, requiere_desactivacion: !!modelo_requiere_desactivacion,
    },
  };
}

function buildFilters({ search, softwareId, modeloId, proveedorId, estado, venceEnDias }) {
  const where = [];
  const params = {};
  if (search?.trim()) {
    where.push('(l.codigo LIKE :search OR s.nombre LIKE :search OR l.numero_contrato LIKE :search)');
    params.search = `%${escapeLike(search.trim())}%`;
  }
  if (softwareId) { where.push('l.software_id = :softwareId'); params.softwareId = softwareId; }
  if (modeloId) { where.push('l.modelo_id = :modeloId'); params.modeloId = modeloId; }
  if (proveedorId) { where.push('l.proveedor_id = :proveedorId'); params.proveedorId = proveedorId; }
  // 'vencida'/'agotada'/'por_vencer' no existen en la columna: se filtran por la vista.
  if (estado) { where.push('v.estado_efectivo = :estado'); params.estado = estado; }
  if (venceEnDias) {
    where.push('v.dias_para_vencer IS NOT NULL AND v.dias_para_vencer BETWEEN 0 AND :venceEnDias');
    params.venceEnDias = Number(venceEnDias);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filters = {}) {
  const { clause, params } = buildFilters(filters);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM} ${clause}`, params);

  const limit = Math.min(Number(filters.limit) || 12, 100);
  const page = Math.max(1, Number(filters.page) || 1);
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM} ${clause}
      ORDER BY l.created_at DESC
      LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );
  return {
    licencias: rows.map(toDto),
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Tarjetas de resumen de /licencias. */
async function stats() {
  const [[row]] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(l.estado = 'activa' AND v.estado_efectivo = 'activa'), 0)      AS activas,
       COALESCE(SUM(l.estado = 'activa' AND v.disponibles > 0), 0)                 AS con_disponibles,
       COALESCE(SUM(l.estado = 'activa' AND v.utilizadas > 0), 0)                  AS con_asignaciones,
       COALESCE(SUM(l.estado = 'activa' AND v.estado_efectivo = 'por_vencer'), 0)  AS por_vencer,
       COALESCE(SUM(l.estado = 'activa' AND v.estado_efectivo = 'vencida'), 0)     AS vencidas,
       COALESCE(SUM(l.estado = 'cancelada'), 0)                                    AS canceladas
     FROM licencias l JOIN v_licencias_uso v ON v.licencia_id = l.id`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function findById(id) {
  const [[row]] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE l.id = :id`, { id });
  if (!row) throw new AppError('La licencia no existe.', 404);
  return toDto(row);
}

async function requireModelo(id) {
  const [[row]] = await pool.query('SELECT id, codigo, ambito, temporalidad FROM modelos_licencia WHERE id = :id AND activo = 1', { id });
  if (!row) throw fieldError(404, 'El modelo de licencia seleccionado no existe.', 'modelo_id');
  return row;
}

async function requireSoftware(conn, id) {
  const [[row]] = await conn.query('SELECT id, nombre FROM software WHERE id = :id', { id });
  if (!row) throw fieldError(404, 'El software seleccionado no existe.', 'software_id');
  return row;
}

function normalize(data, modelo) {
  const out = {};
  for (const f of EDITABLE) out[f] = data[f] ?? null;
  out.software_id = Number(data.software_id);
  out.modelo_id = Number(data.modelo_id);
  out.proveedor_id = data.proveedor_id || null;
  out.cantidad_total = Number(data.cantidad_total) || 1;
  out.activaciones_maximas = data.activaciones_maximas || null;
  out.transferible = data.transferible === false ? 0 : 1;
  out.renovacion_automatica = data.renovacion_automatica ? 1 : 0;
  out.periodicidad = data.periodicidad || 'unica';
  out.moneda = (data.moneda || 'MXN').toUpperCase();
  out.numero_contrato = data.numero_contrato?.trim() || null;
  out.numero_factura = data.numero_factura?.trim() || null;
  out.observaciones = data.observaciones?.trim() || null;
  out.costo = data.costo === '' || data.costo === undefined ? null : data.costo;
  // Perpetua: sin vencimiento aunque el formulario mande uno por error.
  out.fecha_vencimiento = modelo.temporalidad === 'perpetua' ? null : (data.fecha_vencimiento || null);
  out.fecha_compra = data.fecha_compra || null;
  out.fecha_inicio = data.fecha_inicio || null;
  return out;
}

async function nextCodigo(conn) {
  const [[{ n }]] = await conn.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo, ${CODIGO_PREFIJO.length + 2}) AS UNSIGNED)), 0) + 1 AS n
       FROM licencias WHERE codigo REGEXP '^${CODIGO_PREFIJO}-[0-9]+$'`
  );
  return formatCodigo(CODIGO_PREFIJO, Number(n));
}

/** Reintenta si dos licencias creadas a la vez chocaron en el codigo. */
async function withCodigoRetry(fn) {
  for (let intento = 1; ; intento++) {
    try {
      return await fn();
    } catch (err) {
      const choque = err.code === 'ER_DUP_ENTRY' && /uq_licencias_codigo/.test(err.sqlMessage || '');
      const interbloqueo = err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT';
      if ((!choque && !interbloqueo) || intento >= 5) throw err;
      await new Promise((r) => setTimeout(r, 15 * intento));
    }
  }
}

async function create(data, userId, ip) {
  const modelo = await requireModelo(data.modelo_id);
  const id = await withCodigoRetry(() =>
    withTransaction(async (conn) => {
      const software = await requireSoftware(conn, data.software_id);
      const values = normalize(data, modelo);
      const codigo = await nextCodigo(conn);

      const [result] = await conn.query(
        `INSERT INTO licencias (codigo, ${EDITABLE.join(', ')}, creado_por, actualizado_por)
         VALUES (:codigo, ${EDITABLE.map((f) => `:${f}`).join(', ')}, :userId, :userId)`,
        { codigo, ...values, userId }
      );
      await logAudit(conn, {
        userId, ip, action: 'creada', entity: ENTITY, entityId: result.insertId,
        details: { codigo, software: software.nombre, cantidad_total: values.cantidad_total },
      });
      return result.insertId;
    })
  );
  return findById(id);
}

async function update(id, data, userId, ip) {
  const actual = await findById(id);
  if (actual.estado === 'cancelada') throw new AppError('Una licencia cancelada no se puede editar.', 409);
  const modelo = data.modelo_id ? await requireModelo(data.modelo_id) : actual.modelo;
  const values = normalize({ ...actual, ...data }, modelo);

  if (Number(values.cantidad_total) < actual.utilizadas) {
    throw fieldError(
      409,
      `No puedes bajar la cantidad a ${values.cantidad_total}: hay ${actual.utilizadas} puesto(s) asignado(s) actualmente.`,
      'cantidad_total'
    );
  }

  await pool.query(
    `UPDATE licencias SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')}, actualizado_por = :userId WHERE id = :id`,
    { ...values, userId, id }
  );
  await logAudit(null, { userId, ip, action: 'editada', entity: ENTITY, entityId: id, details: { codigo: actual.codigo } });
  return findById(id);
}

async function setEstado(id, estado, userId, ip) {
  const actual = await findById(id);
  if (actual.estado === estado) throw new AppError(`La licencia ya está ${estado === 'activa' ? 'activa' : estado}.`, 409);
  await pool.query('UPDATE licencias SET estado = :estado, actualizado_por = :userId WHERE id = :id', { id, estado, userId });
  await logAudit(null, {
    userId, ip, action: estado === 'cancelada' ? 'cancelada' : estado === 'suspendida' ? 'suspendida' : 'reactivada',
    entity: ENTITY, entityId: id, details: { codigo: actual.codigo },
  });
  return findById(id);
}

/** Crea una licencia nueva ligada a esta como su renovacion (misma software/modelo/proveedor por defecto). */
async function renovar(id, data, userId, ip) {
  const anterior = await findById(id);
  const modelo = data.modelo_id ? await requireModelo(data.modelo_id) : anterior.modelo;

  const nuevoId = await withCodigoRetry(() =>
    withTransaction(async (conn) => {
      const codigo = await nextCodigo(conn);
      // Se heredan software/proveedor/modelo/cantidad y las preferencias del contrato;
      // fechas, costo y numero de contrato/factura son de la renovacion (se piden de nuevo).
      const values = normalize(
        {
          software_id: anterior.software_id,
          proveedor_id: anterior.proveedor_id,
          modelo_id: modelo.id,
          cantidad_total: anterior.cantidad_total,
          activaciones_maximas: anterior.activaciones_maximas,
          transferible: anterior.transferible,
          periodicidad: anterior.periodicidad,
          renovacion_automatica: anterior.renovacion_automatica,
          moneda: anterior.moneda,
          ...data,
        },
        modelo
      );
      const [result] = await conn.query(
        `INSERT INTO licencias (codigo, ${EDITABLE.join(', ')}, renovacion_de_id, creado_por, actualizado_por)
         VALUES (:codigo, ${EDITABLE.map((f) => `:${f}`).join(', ')}, :anteriorId, :userId, :userId)`,
        { codigo, ...values, anteriorId: id, userId }
      );
      await logAudit(conn, {
        userId, ip, action: 'renovada', entity: ENTITY, entityId: result.insertId,
        details: { codigo, codigo_anterior: anterior.codigo },
      });
      return result.insertId;
    })
  );
  return findById(nuevoId);
}

// ---------------------------------------------------------------------------
// Asignaciones
// ---------------------------------------------------------------------------

const ASIG_FIELDS = `
  a.id, a.licencia_id, a.colaborador_id, a.equipo_id,
  a.fecha_asignacion, a.fecha_liberacion, a.estado, a.identificador_activacion,
  a.observaciones_asignacion, a.observaciones_liberacion,
  col.id_empleado, TRIM(CONCAT_WS(' ', col.nombre, col.apellido_paterno, col.apellido_materno)) AS colaborador_nombre,
  eq.codigo_inventario, TRIM(CONCAT_WS(' ', eq.marca, eq.modelo)) AS equipo_titulo`;
const ASIG_FROM = `
  FROM asignaciones_licencias a
  LEFT JOIN colaboradores col ON col.id = a.colaborador_id
  LEFT JOIN equipos eq        ON eq.id = a.equipo_id`;

function asigToDto(row) {
  const { id_empleado, colaborador_nombre, codigo_inventario, equipo_titulo, ...rest } = row;
  return {
    ...rest,
    colaborador: row.colaborador_id ? { id: row.colaborador_id, id_empleado, nombre_completo: colaborador_nombre } : null,
    equipo: row.equipo_id ? { id: row.equipo_id, codigo_inventario, titulo: equipo_titulo } : null,
  };
}

/** Asignaciones vigentes + historial de una licencia (para su ficha). */
async function asignaciones(licenciaId) {
  await findById(licenciaId);
  const [rows] = await pool.query(
    `SELECT ${ASIG_FIELDS} ${ASIG_FROM} WHERE a.licencia_id = :licenciaId ORDER BY a.fecha_asignacion DESC`,
    { licenciaId }
  );
  return rows.map(asigToDto);
}

/** Quien usa hoy cualquier licencia de un software (para la pestaña "Usuarios" de su ficha). */
async function usuariosDeSoftware(softwareId) {
  const [rows] = await pool.query(
    `SELECT ${ASIG_FIELDS}, l.codigo AS licencia_codigo ${ASIG_FROM}
       JOIN licencias l ON l.id = a.licencia_id
      WHERE l.software_id = :softwareId AND a.fecha_liberacion IS NULL
      ORDER BY a.fecha_asignacion DESC`,
    { softwareId }
  );
  return rows.map((r) => ({ ...asigToDto(r), licencia_codigo: r.licencia_codigo }));
}

/** Valida que colaborador/equipo tengan sentido para el ambito del modelo, y que existan. */
async function validarDestino(conn, modelo, { colaboradorId, equipoId }) {
  if (modelo.ambito === 'usuario' && equipoId) {
    throw fieldError(400, 'Esta licencia es "por usuario": no se asigna a un equipo.', 'equipo_id');
  }
  if (modelo.ambito === 'dispositivo' && colaboradorId) {
    throw fieldError(400, 'Esta licencia es "por dispositivo": no se asigna a un colaborador.', 'colaborador_id');
  }
  if (modelo.ambito === 'usuario' && !colaboradorId) throw fieldError(400, 'Selecciona el colaborador.', 'colaborador_id');
  if (modelo.ambito === 'dispositivo' && !equipoId) throw fieldError(400, 'Selecciona el equipo.', 'equipo_id');
  if (modelo.ambito === 'ambos' && !colaboradorId && !equipoId) {
    throw fieldError(400, 'Selecciona un colaborador, un equipo, o ambos.', 'colaborador_id');
  }
  if (colaboradorId) {
    const [[c]] = await conn.query('SELECT id, activo FROM colaboradores WHERE id = :id', { id: colaboradorId });
    if (!c) throw fieldError(404, 'El colaborador seleccionado no existe.', 'colaborador_id');
    if (!c.activo) throw fieldError(409, 'El colaborador está dado de baja.', 'colaborador_id');
  }
  if (equipoId) {
    const [[e]] = await conn.query('SELECT id, estado FROM equipos WHERE id = :id', { id: equipoId });
    if (!e) throw fieldError(404, 'El equipo seleccionado no existe.', 'equipo_id');
    if (e.estado === 'baja') throw fieldError(409, 'El equipo está dado de baja.', 'equipo_id');
  }
}

/** Asigna un puesto de la licencia (colaborador, equipo o ambos, segun el modelo). */
async function asignar(licenciaId, data, userId, ip) {
  return withTransaction(async (conn) => {
    const [[lic]] = await conn.query(
      `SELECT l.id, l.codigo, l.cantidad_total, l.estado, m.id AS modelo_id, m.ambito, m.codigo AS modelo_codigo
         FROM licencias l JOIN modelos_licencia m ON m.id = l.modelo_id
        WHERE l.id = :id FOR UPDATE`,
      { id: licenciaId }
    );
    if (!lic) throw new AppError('La licencia no existe.', 404);
    if (lic.estado !== 'activa') throw new AppError(`La licencia está ${lic.estado}: no se puede asignar.`, 409);

    const colaboradorId = data.colaborador_id || null;
    const equipoId = data.equipo_id || null;
    await validarDestino(conn, { ambito: lic.ambito }, { colaboradorId, equipoId });

    const [[{ usados }]] = await conn.query(
      "SELECT COUNT(*) AS usados FROM asignaciones_licencias WHERE licencia_id = :id AND fecha_liberacion IS NULL",
      { id: licenciaId }
    );
    if (usados >= lic.cantidad_total) {
      throw fieldError(409, `Ya se usaron los ${lic.cantidad_total} puesto(s) de esta licencia.`, 'licencia_id');
    }

    try {
      const [result] = await conn.query(
        `INSERT INTO asignaciones_licencias
           (licencia_id, colaborador_id, equipo_id, identificador_activacion, observaciones_asignacion, asignado_por)
         VALUES (:licenciaId, :colaboradorId, :equipoId, :identificador, :observaciones, :userId)`,
        {
          licenciaId, colaboradorId, equipoId,
          identificador: data.identificador_activacion?.trim() || null,
          observaciones: data.observaciones?.trim() || null,
          userId,
        }
      );
      await logAudit(conn, {
        userId, ip, action: 'asignada', entity: ENTITY, entityId: licenciaId,
        details: { codigo: lic.codigo, colaborador_id: colaboradorId, equipo_id: equipoId },
      });
      const [[dto]] = await conn.query(`SELECT ${ASIG_FIELDS} ${ASIG_FROM} WHERE a.id = :id`, { id: result.insertId });
      return asigToDto(dto);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw fieldError(409, 'Ya tiene esta licencia asignada (colaborador o equipo).', colaboradorId ? 'colaborador_id' : 'equipo_id');
      }
      throw err;
    }
  });
}

/** Libera un puesto (no lo borra: queda el historial y se puede reasignar despues). */
async function liberar(licenciaId, asignacionId, data, userId, ip) {
  return withTransaction(async (conn) => {
    const [[asig]] = await conn.query(
      'SELECT id, licencia_id, fecha_liberacion FROM asignaciones_licencias WHERE id = :id AND licencia_id = :licenciaId FOR UPDATE',
      { id: asignacionId, licenciaId }
    );
    if (!asig) throw new AppError('La asignación no existe.', 404);
    if (asig.fecha_liberacion) throw new AppError('Ese puesto ya estaba liberado.', 409);

    await conn.query(
      `UPDATE asignaciones_licencias
          SET fecha_liberacion = NOW(), observaciones_liberacion = :observaciones, liberado_por = :userId
        WHERE id = :id`,
      { id: asignacionId, observaciones: data?.observaciones?.trim() || null, userId }
    );
    await logAudit(conn, { userId, ip, action: 'liberada', entity: ENTITY, entityId: licenciaId, details: { asignacion_id: asignacionId } });
    const [[dto]] = await conn.query(`SELECT ${ASIG_FIELDS} ${ASIG_FROM} WHERE a.id = :id`, { id: asignacionId });
    return asigToDto(dto);
  });
}

/** Mueve la licencia: libera el puesto actual y asigna uno nuevo, en una sola transaccion. */
async function transferir(licenciaId, asignacionId, data, userId, ip) {
  return withTransaction(async (conn) => {
    const [[lic]] = await conn.query(
      `SELECT l.id, l.codigo, l.estado, m.ambito
         FROM licencias l JOIN modelos_licencia m ON m.id = l.modelo_id WHERE l.id = :id FOR UPDATE`,
      { id: licenciaId }
    );
    if (!lic) throw new AppError('La licencia no existe.', 404);
    if (lic.estado !== 'activa') throw new AppError(`La licencia está ${lic.estado}: no se puede transferir.`, 409);

    const [[asig]] = await conn.query(
      'SELECT id, fecha_liberacion FROM asignaciones_licencias WHERE id = :id AND licencia_id = :licenciaId FOR UPDATE',
      { id: asignacionId, licenciaId }
    );
    if (!asig) throw new AppError('La asignación no existe.', 404);
    if (asig.fecha_liberacion) throw new AppError('Ese puesto ya estaba liberado.', 409);

    const colaboradorId = data.colaborador_id || null;
    const equipoId = data.equipo_id || null;
    await validarDestino(conn, { ambito: lic.ambito }, { colaboradorId, equipoId });

    await conn.query(
      `UPDATE asignaciones_licencias
          SET fecha_liberacion = NOW(), observaciones_liberacion = :notaLiberacion, liberado_por = :userId
        WHERE id = :id`,
      { id: asignacionId, notaLiberacion: 'Transferida a otro destino.', userId }
    );

    try {
      const [result] = await conn.query(
        `INSERT INTO asignaciones_licencias
           (licencia_id, colaborador_id, equipo_id, identificador_activacion, observaciones_asignacion, asignado_por)
         VALUES (:licenciaId, :colaboradorId, :equipoId, :identificador, :observaciones, :userId)`,
        {
          licenciaId, colaboradorId, equipoId,
          identificador: data.identificador_activacion?.trim() || null,
          observaciones: `Transferida desde la asignación #${asignacionId}.${data.observaciones ? ` ${data.observaciones.trim()}` : ''}`,
          userId,
        }
      );
      await logAudit(conn, {
        userId, ip, action: 'transferida', entity: ENTITY, entityId: licenciaId,
        details: { codigo: lic.codigo, de_asignacion: asignacionId, colaborador_id: colaboradorId, equipo_id: equipoId },
      });
      const [[dto]] = await conn.query(`SELECT ${ASIG_FIELDS} ${ASIG_FROM} WHERE a.id = :id`, { id: result.insertId });
      return asigToDto(dto);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw fieldError(409, 'El destino elegido ya tiene esta licencia asignada.', colaboradorId ? 'colaborador_id' : 'equipo_id');
      }
      throw err;
    }
  });
}

async function historial(id) {
  await findById(id);
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS usuario
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.entity = :entity AND a.entity_id = :id
      ORDER BY a.id DESC`,
    { entity: ENTITY, id: String(id) }
  );
  return rows;
}

module.exports = {
  list, stats, findById, create, update, setEstado, renovar,
  asignaciones, usuariosDeSoftware, asignar, liberar, transferir, historial,
};
