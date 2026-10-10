const { pool } = require('../config/db');

/**
 * Notificaciones: dos formas de generarlas, un solo mecanismo de entrega.
 *
 *  - EVENTO (alta de un equipo, asignacion, mantenimiento agendado...): se
 *    genera en el momento, desde el mismo modelo que ya audita la accion
 *    (inventarioModel, asignacionModel, mantenimientoModel, dispositivoRedModel).
 *  - FECHA (garantias/licencias por vencer, mantenimientos proximos/vencidos):
 *    se recalculan en `sincronizarAlertas()`, que se llama al abrir el panel
 *    o al pedir el contador. Es SIEMPRE segura de repetir: cada alerta tiene
 *    una `clave_dedup` y un UNIQUE (usuario_id, clave_dedup), asi que volver a
 *    generarla no inserta una fila nueva. Los "cubos" (30d/7d/vencida) no se
 *    superponen, asi que cada equipo/licencia dispara cada aviso una sola vez
 *    conforme pasa por esa ventana (ver DIAS_1/DIAS_2 abajo).
 *
 *  Cada notificacion es de UN usuario (nunca "de un rol"): cuando algo aplica
 *  a varios roles se manda UNA fila por usuario activo elegible, con un solo
 *  INSERT ... SELECT (fan-out en SQL, no un bucle en JS).
 */

const ALL_ROLES = ['admin', 'technician', 'viewer'];
const STAFF_ROLES = ['admin', 'technician'];

// Categorias de preferencia (Configuracion > Notificaciones). Cada `tipo` de
// notificacion pertenece a una sola categoria; sirve para poder apagar
// "Mantenimientos" sin apagar "Garantias", por ejemplo.
const CATEGORIA_POR_TIPO = {
  equipo_nuevo: 'inventario', asignacion_nueva: 'inventario',
  equipo_sin_asignar: 'inventario', inventario_baja: 'inventario',
  mantenimiento_registrado: 'mantenimientos', mantenimiento_completado: 'mantenimientos',
  mantenimiento_hoy: 'mantenimientos', mantenimiento_proximo: 'mantenimientos', mantenimiento_vencido: 'mantenimientos',
  garantia_30d: 'garantias', garantia_7d: 'garantias', garantia_vencida: 'garantias',
  licencia_30d: 'licencias', licencia_7d: 'licencias', licencia_vencida: 'licencias',
  dispositivo_red_inactivo: 'redes',
};

// Categoria -> roles que ALGUNA VEZ pueden recibir algo de ella (mismo criterio
// de permisos que ya aplican los generadores: inventario/mantenimientos = todos,
// licencias/redes = STAFF). Determina que controles se muestran en Configuracion.
const CATEGORIAS = [
  { id: 'inventario', label: 'Inventario', descripcion: 'Altas, asignaciones y bajas de equipos.', roles: ALL_ROLES },
  { id: 'mantenimientos', label: 'Mantenimientos', descripcion: 'Agendados, completados, próximos o vencidos.', roles: ALL_ROLES },
  { id: 'garantias', label: 'Garantías', descripcion: 'Próximas a vencer o vencidas.', roles: ALL_ROLES },
  { id: 'licencias', label: 'Licencias', descripcion: 'Próximas a vencer o vencidas.', roles: STAFF_ROLES },
  { id: 'redes', label: 'Redes', descripcion: 'Dispositivos de red inactivos.', roles: STAFF_ROLES },
];

// Umbrales de "proximo a vencer": mismo criterio en garantias y licencias.
const DIAS_AVISO_1 = 30;
const DIAS_AVISO_2 = 7;
// Mantenimientos se agendan con mucha menos antelacion que una garantia.
const MANTENIMIENTO_PROXIMO_DIAS = 7;

const claveDedup = (tipo, modulo, entidadId) => `${tipo}:${modulo}:${entidadId}`;

/**
 * Genera (o ignora si ya existe) una notificacion para cada usuario activo
 * de los roles dados. `db` es el pool o una conexion de transaccion.
 */
async function notificarRoles(db, { roles, tipo, titulo, mensaje, prioridad, modulo, entidadId, enlace, claveDedup: clave }) {
  const categoria = CATEGORIA_POR_TIPO[tipo] || null;
  await (db || pool).query(
    `INSERT IGNORE INTO notificaciones
       (usuario_id, tipo, titulo, mensaje, prioridad, modulo, entidad_id, enlace, rol_destinatario, clave_dedup)
     SELECT u.id, :tipo, :titulo, :mensaje, :prioridad, :modulo, :entidadId, :enlace, u.role, :clave
       FROM users u
       LEFT JOIN notificacion_preferencias np ON np.usuario_id = u.id AND np.categoria = :categoria
      WHERE u.active = 1 AND u.role IN (:roles)
        AND (:categoria IS NULL OR COALESCE(np.canal_sistema, 1) = 1)`,
    { roles, tipo, titulo, mensaje, prioridad, modulo, entidadId: entidadId == null ? null : String(entidadId), enlace, clave, categoria }
  );
}

