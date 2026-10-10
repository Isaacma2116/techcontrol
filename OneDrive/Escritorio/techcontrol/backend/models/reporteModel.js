const { pool } = require('../config/db');
const { GARANTIA_ALERTA_DIAS, TIPOS_ACTIVO } = require('../utils/reportes');

/**
 * Reportes y Analisis: SOLO lectura agregada sobre las tablas que ya existen.
 * Nada de lo que devuelve este modulo se guarda: todo se calcula al vuelo con
 * SQL (COUNT/SUM/GROUP BY) sobre equipos, accesorios, impresoras, celulares,
 * colaboradores, mantenimientos, licencias, redes y dispositivos_red.
 *
 * Departamento de un activo = area del colaborador que lo tiene asignado hoy
 * (o, si no tiene responsable pero SI ubicacion fisica -como una impresora en
 * un pasillo-, el area de esa ubicacion). Equipos, accesorios y celulares NO
 * tienen una ubicacion fisica propia en este sistema (solo impresoras la
 * tienen): "activos por ubicacion" por eso solo cubre impresoras.
 */

// Una fila por activo, sin importar el tipo: (kind, id, estado, area_id, created_at,
// garantia_vence). Es la base de "por tipo", "por departamento" y "garantias".
function activosUnion() {
  return `
    SELECT 'equipos' AS kind, e.id, e.estado, ac.area_id, e.created_at, e.garantia_vence
      FROM equipos e
      LEFT JOIN asignaciones_equipos aa ON aa.equipo_id = e.id AND aa.fecha_devolucion IS NULL
      LEFT JOIN colaboradores ac        ON ac.id = aa.colaborador_id
    UNION ALL
    SELECT 'accesorios', a.id, a.estado, ac.area_id, a.created_at, a.garantia_vence
      FROM accesorios a
      LEFT JOIN asignaciones_accesorios aa ON aa.accesorio_id = a.id AND aa.fecha_devolucion IS NULL
      LEFT JOIN colaboradores ac           ON ac.id = aa.colaborador_id
    UNION ALL
    SELECT 'impresoras', p.id, p.estado, COALESCE(ac.area_id, u.area_id), p.created_at, p.garantia_vence
      FROM impresoras p
      LEFT JOIN asignaciones_impresoras aa ON aa.impresora_id = p.id AND aa.fecha_devolucion IS NULL
      LEFT JOIN colaboradores ac           ON ac.id = aa.colaborador_id
      LEFT JOIN ubicaciones u              ON u.id = p.ubicacion_id
    UNION ALL
    SELECT 'celulares', c.id, c.estado, ac.area_id, c.created_at, c.garantia_vence
      FROM celulares c
      LEFT JOIN asignaciones_celulares aa ON aa.celular_id = c.id AND aa.fecha_devolucion IS NULL
      LEFT JOIN colaboradores ac          ON ac.id = aa.colaborador_id`;
}

