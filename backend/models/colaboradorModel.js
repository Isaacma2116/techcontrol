const { pool } = require('../config/db');

/**
 * Modelo de Colaborador.
 * Todo el filtrado, busqueda y conteo se resuelve en SQL (no en el frontend).
 * Las columnas DATE se devuelven ya formateadas como 'YYYY-MM-DD' para evitar
 * que el driver las convierta a Date y el JSON las corra un dia por zona horaria.
 */

const SELECT_FIELDS = `
  c.id, c.id_empleado, c.nombre, c.apellido_paterno, c.apellido_materno,
  CONCAT_WS(' ', c.nombre, c.apellido_paterno, c.apellido_materno) AS nombre_completo,
  c.area_id, a.nombre AS area, c.cargo_id, ca.nombre AS cargo,
  c.correo_empresarial, c.telefono_empresarial, c.correo_personal, c.telefono_personal,
  c.fotografia,
  DATE_FORMAT(c.fecha_alta, '%Y-%m-%d') AS fecha_alta,
  DATE_FORMAT(c.fecha_baja, '%Y-%m-%d') AS fecha_baja,
  c.activo,
  (SELECT COUNT(*) FROM asignaciones_equipos x
     WHERE x.colaborador_id = c.id AND x.fecha_devolucion IS NULL) AS equipos_asignados,
  (SELECT COUNT(*) FROM asignaciones_accesorios y
     WHERE y.colaborador_id = c.id AND y.fecha_devolucion IS NULL) AS accesorios_asignados,
  (SELECT COUNT(*) FROM asignaciones_impresoras p
     WHERE p.colaborador_id = c.id AND p.fecha_devolucion IS NULL) AS impresoras_asignadas,
  (SELECT COUNT(*) FROM asignaciones_celulares z
     WHERE z.colaborador_id = c.id AND z.fecha_devolucion IS NULL) AS celulares_asignados
`;

const FROM_JOINS = `
  FROM colaboradores c
  JOIN areas a   ON a.id  = c.area_id
  JOIN cargos ca ON ca.id = c.cargo_id
`;

const HAS_ACTIVE_ASSIGNMENT = `EXISTS (
  SELECT 1 FROM asignaciones_equipos x WHERE x.colaborador_id = c.id AND x.fecha_devolucion IS NULL
)`;

const EDITABLE_FIELDS = [
  'id_empleado', 'nombre', 'apellido_paterno', 'apellido_materno',
  'area_id', 'cargo_id',
  'correo_empresarial', 'telefono_empresarial', 'correo_personal', 'telefono_personal',
  'fecha_alta', 'fecha_baja', 'activo',
];

function toDto(row) {
  return {
    ...row,
    activo: !!row.activo,
    equipos_asignados: Number(row.equipos_asignados),
    accesorios_asignados: Number(row.accesorios_asignados),
    impresoras_asignadas: Number(row.impresoras_asignadas),
    celulares_asignados: Number(row.celulares_asignados),
  };
}

// Escapa % _ \ para que el texto del usuario se busque literalmente en LIKE.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

