const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const asignacionModel = require('./asignacionModel');
const { logAudit } = require('../utils/audit');
const notificacionModel = require('./notificacionModel');
const { cifrar, descifrar } = require('../utils/cripto');
const { KINDS, formatCodigo, localDateString } = require('../utils/inventario');

/**
 * Modelo generico de inventario: se instancia UNA vez por tipo
 * (equipoModel / accesorioModel / impresoraModel / celularModel) a partir de la
 * config de utils/inventario.js. `tipoTable` es opcional (los celulares no tienen
 * catalogo de tipos) y `ubicacion` agrega la ubicacion fisica (impresoras).
 * Todo el filtrado, la busqueda y el conteo ocurren en SQL.
 *
 * El "colaborador actual" NUNCA se guarda en la tabla del item: se obtiene de
 * la asignacion vigente (asignaciones_*.fecha_devolucion IS NULL).
 */

const HOLDER_FIELDS = `
  a.id AS asignacion_id, a.colaborador_id, a.fecha_asignacion,
  c.id_empleado AS colaborador_id_empleado,
  CONCAT_WS(' ', c.nombre, c.apellido_paterno, c.apellido_materno) AS colaborador_nombre`;

// Escapa % _ \ para que el texto del usuario se busque literalmente en LIKE.
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function createInventarioModel(cfg) {
  const hasTipo = !!cfg.tipoTable;

  const FROM = `
    FROM ${cfg.table} i
    ${hasTipo ? `JOIN ${cfg.tipoTable} t ON t.id = i.${cfg.tipoFk}` : ''}
    ${cfg.ubicacion ? 'LEFT JOIN ubicaciones ub ON ub.id = i.ubicacion_id' : ''}
    LEFT JOIN ${cfg.asigTable} a ON a.${cfg.vigenteCol} = i.id
    LEFT JOIN colaboradores c ON c.id = a.colaborador_id`;

  // Sin catalogo de tipos, el tipo es fijo (cfg.tipoFixed, solo viene de la config).
  const TIPO_FIELDS = hasTipo
    ? `i.${cfg.tipoFk} AS tipo_id, t.nombre AS tipo`
    : `NULL AS tipo_id, '${cfg.tipoFixed}' AS tipo`;

  const LIST_FIELDS = `
    i.id, i.codigo_inventario, ${TIPO_FIELDS},
    i.marca, i.modelo, ${cfg.titulo} AS titulo, i.numero_serie, i.estado, i.imagen,
    ${cfg.ubicacion ? 'ub.nombre AS ubicacion,' : ''}
    ${cfg.withPassword ? '(i.password_cifrado IS NOT NULL) AS tiene_password,' : ''}
    ${HOLDER_FIELDS}`;

  // Detalle: lo del listado + el resto de columnas (fechas DATE como 'YYYY-MM-DD').
  const alreadyListed = new Set(['marca', 'modelo', 'numero_serie']);
  const detailExtra = [...cfg.editable, 'fecha_baja']
    .filter((f) => f !== cfg.tipoFk && !alreadyListed.has(f))
    .map((f) => (cfg.dateFields.includes(f) ? `DATE_FORMAT(i.${f}, '%Y-%m-%d') AS ${f}` : `i.${f}`));
  const DETAIL_FIELDS = `${LIST_FIELDS}, ${detailExtra.join(', ')}, i.created_at, i.updated_at`;

  // Los booleanos (TINYINT) llegan como 0/1: se devuelven como true/false.
  const withBooleans = (item) => {
    for (const f of cfg.boolFields) item[f] = !!item[f];
    if (cfg.withPassword) item.tiene_password = !!item.tiene_password;
    return item;
  };

  function buildFilters({ search, tipo, estados, colaboradorId, asignacion, marca, ubicacionId }) {
    const where = [];
    const params = {};

    // Cada palabra debe aparecer en alguno de los campos (AND entre palabras).
    const tokens = (search || '').split(/\s+/).filter(Boolean).slice(0, 5);
    tokens.forEach((token, i) => {
      const key = `s${i}`;
      where.push(`(${cfg.searchCols.map((col) => `${col} LIKE :${key}`).join(' OR ')})`);
      params[key] = `%${escapeLike(token)}%`;
    });

    if (tipo && hasTipo) {
      where.push('t.nombre = :tipo');
      params.tipo = tipo;
    }
    if (ubicacionId && cfg.ubicacion) {
      where.push('i.ubicacion_id = :ubicacionId');
      params.ubicacionId = ubicacionId;
    }
    if (estados?.length) {
      where.push('i.estado IN (:estados)');
      params.estados = estados;
    }
    if (colaboradorId) {
      where.push('a.colaborador_id = :colaboradorId');
      params.colaboradorId = colaboradorId;
    }
    if (marca) {
      where.push('i.marca = :marca');
      params.marca = marca;
    }
    if (asignacion === 'con') where.push('a.id IS NOT NULL');
    if (asignacion === 'sin') where.push('a.id IS NULL');

    return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
  }

  async function findAll(filters, { page, limit }) {
    const { whereSql, params } = buildFilters(filters);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT ${LIST_FIELDS} ${FROM} ${whereSql}
       ORDER BY i.codigo_inventario, i.id
       LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset: (page - 1) * limit }
    );
    return { rows, total };
  }

  async function findById(id) {
    const [rows] = await pool.query(`SELECT ${DETAIL_FIELDS} ${FROM} WHERE i.id = :id LIMIT 1`, { id });
    if (!rows[0]) return null;
    const item = withBooleans(rows[0]);

    // Asignacion vigente con los datos que muestra el detalle.
    const [[actual]] = await pool.query(
      `SELECT a.id, a.colaborador_id, a.fecha_asignacion, a.observaciones_asignacion,
              c.id_empleado, c.fotografia,
              CONCAT_WS(' ', c.nombre, c.apellido_paterno, c.apellido_materno) AS nombre_completo,
              ar.nombre AS area, u.name AS asignado_por
       FROM ${cfg.asigTable} a
       JOIN colaboradores c ON c.id = a.colaborador_id
       JOIN areas ar        ON ar.id = c.area_id
       LEFT JOIN users u    ON u.id = a.asignado_por
       WHERE a.${cfg.vigenteCol} = :id`,
      { id }
    );
    return { ...item, asignacion_actual: actual || null };
  }

  async function getStats() {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(estado = 'disponible'), 0)    AS disponible,
              COALESCE(SUM(estado = 'asignado'), 0)      AS asignado,
              COALESCE(SUM(estado = 'mantenimiento'), 0) AS mantenimiento,
              COALESCE(SUM(estado = 'reparacion'), 0)    AS reparacion,
              COALESCE(SUM(estado = 'baja'), 0)          AS baja,
              COALESCE(SUM(estado = 'perdido'), 0)       AS perdido
       FROM ${cfg.table}`
    );
    // SUM() llega como string (DECIMAL) desde mysql2.
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
  }

  async function findMarcas() {
    const [rows] = await pool.query(
      `SELECT DISTINCT marca FROM ${cfg.table} WHERE marca IS NOT NULL AND marca <> '' ORDER BY marca`
    );
    return rows.map((r) => r.marca);
  }

  // ---- Escritura ----

  function editableParams(data) {
    const params = {};
    for (const key of cfg.editable) {
      const value = data[key] ?? null;
      params[key] = cfg.jsonFields.includes(key) && value !== null ? JSON.stringify(value) : value;
    }
    return params;
  }

  async function nextNumber(conn) {
    const [[{ n }]] = await conn.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_inventario, ${cfg.prefix.length + 2}) AS UNSIGNED)), 0) + 1 AS n
       FROM ${cfg.table} WHERE codigo_inventario REGEXP '^${cfg.prefix}-[0-9]+$'`
    );
    return Number(n);
  }

  async function insertRow(conn, codigo, data) {
    const params = { ...editableParams(data), codigo };
    const cols = ['codigo_inventario', ...cfg.editable];
    // La contrasena vive fuera de cfg.editable: hay que cifrarla, nunca se guarda en claro.
    if (cfg.withPassword && data.password_equipo) {
      cols.push('password_cifrado');
      params.password_cifrado = cifrar(data.password_equipo);
    }
    const [result] = await conn.query(
      `INSERT INTO ${cfg.table} (${cols.join(', ')})
       VALUES (${cols.map((c) => `:${c === 'codigo_inventario' ? 'codigo' : c}`).join(', ')})`,
      params
    );
    return result.insertId;
  }

  /** Cambia (o quita) el responsable actual creando/cerrando asignaciones. */
  async function syncHolder(conn, itemId, colaboradorId, { fecha, userId, ip }) {
    const actual = await asignacionModel.findActiveTx(conn, cfg.kind, itemId);
    if (actual && actual.colaborador_id === colaboradorId) return; // sin cambios
    if (!actual && colaboradorId == null) return;

    if (actual) {
      await asignacionModel.returnTx(conn, cfg.kind, actual.id, {
        condicion: null, // cambio de responsable: no se evalua el estado fisico
        observaciones: `Cambio de responsable desde la edición ${cfg.del} ${cfg.label}.`,
        nuevoEstado: 'disponible',
        userId,
        ip,
      });
    }
    if (colaboradorId != null) {
      await asignacionModel.assignTx(conn, cfg.kind, { itemId, colaboradorId, fecha, userId, ip });
    }
  }

  /**
   * Crea un item. `codigo_inventario` opcional: si falta se genera (EQ-00025).
   * Si trae `colaborador_id`, se crea tambien su asignacion (estado ASIGNADO).
   */
  async function create(data, { userId, ip } = {}) {
    const id = await asignacionModel.withTransaction(async (conn) => {
      let itemId;
      let codigoFinal;
      if (data.codigo_inventario) {
        codigoFinal = data.codigo_inventario;
        itemId = await insertRow(conn, codigoFinal, data);
      } else {
        // Generado a partir del mayor consecutivo; el UNIQUE evita colisiones (1 reintento por carrera).
        for (let attempt = 0; ; attempt++) {
          try {
            codigoFinal = formatCodigo(cfg.prefix, await nextNumber(conn));
            itemId = await insertRow(conn, codigoFinal, data);
            break;
          } catch (err) {
            const isCodeClash = err.code === 'ER_DUP_ENTRY' && err.sqlMessage?.includes('codigo');
            if (!isCodeClash || attempt >= 3) throw err;
          }
        }
      }

      await logAudit(conn, {
        userId, ip, action: 'creado', entity: cfg.label, entityId: itemId,
        details: { codigo_inventario: codigoFinal, marca: data.marca, modelo: data.modelo },
      });

      // "Nuevos equipos registrados" es, literalmente, solo de equipos (no accesorios/impresoras/celulares).
      if (cfg.kind === 'equipos') {
        const desc = [data.marca, data.modelo].filter(Boolean).join(' ');
        await notificacionModel.notificarRoles(conn, {
          roles: notificacionModel.ALL_ROLES, tipo: 'equipo_nuevo', prioridad: 'info',
          titulo: 'Nuevo equipo registrado',
          mensaje: `Se registró el equipo ${codigoFinal}${desc ? ` (${desc})` : ''}.`,
          modulo: 'equipos', entidadId: itemId, enlace: `/equipos/${itemId}`,
          claveDedup: notificacionModel.claveDedup('equipo_nuevo', 'equipos', itemId),
        });
      }

      if (data.colaborador_id) {
        await asignacionModel.assignTx(conn, cfg.kind, {
          itemId,
          colaboradorId: data.colaborador_id,
          fecha: data.fecha_asignacion,
          observaciones: data.observaciones_asignacion,
          userId,
          ip,
        });
      }
      return itemId;
    });
    return findById(id);
  }

  /**
   * Edita los datos del item. Si `colaborador_id` viene en el body (null = sin
   * asignar) tambien se sincroniza el responsable mediante asignaciones.
   */
  async function update(id, data, { userId, ip } = {}) {
    await asignacionModel.withTransaction(async (conn) => {
      const [[item]] = await conn.query(`SELECT id, codigo_inventario FROM ${cfg.table} WHERE id = :id FOR UPDATE`, { id });
      if (!item) throw new AppError(`${cfg.Label} no encontrad${cfg.o}.`, 404);

      const sets = cfg.editable.map((f) => `${f} = :${f}`);
      const params = { ...editableParams(data), id };
      if (data.codigo_inventario) {
        sets.push('codigo_inventario = :codigo');
        params.codigo = data.codigo_inventario;
      }
      // undefined = no tocar la contrasena guardada; '' = borrarla; string = cifrarla y guardarla.
      if (cfg.withPassword && data.password_equipo !== undefined) {
        sets.push('password_cifrado = :password_cifrado');
        params.password_cifrado = data.password_equipo ? cifrar(data.password_equipo) : null;
      }
      await conn.query(`UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = :id`, params);

      await logAudit(conn, {
        userId, ip, action: 'editado', entity: cfg.label, entityId: id,
        details: { codigo_inventario: data.codigo_inventario || item.codigo_inventario },
      });

      if (data.colaborador_id !== undefined) {
        await syncHolder(conn, id, data.colaborador_id, { fecha: data.fecha_asignacion, userId, ip });
      }
    });
    return findById(id);
  }

  /** Cambio manual de estado (mantenimiento, reparacion, baja, perdido, disponible). */
  async function setEstado(id, estado, observaciones, { userId, ip } = {}) {
    await asignacionModel.withTransaction(async (conn) => {
      const [[item]] = await conn.query(`SELECT id, codigo_inventario, estado FROM ${cfg.table} WHERE id = :id FOR UPDATE`, { id });
      if (!item) throw new AppError(`${cfg.Label} no encontrad${cfg.o}.`, 404);
      if (item.estado === 'asignado') {
        throw new AppError(
          `${cfg.Art} ${cfg.label} está asignad${cfg.o}. Regístral${cfg.o} como devuelt${cfg.o} antes de cambiar su estado.`,
          409
        );
      }

      const today = localDateString();
      await conn.query(
        `UPDATE ${cfg.table}
            SET estado = :estado,
                fecha_baja = IF(:estado = 'baja', COALESCE(fecha_baja, :today), NULL),
                observaciones = IF(:nota IS NULL, observaciones, CONCAT_WS('\\n', observaciones, :nota))
          WHERE id = :id`,
        {
          id,
          estado,
          today,
          nota: observaciones ? `[${today}] Estado → ${estado}: ${observaciones}` : null,
        }
      );

      await logAudit(conn, {
        userId, ip, action: estado === 'baja' ? 'baja' : 'estado_cambiado', entity: cfg.label, entityId: id,
        details: { codigo_inventario: item.codigo_inventario, estado_anterior: item.estado, estado_nuevo: estado },
      });

      // "Cambios importantes en el inventario": se acota a la baja (lo demas ya tiene su propia notificacion).
      if (estado === 'baja') {
        await notificacionModel.notificarRoles(conn, {
          roles: notificacionModel.ALL_ROLES, tipo: 'inventario_baja', prioridad: 'advertencia',
          titulo: `${cfg.Label} dado de baja`,
          mensaje: `${cfg.Art} ${cfg.label} ${item.codigo_inventario} fue dado de baja.`,
          modulo: cfg.kind, entidadId: id, enlace: `/${cfg.kind}/${id}`,
          claveDedup: notificacionModel.claveDedup('inventario_baja', cfg.kind, id),
        });
      }
    });
    return findById(id);
  }

  async function setImagen(id, imagen) {
    await pool.query(`UPDATE ${cfg.table} SET imagen = :imagen WHERE id = :id`, { id, imagen });
  }

  /** Todas las asignaciones del item (vigente + devueltas), la mas reciente primero. */
  async function findHistorial(id) {
    const [rows] = await pool.query(
      `SELECT a.id AS asignacion_id, a.colaborador_id, c.id_empleado,
              CONCAT_WS(' ', c.nombre, c.apellido_paterno, c.apellido_materno) AS colaborador_nombre,
              a.fecha_asignacion, a.fecha_devolucion, a.estado, a.condicion_devolucion,
              a.observaciones_asignacion, a.observaciones_devolucion,
              ua.name AS asignado_por, ur.name AS recibido_por
       FROM ${cfg.asigTable} a
       JOIN colaboradores c ON c.id = a.colaborador_id
       LEFT JOIN users ua   ON ua.id = a.asignado_por
       LEFT JOIN users ur   ON ur.id = a.recibido_por
       WHERE a.${cfg.asigFk} = :id
       ORDER BY a.fecha_asignacion DESC, a.id DESC`,
      { id }
    );
    return rows;
  }

  /** Descifra y devuelve la contrasena del equipo. Requiere permiso (ruta) y deja auditoria (aqui). */
  async function revelarPassword(id, userId, ip) {
    const [[row]] = await pool.query(`SELECT codigo_inventario, password_cifrado FROM ${cfg.table} WHERE id = :id`, { id });
    if (!row) throw new AppError(`${cfg.Label} no encontrad${cfg.o}.`, 404);
    if (!row.password_cifrado) throw new AppError(`${cfg.Art} ${cfg.label} no tiene una contraseña registrada.`, 404);

    const password = descifrar(row.password_cifrado);
    await logAudit(null, { userId, ip, action: 'password_consultada', entity: cfg.label, entityId: id, details: { codigo_inventario: row.codigo_inventario } });
    return password;
  }

  const model = { findAll, findById, getStats, findMarcas, create, update, setEstado, setImagen, findHistorial };
  if (cfg.withPassword) model.revelarPassword = revelarPassword;
  return model;
}

module.exports = {
  equipoModel: createInventarioModel(KINDS.equipos),
  accesorioModel: createInventarioModel(KINDS.accesorios),
  impresoraModel: createInventarioModel(KINDS.impresoras),
  celularModel: createInventarioModel(KINDS.celulares),
};