/** WHERE aplicable a `activosUnion()`: tipo de activo, departamento, estado y periodo (alta). */
function activosFilters({ tipoActivo, departamentoId, estado, desde, hasta }, alias = 'x') {
  const where = [];
  const params = {};
  if (tipoActivo) { where.push(`${alias}.kind = :tipoActivo`); params.tipoActivo = tipoActivo; }
  if (departamentoId) { where.push(`${alias}.area_id = :departamentoId`); params.departamentoId = departamentoId; }
  if (estado) { where.push(`${alias}.estado = :estado`); params.estado = estado; }
  if (desde) { where.push(`${alias}.created_at >= :desde`); params.desde = desde; }
  if (hasta) { where.push(`${alias}.created_at < :hasta + INTERVAL 1 DAY`); params.hasta = hasta; }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

// Los 6 estados del inventario, agrupados en los 4 baldes que pide el dashboard.
const ESTADO_BUCKET = `
  CASE x.estado
    WHEN 'disponible'   THEN 'disponible'
    WHEN 'asignado'     THEN 'asignado'
    WHEN 'mantenimiento' THEN 'mantenimiento'
    WHEN 'reparacion'   THEN 'mantenimiento'
    WHEN 'baja'         THEN 'baja'
    WHEN 'perdido'      THEN 'baja'
  END`;

/** Tarjetas: total de activos y los 4 estados agregados. */
async function resumenActivos(filters) {
  const { clause, params } = activosFilters(filters);
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(${ESTADO_BUCKET} = 'disponible'), 0)   AS disponibles,
            COALESCE(SUM(${ESTADO_BUCKET} = 'asignado'), 0)     AS asignados,
            COALESCE(SUM(${ESTADO_BUCKET} = 'mantenimiento'), 0) AS en_mantenimiento,
            COALESCE(SUM(${ESTADO_BUCKET} = 'baja'), 0)         AS de_baja
       FROM (${activosUnion()}) x ${clause}`,
    params
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

/** Grafico: distribucion de activos por tipo (equipos/accesorios/impresoras/celulares). */
async function activosPorTipo(filters) {
  const { clause, params } = activosFilters(filters);
  const [rows] = await pool.query(
    `SELECT x.kind AS tipo, COUNT(*) AS total FROM (${activosUnion()}) x ${clause} GROUP BY x.kind`,
    params
  );
  const totales = Object.fromEntries(TIPOS_ACTIVO.map((t) => [t, 0]));
  for (const r of rows) totales[r.tipo] = Number(r.total);
  return Object.entries(totales).map(([tipo, total]) => ({ tipo, total }));
}

/** Grafico: activos por departamento (area del responsable actual, o de su ubicacion fisica). */
async function activosPorDepartamento(filters) {
  const { clause, params } = activosFilters(filters);
  const [rows] = await pool.query(
    `SELECT a.nombre AS departamento, COUNT(*) AS total
       FROM (${activosUnion()}) x
       LEFT JOIN areas a ON a.id = x.area_id
       ${clause}
       GROUP BY a.id, a.nombre
       ORDER BY total DESC`,
    params
  );
  return rows.map((r) => ({ departamento: r.departamento || 'Sin asignar', total: Number(r.total) }));
}

/** Grafico: activos por ubicacion. Solo impresoras tienen ubicacion fisica propia en este sistema. */
async function activosPorUbicacion(filters) {
  const where = ['1=1'];
  const params = {};
  if (filters.departamentoId) { where.push('u.area_id = :departamentoId'); params.departamentoId = filters.departamentoId; }
  if (filters.estado) { where.push('p.estado = :estado'); params.estado = filters.estado; }
  if (filters.desde) { where.push('p.created_at >= :desde'); params.desde = filters.desde; }
  if (filters.hasta) { where.push('p.created_at < :hasta + INTERVAL 1 DAY'); params.hasta = filters.hasta; }
  // Si el filtro pide otro tipo de activo, aqui no hay nada que mostrar (impresoras es el unico con ubicacion).
  if (filters.tipoActivo && filters.tipoActivo !== 'impresoras') return [];

  const [rows] = await pool.query(
    `SELECT u.nombre AS ubicacion, COUNT(*) AS total
       FROM impresoras p
       LEFT JOIN ubicaciones u ON u.id = p.ubicacion_id
      WHERE ${where.join(' AND ')}
      GROUP BY u.id, u.nombre
      ORDER BY total DESC`,
    params
  );
  return rows.map((r) => ({ ubicacion: r.ubicacion || 'Sin ubicación', total: Number(r.total) }));
}

/** Tarjeta: total de colaboradores activos (respeta el filtro de departamento). */
async function totalColaboradores({ departamentoId }) {
  const where = ['activo = 1'];
  const params = {};
  if (departamentoId) { where.push('area_id = :departamentoId'); params.departamentoId = departamentoId; }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM colaboradores WHERE ${where.join(' AND ')}`, params);
  return Number(total);
}

/** Tarjetas: garantias vigentes / por vencer / vencidas (mismos filtros que "activos"). */
async function garantias(filters) {
  const { clause, params } = activosFilters(filters);
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(x.garantia_vence IS NOT NULL AND x.garantia_vence >= CURDATE() + INTERVAL :dias DAY), 0) AS vigentes,
       COALESCE(SUM(x.garantia_vence IS NOT NULL AND x.garantia_vence >= CURDATE() AND x.garantia_vence < CURDATE() + INTERVAL :dias DAY), 0) AS por_vencer,
       COALESCE(SUM(x.garantia_vence IS NOT NULL AND x.garantia_vence < CURDATE()), 0) AS vencidas,
       COALESCE(SUM(x.garantia_vence IS NULL), 0) AS sin_garantia
     FROM (${activosUnion()}) x ${clause}`,
    { ...params, dias: GARANTIA_ALERTA_DIAS }
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

/** Grafico: mantenimientos por periodo (mes) + preventivo vs correctivo, en un solo dataset. */
async function mantenimientosPorPeriodo({ desde, hasta }) {
  const where = [];
  const params = {};
  // Sin rango explicito: los ultimos 6 meses (vista por defecto del dashboard).
  where.push('fecha_programada >= :desde');
  params.desde = desde || null;
  where.push('fecha_programada <= :hasta');
  params.hasta = hasta || null;

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(fecha_programada, '%Y-%m') AS periodo,
            COALESCE(SUM(tipo = 'preventivo'), 0) AS preventivos,
            COALESCE(SUM(tipo = 'correctivo'), 0) AS correctivos
       FROM mantenimientos
      WHERE fecha_programada >= COALESCE(:desde, DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01'))
        AND fecha_programada <= COALESCE(:hasta, CURDATE())
      GROUP BY periodo
      ORDER BY periodo`,
    params
  );
  return rows.map((r) => ({ periodo: r.periodo, preventivos: Number(r.preventivos), correctivos: Number(r.correctivos) }));
}