function buildFilters({ search, areaId, cargoId, activo, asignacion }) {
  const where = [];
  const params = {};

  // Cada palabra debe aparecer en alguno de los campos (AND entre palabras),
  // asi "maria lopez" encuentra a "Maria Fernanda Lopez Garcia".
  const tokens = (search || '').split(/\s+/).filter(Boolean).slice(0, 5);
  tokens.forEach((token, i) => {
    const key = `s${i}`;
    where.push(
      `(c.nombre LIKE :${key} OR c.apellido_paterno LIKE :${key} OR c.apellido_materno LIKE :${key}
        OR c.id_empleado LIKE :${key} OR c.correo_empresarial LIKE :${key})`
    );
    params[key] = `%${escapeLike(token)}%`;
  });

  if (areaId) {
    where.push('c.area_id = :areaId');
    params.areaId = areaId;
  }
  if (cargoId) {
    where.push('c.cargo_id = :cargoId');
    params.cargoId = cargoId;
  }
  if (activo !== undefined) {
    where.push('c.activo = :activo');
    params.activo = activo ? 1 : 0;
  }
  if (asignacion === 'con') where.push(HAS_ACTIVE_ASSIGNMENT);
  if (asignacion === 'sin') where.push(`NOT ${HAS_ACTIVE_ASSIGNMENT}`);

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function findAll(filters, { page, limit }) {
  const { whereSql, params } = buildFilters(filters);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM colaboradores c ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_JOINS} ${whereSql}
     ORDER BY c.apellido_paterno, c.apellido_materno, c.nombre, c.id
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );

  return { rows: rows.map(toDto), total };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_JOINS} WHERE c.id = :id LIMIT 1`,
    { id }
  );
  return rows[0] ? toDto(rows[0]) : null;
}

async function getStats() {
  const [[row]] = await pool.query(
    `SELECT
       COUNT(*)                                             AS total,
       COALESCE(SUM(c.activo = 1), 0)                       AS activos,
       COALESCE(SUM(c.activo = 0), 0)                       AS inactivos,
       COALESCE(SUM(c.activo = 1 AND NOT ${HAS_ACTIVE_ASSIGNMENT}), 0) AS sin_equipo
     FROM colaboradores c`
  );
  // SUM() llega como string (DECIMAL) desde mysql2.
  return {
    total: Number(row.total),
    activos: Number(row.activos),
    inactivos: Number(row.inactivos),
    sin_equipo: Number(row.sin_equipo),
  };
}

function pickFields(data) {
  const params = {};
  for (const key of EDITABLE_FIELDS) params[key] = data[key] ?? null;
  params.activo = data.activo ? 1 : 0;
  return params;
}

async function create(data) {
  const params = pickFields(data);
  const [result] = await pool.query(
    `INSERT INTO colaboradores (${EDITABLE_FIELDS.join(', ')})
     VALUES (${EDITABLE_FIELDS.map((f) => `:${f}`).join(', ')})`,
    params
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const params = { ...pickFields(data), id };
  await pool.query(
    `UPDATE colaboradores SET ${EDITABLE_FIELDS.map((f) => `${f} = :${f}`).join(', ')}
     WHERE id = :id`,
    params
  );
  return findById(id);
}

async function setFotografia(id, fotografia) {
  await pool.query('UPDATE colaboradores SET fotografia = :fotografia WHERE id = :id', {
    id,
    fotografia,
  });
}

/**
 * Equipos que el colaborador tiene HOY (asignaciones sin fecha de devolucion).
 */
async function findEquiposAsignados(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT a.id AS asignacion_id, e.id AS equipo_id, t.nombre AS tipo,
            e.marca, e.modelo, e.codigo_inventario, e.numero_serie, e.estado,
            a.fecha_asignacion, a.observaciones_asignacion,
            u.name AS asignado_por
     FROM asignaciones_equipos a
     JOIN equipos e       ON e.id = a.equipo_id
     JOIN tipos_equipo t  ON t.id = e.tipo_equipo_id
     LEFT JOIN users u    ON u.id = a.asignado_por
     WHERE a.colaborador_id = :id AND a.fecha_devolucion IS NULL
     ORDER BY a.fecha_asignacion DESC, a.id DESC`,
    { id: colaboradorId }
  );
  return rows;
}

/**
 * Accesorios que el colaborador tiene HOY.
 */
