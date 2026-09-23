const { pool } = require('../config/db');
const reporteModel = require('./reporteModel');
const { GARANTIA_ALERTA_DIAS } = require('../utils/reportes');

/**
 * Dashboard principal: foto del estado ACTUAL de la infraestructura (sin
 * filtros de fecha/departamento, a diferencia de Reportes). Reutiliza las
 * consultas ya agregadas de reporteModel para todo lo que se superpone
 * (totales de activos, garantias, licencias, mantenimientos) y solo agrega
 * consultas propias donde el dashboard pide un corte distinto (categorias
 * con Monitores separados de Accesorios y Redes incluidas, listas de
 * pendientes, actividad reciente).
 */

const SIN_FILTROS = {};

// Mantenimientos "proximos" (no vencidos, pero cerca): ventana corta a proposito,
// distinta de GARANTIA_ALERTA_DIAS (60 dias) porque un mantenimiento se agenda
// con mucha menos antelacion que el vencimiento de una garantia.
const MANTENIMIENTO_PROXIMO_DIAS = 7;
const LIMITE_LISTAS = 6;
const LIMITE_ACTIVIDAD = 15;

/** Tarjetas principales (#1): todas ya las calcula reporteModel, en paralelo. */
async function tarjetas() {
  const [resumen, colaboradores, garantiasData, mantenimientosData, licenciasData] = await Promise.all([
    reporteModel.resumenActivos(SIN_FILTROS),
    reporteModel.totalColaboradores(SIN_FILTROS),
    reporteModel.garantias(SIN_FILTROS),
    reporteModel.resumenMantenimientos(SIN_FILTROS),
    reporteModel.licencias(),
  ]);
  return {
    total_activos: resumen.total,
    asignados: resumen.asignados,
    disponibles: resumen.disponibles,
    en_mantenimiento: resumen.en_mantenimiento,
    colaboradores,
    licencias_registradas: licenciasData.total,
    licencias_disponibles: licenciasData.disponibles,
    garantias_por_vencer: garantiasData.por_vencer,
    mantenimientos_pendientes: mantenimientosData.pendientes,
  };
}

/** #2 Estado general del inventario: mismo balde de 4 estados que las tarjetas. */
async function estadoInventario() {
  const r = await reporteModel.resumenActivos(SIN_FILTROS);
  return [
    { estado: 'disponible', total: r.disponibles },
    { estado: 'asignado', total: r.asignados },
    { estado: 'mantenimiento', total: r.en_mantenimiento },
    { estado: 'baja', total: r.de_baja },
  ];
}

/**
 * #3 Inventario por categoria: a diferencia de reporteModel.activosPorTipo,
 * separa Monitores de Accesorios (son un tipo_accesorio, no una tabla propia)
 * e incluye Redes y dispositivos (dispositivos_red no es un "activo" para
 * Reportes/garantias, pero si es inventario para este dashboard).
 */