/** Tarjetas: mantenimientos realizados, pendientes (programados) y vencidos. */
async function resumenMantenimientos({ desde, hasta }) {
  const where = ['1=1'];
  const params = {};
  if (desde) { where.push('fecha_programada >= :desde'); params.desde = desde; }
  if (hasta) { where.push('fecha_programada <= :hasta'); params.hasta = hasta; }
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(estado = 'realizado'), 0) AS realizados,
       COALESCE(SUM(estado = 'programado' AND fecha_programada >= CURDATE()), 0) AS pendientes,
       COALESCE(SUM(estado = 'programado' AND fecha_programada < CURDATE()), 0)  AS vencidos
     FROM mantenimientos WHERE ${where.join(' AND ')}`,
    params
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

/** Tarjeta + meter: uso de licencias (puestos totales vs utilizados), solo licencias activas. */
async function licencias() {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(v.cantidad_total), 0) AS total, COALESCE(SUM(v.utilizadas), 0) AS utilizadas
       FROM licencias l JOIN v_licencias_uso v ON v.licencia_id = l.id
      WHERE l.estado = 'activa'`
  );
  const total = Number(row.total);
  const utilizadas = Number(row.utilizadas);
  return { total, utilizadas, disponibles: total - utilizadas };
}

/** Tarjetas + grafico: dispositivos de red, por estado y por tipo. */
async function dispositivosRed({ departamentoId, ubicacionId }) {
  const where = ['1=1'];
  const params = {};
  if (ubicacionId) { where.push('d.ubicacion_id = :ubicacionId'); params.ubicacionId = ubicacionId; }
  if (departamentoId) { where.push('u.area_id = :departamentoId'); params.departamentoId = departamentoId; }
  const clause = where.join(' AND ');

  const [[resumen]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(d.estado = 'activo'), 0) AS activos,
            COALESCE(SUM(d.estado = 'inactivo'), 0) AS inactivos,
            COALESCE(SUM(d.estado = 'mantenimiento'), 0) AS en_mantenimiento,
            COALESCE(SUM(d.estado = 'baja'), 0) AS de_baja
       FROM dispositivos_red d LEFT JOIN ubicaciones u ON u.id = d.ubicacion_id
      WHERE ${clause}`,
    params
  );
  const [porTipo] = await pool.query(
    `SELECT d.tipo, COUNT(*) AS total
       FROM dispositivos_red d LEFT JOIN ubicaciones u ON u.id = d.ubicacion_id
      WHERE ${clause}
      GROUP BY d.tipo
      ORDER BY total DESC`,
    params
  );
  return {
    resumen: Object.fromEntries(Object.entries(resumen).map(([k, v]) => [k, Number(v)])),
    porTipo: porTipo.map((r) => ({ tipo: r.tipo, total: Number(r.total) })),
  };
}

/** El dashboard completo en una sola llamada (una promesa por seccion, en paralelo). */
async function dashboard(filters) {
  const [
    resumen, porTipo, porDepartamento, porUbicacion, totalColab,
    garantiasData, mantenimientosPeriodo, mantenimientosResumen, licenciasData, redData,
  ] = await Promise.all([
    resumenActivos(filters),
    activosPorTipo(filters),
    activosPorDepartamento(filters),
    activosPorUbicacion(filters),
    totalColaboradores(filters),
    garantias(filters),
    mantenimientosPorPeriodo(filters),
    resumenMantenimientos(filters),
    licencias(),
    dispositivosRed(filters),
  ]);

  return {
    activos: { ...resumen, colaboradores: totalColab },
    activosPorTipo: porTipo,
    activosPorDepartamento: porDepartamento,
    activosPorUbicacion: porUbicacion,
    garantias: garantiasData,
    mantenimientos: { ...mantenimientosResumen, porPeriodo: mantenimientosPeriodo },
    licencias: licenciasData,
    dispositivosRed: redData,
  };
}

module.exports = {
  dashboard, resumenActivos, activosPorTipo, activosPorDepartamento, activosPorUbicacion,
  totalColaboradores, garantias, mantenimientosPorPeriodo, resumenMantenimientos, licencias, dispositivosRed,
};
