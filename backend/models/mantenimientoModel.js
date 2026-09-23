const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/audit');
const notificacionModel = require('./notificacionModel');
const {
  RECURSOS, ESTADOS_ABIERTOS, MAX_COMPONENTES, formatFolio, hoyISO,
} = require('../utils/mantenimientos');

/**
 * Mantenimientos preventivos y correctivos del inventario.
 *
 *  - La unidad se resuelve con la vista `v_recursos_inventario` (las cuatro
 *    tablas del inventario en una sola forma), no con cuatro LEFT JOIN.
 *  - "Vencido" se CALCULA (programado + fecha pasada); nunca se guarda.
 *  - Nada se borra: cancelar y reprogramar son cambios de estado, y reprogramar
 *    crea una cita nueva ligada a la anterior (`reprogramado_de`).
 *  - Todas las acciones quedan en `audit_logs` (entity = 'mantenimiento').
 */

const ENTITY = 'mantenimiento';
const MAX_CALENDARIO = 500; // tope de una consulta por rango de fechas (un mes cabe de sobra)

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function fieldError(status, message, field) {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
}

async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// El estado que se muestra, calculado en SQL para poder filtrar y ordenar por el.
const ESTADO_EFECTIVO_SQL = `
  CASE WHEN m.estado = 'programado' AND m.fecha_programada < CURDATE()
       THEN 'vencido' ELSE m.estado END`;

const SELECT_FIELDS = `
  m.id, m.folio, m.tipo, m.tipo_recurso, m.recurso_id, m.estado,
  ${ESTADO_EFECTIVO_SQL} AS estado_efectivo,
  m.prioridad,
  DATE_FORMAT(m.fecha_programada, '%Y-%m-%d') AS fecha_programada,
  m.hora_programada, m.motivo,
  DATE_FORMAT(m.fecha_realizado, '%Y-%m-%d') AS fecha_realizado,
  m.trabajo_realizado, m.costo, m.proveedor,
  m.responsable_id, m.reprogramado_de, m.motivo_cancelacion, m.observaciones,
  m.created_at, m.updated_at,
  r.codigo_inventario, r.titulo AS recurso_titulo, r.tipo AS recurso_tipo, r.estado AS recurso_estado,
  resp.name AS responsable_nombre,
  autor.name AS creado_por_nombre`;

const FROM = `
  FROM mantenimientos m
  JOIN v_recursos_inventario r
    ON r.tipo_recurso = m.tipo_recurso AND r.item_id = m.recurso_id
  LEFT JOIN users resp  ON resp.id = m.responsable_id
  LEFT JOIN users autor ON autor.id = m.creado_por`;

/** Fila de la base -> objeto para el frontend (la unidad va anidada). */
function toDto(row) {
  const {
    codigo_inventario, recurso_titulo, recurso_tipo, recurso_estado, recurso_id, tipo_recurso,
    responsable_nombre, creado_por_nombre, costo, ...rest
  } = row;

  return {
    ...rest,
    tipo_recurso,
    costo: costo === null || costo === undefined ? null : Number(costo),
    responsable_nombre: responsable_nombre || null,
    creado_por_nombre: creado_por_nombre || null,
    recurso: {
      tipo_recurso,
      id: recurso_id,
      codigo_inventario,
      titulo: recurso_titulo,
      tipo: recurso_tipo,
      estado: recurso_estado,
      kind: RECURSOS[tipo_recurso].kind, // para armar el enlace en el frontend
    },
  };
}