async function inventarioPorCategoria() {
  const [[row]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM equipos) AS equipos,
      (SELECT COUNT(*) FROM accesorios acc
         JOIN tipos_accesorio ta ON ta.id = acc.tipo_accesorio_id
        WHERE ta.nombre <> 'Monitor')                                   AS accesorios,
      (SELECT COUNT(*) FROM accesorios acc
         JOIN tipos_accesorio ta ON ta.id = acc.tipo_accesorio_id
        WHERE ta.nombre = 'Monitor')                                    AS monitores,
      (SELECT COUNT(*) FROM impresoras)                                 AS impresoras,
      (SELECT COUNT(*) FROM celulares)                                  AS celulares,
      (SELECT COUNT(*) FROM dispositivos_red)                           AS redes_dispositivos
  `);
  const labels = {
    equipos: 'Equipos', accesorios: 'Accesorios', monitores: 'Monitores',
    impresoras: 'Impresoras', celulares: 'Celulares', redes_dispositivos: 'Redes y dispositivos',
  };
  return Object.entries(labels).map(([categoria, label]) => ({ categoria, label, total: Number(row[categoria]) }));
}

/** #4 Alertas y pendientes: una fila por situacion, con el conteo real. */
async function alertas() {
  const [
    mantVencidos, mantProximos, garantiasData, sinColaborador, licenciasUso, dispRed,
  ] = await Promise.all([
    pool.query(
      "SELECT COUNT(*) AS n FROM mantenimientos WHERE estado = 'programado' AND fecha_programada < CURDATE()"
    ),
    pool.query(
      `SELECT COUNT(*) AS n FROM mantenimientos
        WHERE estado = 'programado'
          AND fecha_programada >= CURDATE() AND fecha_programada < CURDATE() + INTERVAL :dias DAY`,
      { dias: MANTENIMIENTO_PROXIMO_DIAS }
    ),
    reporteModel.garantias(SIN_FILTROS),
    pool.query("SELECT COUNT(*) AS n FROM equipos WHERE estado = 'disponible'"),
    pool.query(
      "SELECT estado_efectivo, COUNT(*) AS n FROM v_licencias_uso WHERE estado_efectivo IN ('por_vencer','agotada') GROUP BY estado_efectivo"
    ),
    pool.query("SELECT COUNT(*) AS n FROM dispositivos_red WHERE estado = 'inactivo'"),
  ]);

  const licPorEstado = Object.fromEntries(licenciasUso[0].map((r) => [r.estado_efectivo, Number(r.n)]));

  return [
    {
      id: 'mantenimientos_vencidos', nivel: 'critico', total: Number(mantVencidos[0][0].n),
      texto: (n) => `${n} mantenimiento${n === 1 ? '' : 's'} vencido${n === 1 ? '' : 's'}`,
      href: '/mantenimientos?vista=lista&estado=vencido',
    },
    {
      id: 'mantenimientos_proximos', nivel: 'info', total: Number(mantProximos[0][0].n),
      texto: (n) => `${n} mantenimiento${n === 1 ? '' : 's'} programado${n === 1 ? '' : 's'} en los próximos ${MANTENIMIENTO_PROXIMO_DIAS} días`,
      href: '/mantenimientos?vista=lista&estado=programado',
    },
    {
      id: 'garantias_por_vencer', nivel: 'advertencia', total: garantiasData.por_vencer,
      texto: (n) => `${n} garantía${n === 1 ? '' : 's'} próxima${n === 1 ? '' : 's'} a vencer`,
      href: '#garantias',
    },
    {
      id: 'garantias_vencidas', nivel: 'critico', total: garantiasData.vencidas,
      texto: (n) => `${n} garantía${n === 1 ? '' : 's'} vencida${n === 1 ? '' : 's'}`,
      href: '#garantias',
    },
    {
      id: 'equipos_sin_colaborador', nivel: 'info', total: Number(sinColaborador[0][0].n),
      texto: (n) => `${n} equipo${n === 1 ? '' : 's'} sin colaborador asignado`,
      href: '/equipos?asignacion=sin',
    },
    {
      id: 'licencias_por_vencer', nivel: 'advertencia', total: licPorEstado.por_vencer || 0,
      texto: (n) => `${n} licencia${n === 1 ? '' : 's'} próxima${n === 1 ? '' : 's'} a vencer`,
      href: '/licencias?estado=por_vencer',
      permiso: 'licencias.ver',
    },
    {
      id: 'licencias_agotadas', nivel: 'critico', total: licPorEstado.agotada || 0,
      texto: (n) => `${n} licencia${n === 1 ? '' : 's'} agotada${n === 1 ? '' : 's'} (sin puestos disponibles)`,
      href: '/licencias?estado=agotada',
      permiso: 'licencias.ver',
    },
    {
      id: 'dispositivos_red_inactivos', nivel: 'advertencia', total: Number(dispRed[0][0].n),
      texto: (n) => `${n} dispositivo${n === 1 ? '' : 's'} de red inactivo${n === 1 ? '' : 's'}`,
      href: '/redes?tab=dispositivos&estado=inactivo',
      permiso: 'redes.ver',
    },
  ]
    .map(({ texto, total, ...rest }) => ({ ...rest, total, texto: texto(total) }))
    .filter((a) => a.total > 0);
}

/** #5 Proximos mantenimientos: los mas cercanos, con la unidad resuelta por la vista compartida. */
async function proximosMantenimientos() {
  const [rows] = await pool.query(
    `SELECT m.id, m.folio, m.tipo, m.fecha_programada, m.estado,
            r.titulo AS equipo, r.codigo_inventario, r.tipo AS tipo_unidad,
            u.name AS responsable
       FROM mantenimientos m
       LEFT JOIN v_recursos_inventario r
         ON r.tipo_recurso = m.tipo_recurso AND r.item_id = m.recurso_id
       LEFT JOIN users u ON u.id = m.responsable_id
      WHERE m.estado = 'programado'
      ORDER BY m.fecha_programada ASC, m.id ASC
      LIMIT :limite`,
    { limite: LIMITE_LISTAS }
  );
  return rows;
}

/**
 * #6 Garantias proximas a vencer: equipos + accesorios + impresoras + celulares +
 * dispositivos de red, en una sola lista ordenada por urgencia. "Proveedor" es el
 * unico dato de texto libre que existe hoy (garantia_detalle); dispositivos_red es
 * la unica tabla con un proveedor real (catalogo `proveedores`).
 */
async function garantiasProximas({ incluirRed } = {}) {
  const partes = [
    `SELECT 'equipos' AS kind, e.id, e.codigo_inventario,
            TRIM(CONCAT_WS(' ', e.marca, e.modelo)) AS titulo, e.marca, e.modelo,
            e.garantia_detalle AS proveedor, e.garantia_vence
       FROM equipos e WHERE e.garantia_vence IS NOT NULL`,
    `SELECT 'accesorios', a.id, a.codigo_inventario,
            a.nombre, a.marca, a.modelo, NULL, a.garantia_vence
       FROM accesorios a WHERE a.garantia_vence IS NOT NULL`,
    `SELECT 'impresoras', p.id, p.codigo_inventario,
            TRIM(CONCAT_WS(' ', p.marca, p.modelo)), p.marca, p.modelo,
            p.garantia_detalle, p.garantia_vence
       FROM impresoras p WHERE p.garantia_vence IS NOT NULL`,
    `SELECT 'celulares', c.id, c.codigo_inventario,
            TRIM(CONCAT_WS(' ', c.marca, c.modelo)), c.marca, c.modelo,
            c.garantia_detalle, c.garantia_vence
       FROM celulares c WHERE c.garantia_vence IS NOT NULL`,
  ];
  if (incluirRed) {
    partes.push(`
      SELECT 'dispositivos_red', d.id, d.codigo,
             d.nombre, d.marca, d.modelo,
             pr.nombre, d.fecha_garantia
        FROM dispositivos_red d LEFT JOIN proveedores pr ON pr.id = d.proveedor_id
       WHERE d.fecha_garantia IS NOT NULL`);
  }

  const [rows] = await pool.query(
    `SELECT x.*, DATEDIFF(x.garantia_vence, CURDATE()) AS dias_restantes
       FROM (${partes.join(' UNION ALL ')}) x
      WHERE x.garantia_vence < CURDATE() + INTERVAL :dias DAY
      ORDER BY x.garantia_vence ASC
      LIMIT :limite`,
    { dias: GARANTIA_ALERTA_DIAS, limite: LIMITE_LISTAS }
  );
  return rows.map((r) => ({ ...r, dias_restantes: Number(r.dias_restantes), vencida: r.dias_restantes < 0 }));
}

/** #7 Licencias: resumen + las que mas atencion piden (agotadas primero, luego por vencer segun cercania). */
async function licenciasSeccion() {
  const [resumen, [porVencer], [prioridad]] = await Promise.all([
    reporteModel.licencias(),
    pool.query("SELECT COUNT(*) AS n FROM v_licencias_uso WHERE estado_efectivo = 'por_vencer'"),
    pool.query(`
      SELECT l.id, l.codigo, s.nombre AS software, v.disponibles, v.cantidad_total,
             v.dias_para_vencer, v.estado_efectivo
        FROM licencias l
        JOIN software s        ON s.id = l.software_id
        JOIN v_licencias_uso v ON v.licencia_id = l.id
       WHERE v.estado_efectivo IN ('agotada', 'por_vencer')
       ORDER BY FIELD(v.estado_efectivo, 'agotada', 'por_vencer'), v.dias_para_vencer ASC
       LIMIT :limite`, { limite: LIMITE_LISTAS }),
  ]);
  return { ...resumen, por_vencer: Number(porVencer[0].n), prioridad };
}

/**
 * #8 Equipos disponibles: desglose de lo unico que un colaborador podria recibir
 * hoy mismo (estado = disponible), agrupado como pide el dashboard.
 */
async function equiposDisponibles() {
  const [[row]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM equipos e JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
        WHERE e.estado = 'disponible' AND t.nombre = 'Laptop')                         AS laptops,
      (SELECT COUNT(*) FROM equipos e JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
        WHERE e.estado = 'disponible' AND t.nombre = 'PC')                             AS desktops,
      (SELECT COUNT(*) FROM accesorios a JOIN tipos_accesorio t ON t.id = a.tipo_accesorio_id
        WHERE a.estado = 'disponible' AND t.nombre = 'Monitor')                        AS monitores,
      (SELECT COUNT(*) FROM celulares WHERE estado = 'disponible')                     AS celulares,
      (SELECT COUNT(*) FROM equipos e JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
        WHERE e.estado = 'disponible' AND t.nombre NOT IN ('Laptop', 'PC'))
      +
      (SELECT COUNT(*) FROM accesorios a JOIN tipos_accesorio t ON t.id = a.tipo_accesorio_id
        WHERE a.estado = 'disponible' AND t.nombre <> 'Monitor')
      +
      (SELECT COUNT(*) FROM impresoras WHERE estado = 'disponible')                    AS otros
  `);
  const out = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
  out.total = Object.values(out).reduce((s, v) => s + v, 0);
  return out;
}