async function findAccesoriosAsignados(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT a.id AS asignacion_id, x.id AS accesorio_id, t.nombre AS tipo, x.nombre,
            x.marca, x.modelo, x.codigo_inventario, x.numero_serie, x.estado,
            a.fecha_asignacion, a.observaciones_asignacion,
            u.name AS asignado_por
     FROM asignaciones_accesorios a
     JOIN accesorios x        ON x.id = a.accesorio_id
     JOIN tipos_accesorio t   ON t.id = x.tipo_accesorio_id
     LEFT JOIN users u        ON u.id = a.asignado_por
     WHERE a.colaborador_id = :id AND a.fecha_devolucion IS NULL
     ORDER BY a.fecha_asignacion DESC, a.id DESC`,
    { id: colaboradorId }
  );
  return rows;
}

/**
 * Impresoras que el colaborador tiene HOY.
 */
async function findImpresorasAsignadas(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT a.id AS asignacion_id, p.id AS impresora_id, t.nombre AS tipo,
            p.marca, p.modelo, p.codigo_inventario, p.numero_serie, p.estado,
            a.fecha_asignacion, a.observaciones_asignacion,
            u.name AS asignado_por
     FROM asignaciones_impresoras a
     JOIN impresoras p        ON p.id = a.impresora_id
     JOIN tipos_impresora t   ON t.id = p.tipo_impresora_id
     LEFT JOIN users u        ON u.id = a.asignado_por
     WHERE a.colaborador_id = :id AND a.fecha_devolucion IS NULL
     ORDER BY a.fecha_asignacion DESC, a.id DESC`,
    { id: colaboradorId }
  );
  return rows;
}

/**
 * Celulares que el colaborador tiene HOY.
 */
async function findCelularesAsignados(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT a.id AS asignacion_id, c.id AS celular_id, 'Celular' AS tipo,
            c.marca, c.modelo, c.codigo_inventario, c.numero_serie, c.estado,
            a.fecha_asignacion, a.observaciones_asignacion,
            u.name AS asignado_por
     FROM asignaciones_celulares a
     JOIN celulares c    ON c.id = a.celular_id
     LEFT JOIN users u   ON u.id = a.asignado_por
     WHERE a.colaborador_id = :id AND a.fecha_devolucion IS NULL
     ORDER BY a.fecha_asignacion DESC, a.id DESC`,
    { id: colaboradorId }
  );
  return rows;
}

/**
 * Historial completo de EQUIPOS, ACCESORIOS, IMPRESORAS y CELULARES (vigentes y devueltos), mas
 * reciente primero. Incluye quien entrego/recibio y las observaciones: es la
 * base de las futuras cartas responsivas.
 */
async function findHistorial(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT * FROM (
       SELECT 'EQUIPO' AS categoria, a.id AS asignacion_id, e.id AS item_id, t.nombre AS tipo,
              TRIM(CONCAT_WS(' ', e.marca, e.modelo)) AS descripcion,
              e.codigo_inventario, e.numero_serie,
              a.fecha_asignacion, a.fecha_devolucion, a.condicion_devolucion,
              a.observaciones_asignacion, a.observaciones_devolucion,
              (a.fecha_devolucion IS NULL) AS vigente,
              ua.name AS asignado_por, ur.name AS recibido_por
       FROM asignaciones_equipos a
       JOIN equipos e       ON e.id = a.equipo_id
       JOIN tipos_equipo t  ON t.id = e.tipo_equipo_id
       LEFT JOIN users ua   ON ua.id = a.asignado_por
       LEFT JOIN users ur   ON ur.id = a.recibido_por
       WHERE a.colaborador_id = :id
       UNION ALL
       SELECT 'ACCESORIO', a.id, x.id, t.nombre,
              x.nombre,
              x.codigo_inventario, x.numero_serie,
              a.fecha_asignacion, a.fecha_devolucion, a.condicion_devolucion,
              a.observaciones_asignacion, a.observaciones_devolucion,
              (a.fecha_devolucion IS NULL),
              ua.name, ur.name
       FROM asignaciones_accesorios a
       JOIN accesorios x        ON x.id = a.accesorio_id
       JOIN tipos_accesorio t   ON t.id = x.tipo_accesorio_id
       LEFT JOIN users ua       ON ua.id = a.asignado_por
       LEFT JOIN users ur       ON ur.id = a.recibido_por
       WHERE a.colaborador_id = :id
       UNION ALL
       SELECT 'IMPRESORA', a.id, p.id, t.nombre,
              TRIM(CONCAT_WS(' ', p.marca, p.modelo)),
              p.codigo_inventario, p.numero_serie,
              a.fecha_asignacion, a.fecha_devolucion, a.condicion_devolucion,
              a.observaciones_asignacion, a.observaciones_devolucion,
              (a.fecha_devolucion IS NULL),
              ua.name, ur.name
       FROM asignaciones_impresoras a
       JOIN impresoras p        ON p.id = a.impresora_id
       JOIN tipos_impresora t   ON t.id = p.tipo_impresora_id
       LEFT JOIN users ua       ON ua.id = a.asignado_por
       LEFT JOIN users ur       ON ur.id = a.recibido_por
       WHERE a.colaborador_id = :id
       UNION ALL
       SELECT 'CELULAR', a.id, c.id, 'Celular',
              TRIM(CONCAT_WS(' ', c.marca, c.modelo)),
              c.codigo_inventario, c.numero_serie,
              a.fecha_asignacion, a.fecha_devolucion, a.condicion_devolucion,
              a.observaciones_asignacion, a.observaciones_devolucion,
              (a.fecha_devolucion IS NULL),
              ua.name, ur.name
       FROM asignaciones_celulares a
       JOIN celulares c    ON c.id = a.celular_id
       LEFT JOIN users ua  ON ua.id = a.asignado_por
       LEFT JOIN users ur  ON ur.id = a.recibido_por
       WHERE a.colaborador_id = :id
     ) h
     ORDER BY h.fecha_asignacion DESC, h.categoria, h.asignacion_id DESC`,
    { id: colaboradorId }
  );
  return rows.map((r) => ({ ...r, vigente: !!r.vigente }));
}