function buildFilters({ desde, hasta, tipo, estado, prioridad, tipoRecurso, recursoId, search }) {
  const where = [];
  const params = {};

  if (desde) { where.push('m.fecha_programada >= :desde'); params.desde = desde; }
  if (hasta) { where.push('m.fecha_programada <= :hasta'); params.hasta = hasta; }
  if (tipo) { where.push('m.tipo = :tipo'); params.tipo = tipo; }
  if (prioridad) { where.push('m.prioridad = :prioridad'); params.prioridad = prioridad; }
  if (tipoRecurso) { where.push('m.tipo_recurso = :tipoRecurso'); params.tipoRecurso = tipoRecurso; }
  if (recursoId) { where.push('m.recurso_id = :recursoId'); params.recursoId = recursoId; }

  // 'vencido' no existe en la columna: se filtra por la expresion calculada.
  if (estado) { where.push(`${ESTADO_EFECTIVO_SQL} = :estado`); params.estado = estado; }

  if (search?.trim()) {
    const like = `%${escapeLike(search.trim())}%`;
    where.push(`(m.folio LIKE :search OR r.codigo_inventario LIKE :search
                 OR r.titulo LIKE :search OR m.motivo LIKE :search OR m.trabajo_realizado LIKE :search)`);
    params.search = like;
  }

  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

/**
 * Listado con filtros. Con `desde`/`hasta` (calendario) devuelve todo el rango
 * sin paginar (hasta MAX_CALENDARIO); si no, pagina.
 */
async function list(filters = {}) {
  const { clause, params } = buildFilters(filters);
  const paginar = !(filters.desde && filters.hasta);

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM} ${clause}`, params);

  const limit = paginar ? Math.min(Number(filters.limit) || 12, 100) : MAX_CALENDARIO;
  const page = paginar ? Math.max(1, Number(filters.page) || 1) : 1;

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM} ${clause}
      ORDER BY m.fecha_programada DESC, m.hora_programada IS NULL, m.hora_programada, m.id DESC
      LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );

  return {
    mantenimientos: rows.map(toDto),
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Tarjetas de resumen del modulo. */
async function stats() {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(estado = 'programado' AND fecha_programada >= CURDATE()), 0) AS programados,
       COALESCE(SUM(estado = 'programado' AND fecha_programada <  CURDATE()), 0) AS vencidos,
       COALESCE(SUM(estado = 'en_proceso'), 0)                                   AS en_proceso,
       COALESCE(SUM(estado = 'programado'
                    AND fecha_programada BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY), 0) AS proximos_7,
       COALESCE(SUM(estado = 'realizado'
                    AND fecha_realizado >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND fecha_realizado <  DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH), 0) AS realizados_mes,
       COALESCE(SUM(tipo = 'preventivo'), 0) AS preventivos,
       COALESCE(SUM(tipo = 'correctivo'), 0) AS correctivos,
       COUNT(*) AS total
     FROM mantenimientos`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function getComponentes(db, mantenimientoId) {
  const [rows] = await db.query(
    `SELECT id, accion, componente, detalle, numero_serie, costo, orden
       FROM mantenimientos_componentes
      WHERE mantenimiento_id = :id
      ORDER BY orden, id`,
    { id: mantenimientoId }
  );
  return rows.map((r) => ({ ...r, costo: r.costo === null ? null : Number(r.costo) }));
}

/** Un mantenimiento con sus componentes y las citas de las que viene / a las que se movio. */
async function findById(id) {
  const [[row]] = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM} WHERE m.id = :id`, { id });
  if (!row) throw new AppError('El mantenimiento no existe.', 404);

  const dto = toDto(row);
  dto.componentes = await getComponentes(pool, id);

  // Cita anterior (de donde se reprogramo) y siguiente (a donde se movio).
  const CITA = "SELECT id, folio, DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada FROM mantenimientos";
  const [[anterior]] = await pool.query(`${CITA} WHERE id = :id`, { id: row.reprogramado_de ?? 0 });
  const [[siguiente]] = await pool.query(`${CITA} WHERE reprogramado_de = :id ORDER BY id LIMIT 1`, { id });
  dto.reprogramado_desde = anterior || null;
  dto.reprogramado_hacia = siguiente || null;
  return dto;
}

/** Verifica que la unidad exista (mensaje claro en vez de un error de clave foranea). */
async function requireRecurso(conn, tipoRecurso, recursoId) {
  const cfg = RECURSOS[tipoRecurso];
  if (!cfg) throw fieldError(400, 'Tipo de unidad inválido.', 'tipo_recurso');

  const [[item]] = await conn.query(
    `SELECT id, codigo_inventario, estado FROM ${cfg.table} WHERE id = :id`,
    { id: recursoId }
  );
  if (!item) throw fieldError(404, `${cfg.articulo} seleccionad${cfg.tipo === 'IMPRESORA' ? 'a' : 'o'} no existe.`, 'recurso_id');
  if (item.estado === 'baja') {
    throw fieldError(409, `${cfg.articulo} ${item.codigo_inventario} está dado de baja: no se le puede agendar mantenimiento.`, 'recurso_id');
  }
  return item;
}

/**
 * Siguiente folio del anio. Se lee el maximo SIN bloquear (bloquear el rango de
 * un agregado provoca interbloqueos entre dos altas simultaneas): quien decide es
 * la restriccion UNIQUE (anio, consecutivo) y, si dos coinciden, `withFolioRetry`
 * vuelve a intentarlo con el numero siguiente.
 */
async function nextFolio(conn) {
  const anio = new Date().getFullYear();
  const [[{ n }]] = await conn.query(
    'SELECT COALESCE(MAX(consecutivo), 0) + 1 AS n FROM mantenimientos WHERE anio = :anio',
    { anio }
  );
  return { anio, consecutivo: n, folio: formatFolio(anio, n) };
}

/** Reintenta cuando dos peticiones simultaneas chocaron en el folio o se interbloquearon. */
async function withFolioRetry(fn) {
  const MAX_INTENTOS = 5;
  for (let intento = 1; ; intento++) {
    try {
      return await fn();
    } catch (err) {
      const choqueFolio = err.code === 'ER_DUP_ENTRY' && /uq_mant_(folio|consecutivo)/.test(err.sqlMessage || '');
      const interbloqueo = err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT';
      if ((!choqueFolio && !interbloqueo) || intento >= MAX_INTENTOS) throw err;
      await new Promise((r) => setTimeout(r, 15 * intento));
    }
  }
}

const insertComponentes = async (conn, mantenimientoId, componentes = []) => {
  for (const [i, c] of componentes.entries()) {
    await conn.query(
      `INSERT INTO mantenimientos_componentes
         (mantenimiento_id, accion, componente, detalle, numero_serie, costo, orden)
       VALUES (:id, :accion, :componente, :detalle, :serie, :costo, :orden)`,
      {
        id: mantenimientoId,
        accion: c.accion,
        componente: c.componente.trim(),
        detalle: c.detalle?.trim() || null,
        serie: c.numero_serie?.trim() || null,
        costo: c.costo ?? null,
        orden: i,
      }
    );
  }
};

/** Agenda un mantenimiento. */
async function create(data, userId, ip) {
  const id = await withFolioRetry(() =>
    withTransaction(async (conn) => {
      const item = await requireRecurso(conn, data.tipo_recurso, data.recurso_id);
      const { anio, consecutivo, folio } = await nextFolio(conn);
      const cfg = RECURSOS[data.tipo_recurso];

      const [result] = await conn.query(
        `INSERT INTO mantenimientos
           (folio, anio, consecutivo, tipo, tipo_recurso, ${cfg.col}, prioridad,
            fecha_programada, hora_programada, motivo, responsable_id, observaciones,
            creado_por, actualizado_por)
         VALUES (:folio, :anio, :consecutivo, :tipo, :tipoRecurso, :recursoId, :prioridad,
                 :fecha, :hora, :motivo, :responsable, :observaciones, :userId, :userId)`,
        {
          folio, anio, consecutivo,
          tipo: data.tipo,
          tipoRecurso: data.tipo_recurso,
          recursoId: data.recurso_id,
          prioridad: data.prioridad || 'media',
          fecha: data.fecha_programada,
          hora: data.hora_programada || null,
          motivo: data.motivo?.trim() || null,
          responsable: data.responsable_id ?? null,
          observaciones: data.observaciones?.trim() || null,
          userId,
        }
      );

      await logAudit(conn, {
        userId, ip, action: 'agendado', entity: ENTITY, entityId: result.insertId,
        details: { folio, tipo: data.tipo, unidad: item.codigo_inventario, fecha: data.fecha_programada },
      });

      await notificacionModel.notificarRoles(conn, {
        roles: notificacionModel.ALL_ROLES, tipo: 'mantenimiento_registrado', prioridad: 'info',
        titulo: 'Mantenimiento agendado',
        mensaje: `Se agendó un mantenimiento ${data.tipo} para ${item.codigo_inventario} el ${data.fecha_programada}.`,
        modulo: 'mantenimientos', entidadId: result.insertId, enlace: `/mantenimientos?dia=${data.fecha_programada}`,
        claveDedup: notificacionModel.claveDedup('mantenimiento_registrado', 'mantenimientos', result.insertId),
      });

      return result.insertId;
    })
  );

  return findById(id);
}

/** Datos de planeacion (fecha, tipo, prioridad, motivo...). Solo mientras siga abierto. */
async function update(id, data, userId, ip) {
  await withTransaction(async (conn) => {
    const [[actual]] = await conn.query(
      `SELECT id, folio, estado, tipo_recurso, recurso_id,
              DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada
         FROM mantenimientos WHERE id = :id FOR UPDATE`,
      { id }
    );
    if (!actual) throw new AppError('El mantenimiento no existe.', 404);
    if (!ESTADOS_ABIERTOS.includes(actual.estado)) {
      throw new AppError(
        actual.estado === 'realizado'
          ? 'Este mantenimiento ya se realizó. Puedes corregir lo que se hizo, pero no reprogramarlo desde aquí.'
          : `Un mantenimiento ${actual.estado === 'cancelado' ? 'cancelado' : 'reprogramado'} no se puede editar.`,
        409
      );
    }

    // Cambiar de unidad: se limpian las cuatro columnas y se escribe la que toca.
    const cambiaUnidad = data.tipo_recurso && data.recurso_id
      && (data.tipo_recurso !== actual.tipo_recurso || Number(data.recurso_id) !== actual.recurso_id);
    if (cambiaUnidad) await requireRecurso(conn, data.tipo_recurso, data.recurso_id);

    const cfg = cambiaUnidad ? RECURSOS[data.tipo_recurso] : null;
    const unidadSql = cambiaUnidad
      ? `, tipo_recurso = :tipoRecurso, equipo_id = NULL, accesorio_id = NULL, impresora_id = NULL,
           celular_id = NULL, ${cfg.col} = :recursoId`
      : '';

    await conn.query(
      `UPDATE mantenimientos
          SET tipo = :tipo, prioridad = :prioridad, fecha_programada = :fecha,
              hora_programada = :hora, motivo = :motivo, responsable_id = :responsable,
              observaciones = :observaciones, actualizado_por = :userId ${unidadSql}
        WHERE id = :id`,
      {
        id,
        tipo: data.tipo,
        prioridad: data.prioridad || 'media',
        fecha: data.fecha_programada,
        hora: data.hora_programada || null,
        motivo: data.motivo?.trim() || null,
        responsable: data.responsable_id ?? null,
        observaciones: data.observaciones?.trim() || null,
        userId,
        ...(cambiaUnidad ? { tipoRecurso: data.tipo_recurso, recursoId: data.recurso_id } : {}),
      }
    );

    await logAudit(conn, {
      userId, ip, action: 'editado', entity: ENTITY, entityId: id,
      details: {
        folio: actual.folio,
        ...(actual.fecha_programada !== data.fecha_programada
          ? { fecha_anterior: actual.fecha_programada, fecha_nueva: data.fecha_programada }
          : {}),
      },
    });
  });

  return findById(id);
}

/** Marca el mantenimiento como en proceso (se empezo a atender). */
async function iniciar(id, userId, ip) {
  await withTransaction(async (conn) => {
    const [[actual]] = await conn.query(
      'SELECT id, folio, estado FROM mantenimientos WHERE id = :id FOR UPDATE', { id }
    );
    if (!actual) throw new AppError('El mantenimiento no existe.', 404);
    if (actual.estado === 'en_proceso') throw new AppError('Este mantenimiento ya está en proceso.', 409);
    if (actual.estado !== 'programado') throw new AppError('Solo un mantenimiento programado puede pasar a en proceso.', 409);

    await conn.query(
      "UPDATE mantenimientos SET estado = 'en_proceso', actualizado_por = :userId WHERE id = :id",
      { id, userId }
    );
    await logAudit(conn, { userId, ip, action: 'iniciado', entity: ENTITY, entityId: id, details: { folio: actual.folio } });
  });
  return findById(id);
}

/**
 * Registra lo que se hizo (o lo corrige, si ya estaba realizado).
 * `componentes` reemplaza por completo la lista anterior.
 */
async function realizar(id, data, userId, ip) {
  await withTransaction(async (conn) => {
    const [[actual]] = await conn.query(
      `SELECT id, folio, estado, DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada
         FROM mantenimientos WHERE id = :id FOR UPDATE`, { id }
    );
    if (!actual) throw new AppError('El mantenimiento no existe.', 404);

    const correccion = actual.estado === 'realizado';
    if (!correccion && !ESTADOS_ABIERTOS.includes(actual.estado)) {
      throw new AppError(
        `Un mantenimiento ${actual.estado === 'cancelado' ? 'cancelado' : 'reprogramado'} no se puede cerrar.`,
        409
      );
    }
    if ((data.componentes?.length || 0) > MAX_COMPONENTES) {
      throw fieldError(400, `Máximo ${MAX_COMPONENTES} componentes por mantenimiento.`, 'componentes');
    }

    await conn.query(
      `UPDATE mantenimientos
          SET estado = 'realizado', fecha_realizado = :fechaRealizado,
              trabajo_realizado = :trabajo, costo = :costo, proveedor = :proveedor,
              responsable_id = COALESCE(:responsable, responsable_id),
              actualizado_por = :userId
        WHERE id = :id`,
      {
        id,
        fechaRealizado: data.fecha_realizado || hoyISO(),
        trabajo: data.trabajo_realizado.trim(),
        costo: data.costo ?? null,
        proveedor: data.proveedor?.trim() || null,
        responsable: data.responsable_id ?? null,
        userId,
      }
    );

    await conn.query('DELETE FROM mantenimientos_componentes WHERE mantenimiento_id = :id', { id });
    await insertComponentes(conn, id, data.componentes || []);

    await logAudit(conn, {
      userId, ip, action: correccion ? 'trabajo_corregido' : 'realizado', entity: ENTITY, entityId: id,
      details: {
        folio: actual.folio,
        fecha_realizado: data.fecha_realizado || hoyISO(),
        componentes: (data.componentes || []).map((c) => `${c.accion}: ${c.componente}`),
      },
    });

    if (!correccion) {
      await notificacionModel.notificarRoles(conn, {
        roles: notificacionModel.ALL_ROLES, tipo: 'mantenimiento_completado', prioridad: 'info',
        titulo: 'Mantenimiento completado',
        mensaje: `Se completó el mantenimiento ${actual.folio}.`,
        modulo: 'mantenimientos', entidadId: id, enlace: `/mantenimientos?dia=${actual.fecha_programada}`,
        claveDedup: notificacionModel.claveDedup('mantenimiento_completado', 'mantenimientos', id),
      });
    }
  });
  return findById(id);
}

/**
 * Mueve el mantenimiento a otra fecha: la cita actual queda 'reprogramado'
 * (con su fecha original intacta) y se crea una nueva ligada a ella.
 * Devuelve la NUEVA cita.
 */
async function reprogramar(id, data, userId, ip) {
  const nuevoId = await withFolioRetry(() =>
    withTransaction(async (conn) => {
      const [[actual]] = await conn.query(
        `SELECT id, folio, estado, tipo, tipo_recurso, recurso_id, prioridad, motivo,
                hora_programada, responsable_id, observaciones,
                DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada
           FROM mantenimientos WHERE id = :id FOR UPDATE`,
        { id }
      );
      if (!actual) throw new AppError('El mantenimiento no existe.', 404);
      if (!ESTADOS_ABIERTOS.includes(actual.estado)) {
        throw new AppError(
          actual.estado === 'realizado'
            ? 'Este mantenimiento ya se realizó: no se puede reprogramar.'
            : `Este mantenimiento ya está ${actual.estado === 'cancelado' ? 'cancelado' : 'reprogramado'}.`,
          409
        );
      }
      if (data.fecha_programada === actual.fecha_programada) {
        throw fieldError(400, 'La fecha nueva debe ser distinta de la actual.', 'fecha_programada');
      }

      const { anio, consecutivo, folio } = await nextFolio(conn);
      const cfg = RECURSOS[actual.tipo_recurso];

      const [result] = await conn.query(
        `INSERT INTO mantenimientos
           (folio, anio, consecutivo, tipo, tipo_recurso, ${cfg.col}, prioridad,
            fecha_programada, hora_programada, motivo, responsable_id, observaciones,
            reprogramado_de, creado_por, actualizado_por)
         VALUES (:folio, :anio, :consecutivo, :tipo, :tipoRecurso, :recursoId, :prioridad,
                 :fecha, :hora, :motivo, :responsable, :observaciones,
                 :origen, :userId, :userId)`,
        {
          folio, anio, consecutivo,
          tipo: actual.tipo,
          tipoRecurso: actual.tipo_recurso,
          recursoId: actual.recurso_id,
          prioridad: actual.prioridad,
          fecha: data.fecha_programada,
          hora: data.hora_programada ?? actual.hora_programada,
          motivo: actual.motivo,
          responsable: actual.responsable_id,
          observaciones: actual.observaciones,
          origen: id,
          userId,
        }
      );

      await conn.query(
        `UPDATE mantenimientos
            SET estado = 'reprogramado',
                observaciones = TRIM(CONCAT_WS(CHAR(10), observaciones, :nota)),
                actualizado_por = :userId
          WHERE id = :id`,
        {
          id,
          userId,
          nota: `[${hoyISO()}] Reprogramado a ${data.fecha_programada}${data.motivo ? `: ${data.motivo.trim()}` : ''}`,
        }
      );

      await logAudit(conn, {
        userId, ip, action: 'reprogramado', entity: ENTITY, entityId: id,
        details: {
          folio: actual.folio, folio_nuevo: folio,
          fecha_anterior: actual.fecha_programada, fecha_nueva: data.fecha_programada,
          motivo: data.motivo?.trim() || null,
        },
      });
      return result.insertId;
    })
  );

  return findById(nuevoId);
}

/** Cancela el mantenimiento (no se borra: queda el registro y el motivo). */
async function cancelar(id, motivo, userId, ip) {
  await withTransaction(async (conn) => {
    const [[actual]] = await conn.query(
      'SELECT id, folio, estado FROM mantenimientos WHERE id = :id FOR UPDATE', { id }
    );
    if (!actual) throw new AppError('El mantenimiento no existe.', 404);
    if (actual.estado === 'cancelado') throw new AppError('Este mantenimiento ya está cancelado.', 409);
    if (actual.estado === 'realizado') throw new AppError('Un mantenimiento ya realizado no se puede cancelar.', 409);

    await conn.query(
      `UPDATE mantenimientos
          SET estado = 'cancelado', motivo_cancelacion = :motivo, actualizado_por = :userId
        WHERE id = :id`,
      { id, motivo: motivo.trim(), userId }
    );
    await logAudit(conn, {
      userId, ip, action: 'cancelado', entity: ENTITY, entityId: id,
      details: { folio: actual.folio, motivo: motivo.trim() },
    });
  });
  return findById(id);
}

/** Historial de la cita (audit_logs). */
async function historial(id) {
  const [[existe]] = await pool.query('SELECT id FROM mantenimientos WHERE id = :id', { id });
  if (!existe) throw new AppError('El mantenimiento no existe.', 404);

  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS usuario
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
      WHERE a.entity = :entity AND a.entity_id = :id
      ORDER BY a.id DESC`,
    { entity: ENTITY, id: String(id) }
  );
  return rows;
}

module.exports = {
  list, stats, findById, create, update, iniciar, realizar, reprogramar, cancelar, historial,
};