// entity -> plantilla en español. `d` son los `details` guardados (pueden faltar campos viejos).
const PLANTILLAS = {
  equipo: {
    creado: (d) => `Se agregó el equipo ${d.codigo_inventario || ''} ${marcaModelo(d)}`.trim(),
    editado: (d) => `Se editó el equipo ${d.codigo_inventario || ''}`.trim(),
    asignado: (d) => `Se asignó el equipo ${d.codigo_inventario || ''} a ${d.colaborador_nombre || 'un colaborador'}`.trim(),
    devuelto: (d) => `Se registró la devolución del equipo ${d.codigo_inventario || ''}`.trim(),
    estado_cambiado: (d) => `El equipo ${d.codigo_inventario || ''} cambió de estado a "${d.estado_nuevo}"`.trim(),
    baja: (d) => `Se dio de baja el equipo ${d.codigo_inventario || ''}`.trim(),
  },
  accesorio: { entidad: 'accesorio' },
  impresora: { entidad: 'impresora', femenino: true },
  celular: { entidad: 'celular' },
  colaborador: {
    creado: (d) => `Se registró al colaborador ${d.nombre || ''}`.trim(),
    editado: (d) => `Se actualizaron los datos de ${d.nombre || 'un colaborador'}`.trim(),
    baja: (d) => `Se dio de baja a ${d.nombre || 'un colaborador'}`.trim(),
    reactivado: (d) => `Se reactivó a ${d.nombre || 'un colaborador'}`.trim(),
  },
  mantenimiento: {
    agendado: (d) => `Se agendó un mantenimiento ${d.tipo || ''} para ${d.unidad || d.folio || 'una unidad'}`.trim(),
    editado: (d) => `Se editó el mantenimiento ${d.folio || ''}`.trim(),
    iniciado: (d) => `Se inició el mantenimiento ${d.folio || ''}`.trim(),
    realizado: (d) => `Se registró el mantenimiento ${d.folio || ''}`.trim(),
    trabajo_corregido: (d) => `Se corrigió el registro del mantenimiento ${d.folio || ''}`.trim(),
    cancelado: (d) => `Se canceló el mantenimiento ${d.folio || ''}`.trim(),
    reprogramado: (d) => `Se reprogramó el mantenimiento ${d.folio || ''}`.trim(),
  },
  licencia: {
    creada: (d) => `Se registró la licencia ${d.codigo || ''}${d.software ? ` de ${d.software}` : ''}`.trim(),
    editada: (d) => `Se editó la licencia ${d.codigo || ''}`.trim(),
    asignada: (d) => `Se asignó un puesto de la licencia ${d.codigo || ''}`.trim(),
    liberada: () => 'Se liberó un puesto de licencia',
    renovada: (d) => `Se renovó la licencia ${d.codigo || ''}`.trim(),
    transferida: (d) => `Se transfirió un puesto de la licencia ${d.codigo || ''}`.trim(),
  },
  red: {
    creada: (d) => `Se registró la red ${d.nombre || ''}`.trim(),
    editada: (d) => `Se editó la red ${d.nombre || ''}`.trim(),
    desactivada: (d) => `Se desactivó la red ${d.nombre || ''}`.trim(),
    reactivada: (d) => `Se reactivó la red ${d.nombre || ''}`.trim(),
  },
  dispositivo_red: {
    creado: (d) => `Se registró el dispositivo de red ${d.nombre || ''}`.trim(),
    editado: (d) => `Se editó el dispositivo de red ${d.nombre || ''}`.trim(),
    estado_cambiado: (d) => `El dispositivo de red cambió de estado a "${d.estado}"`,
  },
  usuario: {}, // deliberadamente sin plantilla: no se muestra (datos de cuentas, ver visibleEntities)
};