/** Preferencias visibles para el rol (licencias/redes no se muestran a quien nunca las recibe). */
async function getPreferencias(usuarioId, role) {
  const categorias = CATEGORIAS.filter((c) => c.roles.includes(role));
  const [rows] = await pool.query(
    'SELECT categoria, canal_sistema, canal_correo FROM notificacion_preferencias WHERE usuario_id = :usuarioId',
    { usuarioId }
  );
  const guardadas = new Map(rows.map((r) => [r.categoria, r]));
  return categorias.map((c) => {
    const g = guardadas.get(c.id);
    return {
      categoria: c.id, label: c.label, descripcion: c.descripcion,
      canal_sistema: g ? !!g.canal_sistema : true, // por defecto: todo activado en el sistema
      canal_correo: g ? !!g.canal_correo : false,   // por defecto: nada por correo (no hay envio real aun)
    };
  });
}

/** Guarda las preferencias del usuario. `lista` = [{ categoria, canal_sistema, canal_correo }]. */
async function guardarPreferencias(usuarioId, role, lista) {
  const permitidas = new Set(CATEGORIAS.filter((c) => c.roles.includes(role)).map((c) => c.id));
  for (const { categoria, canal_sistema, canal_correo } of lista) {
    if (!permitidas.has(categoria)) continue; // nunca guarda una categoria que ese rol no deberia ver
    await pool.query(
      `INSERT INTO notificacion_preferencias (usuario_id, categoria, canal_sistema, canal_correo)
       VALUES (:usuarioId, :categoria, :canalSistema, :canalCorreo)
       ON DUPLICATE KEY UPDATE canal_sistema = :canalSistema, canal_correo = :canalCorreo`,
      { usuarioId, categoria, canalSistema: canal_sistema ? 1 : 0, canalCorreo: canal_correo ? 1 : 0 }
    );
  }
  return getPreferencias(usuarioId, role);
}

// ---------------------------------------------------------------------------
// Generadores por fecha (garantias, licencias, mantenimientos)
// ---------------------------------------------------------------------------

const RUTA_GARANTIA = {
  equipos: '/equipos', accesorios: '/accesorios', impresoras: '/impresoras', celulares: '/celulares',
};

/** Bucket segun dias restantes: null si todavia no entra en ninguna ventana de aviso. */
function bucketDias(dias) {
  if (dias < 0) return 'vencida';
  if (dias <= DIAS_AVISO_2) return '7d';
  if (dias <= DIAS_AVISO_1) return '30d';
  return null;
}

async function sincronizarGarantias() {
  const partes = ['equipos', 'accesorios', 'impresoras', 'celulares'].map(
    (tabla) => `SELECT '${tabla}' AS modulo, id, codigo_inventario AS codigo, DATEDIFF(garantia_vence, CURDATE()) AS dias
                  FROM ${tabla} WHERE garantia_vence IS NOT NULL`
  );
  const [rows] = await pool.query(partes.join(' UNION ALL '));

  for (const r of rows) {
    const bucket = bucketDias(r.dias);
    if (!bucket) continue;
    const tipo = `garantia_${bucket}`;
    const critica = bucket === 'vencida';
    const titulo = critica ? 'Garantía vencida' : 'Garantía próxima a vencer';
    const mensaje = critica
      ? `El equipo ${r.codigo} tiene la garantía vencida desde hace ${Math.abs(r.dias)} día(s).`
      : `El equipo ${r.codigo} vence su garantía en ${r.dias} día(s).`;
    await notificarRoles(pool, {
      roles: ALL_ROLES, tipo, titulo, mensaje, prioridad: critica ? 'critica' : 'advertencia',
      modulo: r.modulo, entidadId: r.id, enlace: `${RUTA_GARANTIA[r.modulo]}/${r.id}`,
      claveDedup: claveDedup(tipo, r.modulo, r.id),
    });
  }
}

async function sincronizarLicencias() {
  const [rows] = await pool.query(`
    SELECT l.id, l.codigo, s.nombre AS software, v.dias_para_vencer AS dias
      FROM licencias l
      JOIN software s        ON s.id = l.software_id
      JOIN v_licencias_uso v ON v.licencia_id = l.id
     WHERE l.estado = 'activa' AND v.dias_para_vencer IS NOT NULL
  `);

  for (const r of rows) {
    const bucket = bucketDias(r.dias);
    if (!bucket) continue;
    const tipo = `licencia_${bucket}`;
    const critica = bucket === 'vencida';
    const titulo = critica ? 'Licencia vencida' : 'Licencia próxima a vencer';
    const mensaje = critica
      ? `La licencia ${r.codigo} (${r.software}) venció hace ${Math.abs(r.dias)} día(s).`
      : `La licencia ${r.codigo} (${r.software}) vence en ${r.dias} día(s).`;
    await notificarRoles(pool, {
      roles: STAFF_ROLES, tipo, titulo, mensaje, prioridad: critica ? 'critica' : 'advertencia',
      modulo: 'licencias', entidadId: r.id, enlace: `/licencias/${r.id}`,
      claveDedup: claveDedup(tipo, 'licencias', r.id),
    });
  }
}