/**
 * Todo lo que el colaborador tiene HOY (equipos + accesorios + impresoras + celulares) en una sola
 * lista: es el insumo directo de la carta responsiva.
 */
async function findVigentes(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT categoria, asignacion_id, item_id, codigo_inventario, tipo, descripcion,
            numero_serie, fecha_asignacion
     FROM v_asignaciones_vigentes
     WHERE colaborador_id = :id
     ORDER BY categoria, fecha_asignacion, asignacion_id`,
    { id: colaboradorId }
  );

  // Carta responsiva vigente (no cancelada) de cada recurso, si ya tiene una.
  const [cartas] = await pool.query(
    `SELECT ci.tipo_recurso AS categoria,
            COALESCE(ci.asignacion_equipo_id, ci.asignacion_accesorio_id,
                     ci.asignacion_impresora_id, ci.asignacion_celular_id) AS asignacion_id,
            c.id AS carta_id, c.folio AS carta_folio, c.estado AS carta_estado
       FROM cartas_responsivas_items ci
       JOIN cartas_responsivas c ON c.id = ci.carta_id
      WHERE ci.activo = 1 AND c.colaborador_id = :id`,
    { id: colaboradorId }
  );
  const byKey = new Map(cartas.map((c) => [`${c.categoria}:${c.asignacion_id}`, c]));

  return rows.map((r) => {
    const c = byKey.get(`${r.categoria}:${r.asignacion_id}`);
    return { ...r, carta: c ? { id: c.carta_id, folio: c.carta_folio, estado: c.carta_estado } : null };
  });
}

// ---------------------------------------------------------------------------
// Importacion masiva (Configuracion > Datos y respaldos, solo admin).
// Una fila = un intento de alta independiente: una fila mala no tumba al resto.
// ---------------------------------------------------------------------------
const COLUMNAS_IMPORTACION = [
  { key: 'id_empleado', header: 'ID Empleado', width: 16 },
  { key: 'nombre', header: 'Nombre', width: 20 },
  { key: 'apellido_paterno', header: 'Apellido paterno', width: 20 },
  { key: 'apellido_materno', header: 'Apellido materno', width: 20 },
  { key: 'area', header: 'Área (nombre exacto)', width: 22 },
  { key: 'cargo', header: 'Cargo (nombre exacto)', width: 22 },
  { key: 'correo_empresarial', header: 'Correo empresarial', width: 28 },
  { key: 'telefono_empresarial', header: 'Teléfono empresarial', width: 20 },
  { key: 'correo_personal', header: 'Correo personal', width: 28 },
  { key: 'telefono_personal', header: 'Teléfono personal', width: 20 },
  { key: 'fecha_alta', header: 'Fecha de alta (AAAA-MM-DD)', width: 22 },
];

/** Importa colaboradores desde filas ya leidas de un Excel (ver utils/importExport.js). */
async function importar(filas) {
  const [areas] = await pool.query('SELECT id, nombre FROM areas WHERE activo = 1');
  const [cargos] = await pool.query('SELECT id, nombre FROM cargos WHERE activo = 1');
  const areaPorNombre = new Map(areas.map((a) => [a.nombre.trim().toLowerCase(), a.id]));
  const cargoPorNombre = new Map(cargos.map((c) => [c.nombre.trim().toLowerCase(), c.id]));

  const vistosEnArchivo = new Set(); // detecta duplicados DENTRO del mismo archivo
  const errores = [];
  let creados = 0;

  for (const fila of filas) {
    const err = (mensaje) => errores.push({ fila: fila._fila, mensaje });
    const idEmpleado = String(fila.id_empleado || '').trim();
    const nombre = String(fila.nombre || '').trim();
    const apellidoPaterno = String(fila.apellido_paterno || '').trim();
    const areaId = areaPorNombre.get(String(fila.area || '').trim().toLowerCase());
    const cargoId = cargoPorNombre.get(String(fila.cargo || '').trim().toLowerCase());
    const fechaAlta = fila.fecha_alta instanceof Date
      ? fila.fecha_alta.toISOString().slice(0, 10)
      : String(fila.fecha_alta || '').trim();

    if (!idEmpleado || !nombre || !apellidoPaterno) { err('Faltan datos obligatorios (ID empleado, nombre o apellido paterno).'); continue; }
    if (!areaId) { err(`El área "${fila.area || ''}" no existe (revisa el nombre exacto).`); continue; }
    if (!cargoId) { err(`El cargo "${fila.cargo || ''}" no existe (revisa el nombre exacto).`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAlta)) { err('La fecha de alta debe tener el formato AAAA-MM-DD.'); continue; }
    if (vistosEnArchivo.has(idEmpleado)) { err(`El ID de empleado "${idEmpleado}" está repetido en el archivo.`); continue; }
    vistosEnArchivo.add(idEmpleado);

    try {
      await create({
        id_empleado: idEmpleado,
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: String(fila.apellido_materno || '').trim() || null,
        area_id: areaId,
        cargo_id: cargoId,
        correo_empresarial: String(fila.correo_empresarial || '').trim() || null,
        telefono_empresarial: String(fila.telefono_empresarial || '').trim() || null,
        correo_personal: String(fila.correo_personal || '').trim() || null,
        telefono_personal: String(fila.telefono_personal || '').trim() || null,
        fecha_alta: fechaAlta,
        fecha_baja: null,
        activo: true,
      });
      creados++;
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        err(dbErr.sqlMessage?.includes('id_empleado') ? `Ya existe un colaborador con el ID "${idEmpleado}".` : 'Ese correo empresarial ya está registrado.');
      } else {
        err('No se pudo guardar esta fila.');
      }
    }
  }

  return { creados, errores };
}

module.exports = {
  findAll,
  findById,
  getStats,
  create,
  update,
  setFotografia,
  findEquiposAsignados,
  findAccesoriosAsignados,
  findImpresorasAsignadas,
  findCelularesAsignados,
  findHistorial,
  findVigentes,
  COLUMNAS_IMPORTACION,
  importar,
};