// Genera el complemento "Marca Modelo" solo si hay algo que mostrar.
function marcaModelo(d) {
  const t = [d.marca, d.modelo].filter(Boolean).join(' ');
  return t ? `(${t})` : '';
}

/** Texto legible para una fila de audit_logs; null si no hay plantilla para esa combinacion. */
function describir(row) {
  const details = row.details || {};
  const plantilla = PLANTILLAS[row.entity]?.[row.action];
  if (typeof plantilla === 'function') return plantilla(details);
  // Accesorios/impresoras/celulares comparten las plantillas de "equipo" (mismo flujo generico).
  const generico = PLANTILLAS.equipo[row.action];
  if (['accesorio', 'impresora', 'celular'].includes(row.entity) && typeof generico === 'function') {
    const art = PLANTILLAS[row.entity]?.femenino ? 'la' : 'el';
    return generico(details).replace(/^Se (\w+) el /, `Se $1 ${art} `);
  }
  return null;
}

const ENTIDADES_TODOS = ['equipo', 'accesorio', 'impresora', 'celular', 'mantenimiento'];
const ENTIDADES_STAFF = [...ENTIDADES_TODOS, 'colaborador', 'licencia', 'software', 'red', 'dispositivo_red'];

/** #9 Actividad reciente, ya filtrada a lo que el rol puede ver y con texto listo para mostrar. */
async function actividadReciente(role) {
  const entidades = role === 'viewer' ? ENTIDADES_TODOS : ENTIDADES_STAFF;
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.entity, al.entity_id, al.details, al.created_at, u.name AS usuario
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
      WHERE al.entity IN (:entidades)
      ORDER BY al.created_at DESC
      LIMIT :limite`,
    { entidades, limite: LIMITE_ACTIVIDAD }
  );
  return rows
    .map((r) => ({ ...r, texto: describir(r) }))
    .filter((r) => r.texto);
}

async function dashboard(role) {
  const [
    cards, estado, categorias, alertasData, mantenimientos, garantias,
    licenciasData, disponibles, actividad,
  ] = await Promise.all([
    tarjetas(),
    estadoInventario(),
    inventarioPorCategoria(),
    alertas(),
    proximosMantenimientos(),
    garantiasProximas({ incluirRed: role !== 'viewer' }),
    licenciasSeccion(),
    equiposDisponibles(),
    actividadReciente(role),
  ]);

  const tarjetasVisibles = { ...cards };
  if (role === 'viewer') {
    // colaboradores.ver / licencias.ver son STAFF-only: el dashboard no filtra por permiso tarjeta
    // por tarjeta, pero estos dos numeros vienen de modulos que 'viewer' no puede abrir.
    delete tarjetasVisibles.colaboradores;
    delete tarjetasVisibles.licencias_registradas;
    delete tarjetasVisibles.licencias_disponibles;
  }

  return {
    tarjetas: tarjetasVisibles,
    estadoInventario: estado,
    inventarioPorCategoria: categorias,
    alertas: alertasData.filter((a) => !a.permiso || role !== 'viewer'),
    proximosMantenimientos: mantenimientos,
    garantiasProximas: garantias,
    licencias: role === 'viewer' ? null : licenciasData,
    equiposDisponibles: disponibles,
    actividadReciente: actividad,
  };
}

module.exports = {
  dashboard,
  tarjetas,
  estadoInventario,
  inventarioPorCategoria,
  alertas,
  proximosMantenimientos,
  garantiasProximas,
  licenciasSeccion,
  equiposDisponibles,
  actividadReciente,
};