async function sincronizarMantenimientos() {
  const [rows] = await pool.query(`
    SELECT m.id, m.fecha_programada, r.titulo AS unidad, r.codigo_inventario AS codigo,
           DATEDIFF(m.fecha_programada, CURDATE()) AS dias
      FROM mantenimientos m
      LEFT JOIN v_recursos_inventario r ON r.tipo_recurso = m.tipo_recurso AND r.item_id = m.recurso_id
     WHERE m.estado = 'programado'
       AND m.fecha_programada <= CURDATE() + INTERVAL :dias DAY
  `, { dias: MANTENIMIENTO_PROXIMO_DIAS });

  for (const r of rows) {
    const unidad = r.unidad || r.codigo || 'una unidad';
    let tipo, titulo, mensaje, prioridad;
    if (r.dias < 0) {
      tipo = 'mantenimiento_vencido'; prioridad = 'critica';
      titulo = 'Mantenimiento vencido';
      mensaje = `El mantenimiento de ${unidad} venció hace ${Math.abs(r.dias)} día(s).`;
    } else if (r.dias === 0) {
      tipo = 'mantenimiento_hoy'; prioridad = 'advertencia';
      titulo = 'Mantenimiento programado para hoy';
      mensaje = `El mantenimiento de ${unidad} está programado para hoy.`;
    } else {
      tipo = 'mantenimiento_proximo'; prioridad = 'info';
      titulo = 'Mantenimiento próximo';
      mensaje = `El mantenimiento de ${unidad} está programado en ${r.dias} día(s).`;
    }
    await notificarRoles(pool, {
      roles: ALL_ROLES, tipo, titulo, mensaje, prioridad,
      modulo: 'mantenimientos', entidadId: r.id, enlace: `/mantenimientos?dia=${r.fecha_programada}`,
      claveDedup: claveDedup(tipo, 'mantenimientos', r.id),
    });
  }
}

/** Vuelve a calcular todas las alertas por fecha. Segura de llamar en cada request (dedup por clave). */
async function sincronizarAlertas() {
  await Promise.all([sincronizarGarantias(), sincronizarLicencias(), sincronizarMantenimientos()]);
}

// El panel/contador se consultan con polling: no hace falta recalcular las alertas
// por fecha en CADA request (la clave_dedup ya evita duplicados, esto es solo para
// no repetir el trabajo de las consultas). Un proceso -> una variable en memoria basta.
let ultimaSincronizacion = 0;
const SINCRONIZAR_CADA_MS = 60_000;

async function sincronizarAlertasConThrottle() {
  const ahora = Date.now();
  if (ahora - ultimaSincronizacion < SINCRONIZAR_CADA_MS) return;
  ultimaSincronizacion = ahora;
  await sincronizarAlertas();
}

// ---------------------------------------------------------------------------
// Consulta y estado (leida/no leida) — siempre acotado al usuario que pregunta
// ---------------------------------------------------------------------------

async function findAll(usuarioId, { leida, page = 1, limit = 20 } = {}) {
  const where = ['usuario_id = :usuarioId'];
  const params = { usuarioId };
  if (leida !== undefined) { where.push('leida = :leida'); params.leida = leida ? 1 : 0; }

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM notificaciones WHERE ${where.join(' AND ')}`, params);
  const [rows] = await pool.query(
    `SELECT id, tipo, titulo, mensaje, prioridad, modulo, entidad_id, enlace, leida, fecha_leida, created_at
       FROM notificaciones WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );
  return { rows: rows.map((r) => ({ ...r, leida: !!r.leida })), total };
}

async function countNoLeidas(usuarioId) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM notificaciones WHERE usuario_id = :usuarioId AND leida = 0', { usuarioId });
  return Number(n);
}

/** Marca una notificacion como leida. Devuelve 0 filas afectadas si no era de ese usuario (nunca se filtra ese detalle al llamador). */
async function marcarLeida(id, usuarioId) {
  const [result] = await pool.query(
    "UPDATE notificaciones SET leida = 1, fecha_leida = NOW() WHERE id = :id AND usuario_id = :usuarioId AND leida = 0",
    { id, usuarioId }
  );
  return result.affectedRows;
}

async function marcarTodasLeidas(usuarioId) {
  const [result] = await pool.query(
    'UPDATE notificaciones SET leida = 1, fecha_leida = NOW() WHERE usuario_id = :usuarioId AND leida = 0',
    { usuarioId }
  );
  return result.affectedRows;
}

module.exports = {
  ALL_ROLES,
  STAFF_ROLES,
  claveDedup,
  notificarRoles,
  sincronizarAlertas,
  sincronizarAlertasConThrottle,
  findAll,
  countNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  getPreferencias,
  guardarPreferencias,
};
