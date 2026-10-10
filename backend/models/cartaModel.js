const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { withTransaction } = require('./asignacionModel');
const inventario = require('./inventarioModel');
const colaboradorModel = require('./colaboradorModel');
const empresaModel = require('./empresaModel');
const { KINDS, localDateString } = require('../utils/inventario');
const {
  RECURSOS, derivePlantilla, camposRecurso, snapshotRecurso,
} = require('../utils/cartas');
const { logAudit } = require('../utils/audit');
const { renderCartaPdf, logoDataUrl } = require('../utils/cartaPdf');
const { documentUploads } = require('../middleware/uploadMiddleware');

/**
 * Cartas responsivas. Ciclo de vida:
 *   borrador -> generada -> pendiente_firma -> firmada        (cancelada desde cualquier estado)
 *
 *  - BORRADOR: editable; el PDF de vista previa se arma con los datos VIVOS de la base.
 *  - GENERADA: se congelan colaborador, empresa y recursos (snapshots) y se guarda el PDF.
 *              Desde ahi el contenido ya no cambia (para corregir: cancelar y crear otra).
 *  - PENDIENTE_FIRMA: automatico en la primera descarga del PDF.
 *  - FIRMADA: se subio el documento firmado (versionado; reemplazar no borra el anterior).
 * Toda accion queda en audit_logs (entity = 'carta_responsiva').
 */

const ENTITY = 'carta_responsiva';
const MAX_RECURSOS = 20;
const INV = {
  EQUIPO: inventario.equipoModel,
  ACCESORIO: inventario.accesorioModel,
  IMPRESORA: inventario.impresoraModel,
  CELULAR: inventario.celularModel,
};

const fieldError = (status, message, field) => {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
};

// Columnas de la carta (fechas DATE como 'YYYY-MM-DD').
const CARTA_COLS = `
  c.id, c.folio, c.anio, c.consecutivo, c.colaborador_id, c.plantilla, c.estado,
  DATE_FORMAT(c.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
  DATE_FORMAT(c.fecha_devolucion_esperada, '%Y-%m-%d') AS fecha_devolucion_esperada,
  DATE_FORMAT(c.fecha_firma, '%Y-%m-%d') AS fecha_firma,
  c.observaciones, c.condiciones_especiales, c.entrega_nombre, c.entrega_cargo,
  c.colaborador_snapshot, c.empresa_snapshot,
  c.generada_en, c.cancelada_en, c.motivo_cancelacion, c.created_at, c.updated_at`;

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

// ---------------------------------------------------------------------------
// Asignaciones -> items de la carta
// ---------------------------------------------------------------------------

async function lockAsignacion(conn, tipo, id) {
  const cfg = KINDS[RECURSOS[tipo].kind];
  const [[a]] = await conn.query(
    `SELECT id, colaborador_id, ${cfg.asigFk} AS item_id, fecha_asignacion, fecha_devolucion
       FROM ${cfg.asigTable} WHERE id = :id FOR SHARE`,
    { id }
  );
  return a || null;
}

/**
 * Valida que cada asignacion exista, sea del colaborador, siga VIGENTE (recurso no devuelto)
 * y no este ya en otra carta no cancelada.
 */
async function validateItems(conn, colaboradorId, items, excludeCartaId = null) {
  if (!Array.isArray(items) || items.length === 0) throw fieldError(400, 'Selecciona al menos un recurso.', 'items');
  if (items.length > MAX_RECURSOS) throw fieldError(400, `Una carta admite máximo ${MAX_RECURSOS} recursos.`, 'items');

  const seen = new Set();
  const out = [];
  for (const [orden, it] of items.entries()) {
    const recurso = RECURSOS[it.tipo];
    if (!recurso) throw fieldError(400, 'Tipo de recurso inválido.', 'items');
    const key = `${it.tipo}:${it.asignacion_id}`;
    if (seen.has(key)) throw fieldError(400, 'Hay un recurso repetido en la selección.', 'items');
    seen.add(key);

    const asignacion = await lockAsignacion(conn, it.tipo, it.asignacion_id);
    if (!asignacion) throw fieldError(404, 'Una de las asignaciones seleccionadas no existe.', 'items');
    if (asignacion.colaborador_id !== colaboradorId) {
      throw fieldError(400, 'Una de las asignaciones no pertenece al colaborador seleccionado.', 'items');
    }
    if (asignacion.fecha_devolucion) {
      throw fieldError(409, 'Uno de los recursos ya fue devuelto: solo se puede generar carta de recursos asignados.', 'items');
    }

    const [[dup]] = await conn.query(
      `SELECT c.folio FROM cartas_responsivas_items ci
         JOIN cartas_responsivas c ON c.id = ci.carta_id
        WHERE ci.activo = 1 AND ci.${recurso.col} = :id AND (:excl IS NULL OR ci.carta_id <> :excl)
        LIMIT 1`,
      { id: asignacion.id, excl: excludeCartaId }
    );
    if (dup) throw fieldError(409, `Uno de los recursos ya está incluido en la carta ${dup.folio}.`, 'items');

    out.push({ tipo: it.tipo, asignacion, orden });
  }
  return out;
}

async function insertItems(conn, cartaId, validated) {
  for (const v of validated) {
    await conn.query(
      `INSERT INTO cartas_responsivas_items (carta_id, tipo_recurso, ${RECURSOS[v.tipo].col}, orden)
       VALUES (:cartaId, :tipo, :asignacionId, :orden)`,
      { cartaId, tipo: v.tipo, asignacionId: v.asignacion.id, orden: v.orden }
    );
  }
}

/** Una violacion del indice unico (carrera entre dos cartas) se informa como conflicto. */
async function guardDuplicate(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage?.includes('uq_cartas_items_asignacion')) {
      throw fieldError(409, 'Uno de los recursos ya está incluido en otra carta.', 'items');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Crear / editar (solo borrador)
// ---------------------------------------------------------------------------

async function create(data, userId, ip) {
  return guardDuplicate(() =>
    withTransaction(async (conn) => {
      const [[colaborador]] = await conn.query('SELECT id FROM colaboradores WHERE id = :id FOR SHARE', { id: data.colaborador_id });
      if (!colaborador) throw fieldError(404, 'El colaborador no existe.', 'colaborador_id');

      const items = await validateItems(conn, data.colaborador_id, data.items);

      // El folio se genera con un candado sobre la fila de configuracion: dos cartas
      // simultaneas nunca obtienen el mismo consecutivo.
      const empresa = await empresaModel.getRaw(conn);
      await conn.query('SELECT id FROM configuracion_empresa WHERE id = 1 FOR UPDATE');
      const anio = new Date().getFullYear();
      // FOR SHARE: lectura del dato mas reciente (una lectura normal usaria el snapshot de la
      // transaccion, tomado antes de esperar el candado, y repetiria el consecutivo del otro).
      const [[{ n }]] = await conn.query(
        'SELECT COALESCE(MAX(consecutivo), 0) + 1 AS n FROM cartas_responsivas WHERE anio = :anio FOR SHARE',
        { anio }
      );
      const folio = `${empresa.folio_prefijo}-${anio}-${String(n).padStart(6, '0')}`;

      const [result] = await conn.query(
        `INSERT INTO cartas_responsivas
           (folio, anio, consecutivo, colaborador_id, plantilla, fecha_entrega, fecha_devolucion_esperada,
            observaciones, condiciones_especiales, entrega_nombre, entrega_cargo, creado_por, actualizado_por)
         VALUES (:folio, :anio, :n, :colaboradorId, :plantilla, :fechaEntrega, :fechaDev,
                 :observaciones, :condiciones, :entregaNombre, :entregaCargo, :userId, :userId)`,
        {
          folio, anio, n,
          colaboradorId: data.colaborador_id,
          plantilla: derivePlantilla(items.map((i) => i.tipo)),
          fechaEntrega: data.fecha_entrega,
          fechaDev: data.fecha_devolucion_esperada || null,
          observaciones: data.observaciones || null,
          condiciones: data.condiciones_especiales || null,
          entregaNombre: data.entrega_nombre ?? empresa.entrega_nombre ?? null,
          entregaCargo: data.entrega_cargo ?? empresa.entrega_cargo ?? null,
          userId: userId ?? null,
        }
      );
      await insertItems(conn, result.insertId, items);
      await logAudit(conn, {
        userId, ip, action: 'creada', entity: ENTITY, entityId: result.insertId,
        details: { folio, recursos: items.length },
      });
      return result.insertId;
    })
  );
}

async function lockCarta(conn, id) {
  const [[carta]] = await conn.query('SELECT * FROM cartas_responsivas WHERE id = :id FOR UPDATE', { id });
  if (!carta) throw new AppError('Carta no encontrada.', 404);
  return carta;
}

async function update(id, data, userId, ip) {
  return guardDuplicate(() =>
    withTransaction(async (conn) => {
      const carta = await lockCarta(conn, id);
      if (carta.estado !== 'borrador') {
        throw new AppError('Solo se puede editar una carta en borrador. Para corregir una carta generada, cancélala y crea otra.', 409);
      }
      const [[colaborador]] = await conn.query('SELECT id FROM colaboradores WHERE id = :id FOR SHARE', { id: data.colaborador_id });
      if (!colaborador) throw fieldError(404, 'El colaborador no existe.', 'colaborador_id');

      const items = await validateItems(conn, data.colaborador_id, data.items, id);

      await conn.query(
        `UPDATE cartas_responsivas
            SET colaborador_id = :colaboradorId, plantilla = :plantilla, fecha_entrega = :fechaEntrega,
                fecha_devolucion_esperada = :fechaDev, observaciones = :observaciones,
                condiciones_especiales = :condiciones, entrega_nombre = :entregaNombre,
                entrega_cargo = :entregaCargo, actualizado_por = :userId
          WHERE id = :id`,
        {
          id,
          colaboradorId: data.colaborador_id,
          plantilla: derivePlantilla(items.map((i) => i.tipo)),
          fechaEntrega: data.fecha_entrega,
          fechaDev: data.fecha_devolucion_esperada || null,
          observaciones: data.observaciones || null,
          condiciones: data.condiciones_especiales || null,
          entregaNombre: data.entrega_nombre ?? null,
          entregaCargo: data.entrega_cargo ?? null,
          userId: userId ?? null,
        }
      );
      // Un borrador no es un registro legal: se reemplazan sus recursos.
      await conn.query('DELETE FROM cartas_responsivas_items WHERE carta_id = :id', { id });
      await insertItems(conn, id, items);
      await logAudit(conn, { userId, ip, action: 'modificada', entity: ENTITY, entityId: id, details: { recursos: items.length } });
    })
  );
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

function pickColaborador(c) {
  return {
    id: c.id,
    nombre_completo: c.nombre_completo,
    id_empleado: c.id_empleado,
    area: c.area,
    cargo: c.cargo,
    correo_empresarial: c.correo_empresarial,
    telefono_empresarial: c.telefono_empresarial,
  };
}

// Fragmento: codigo de inventario de los recursos de una carta (para buscar por codigo).
const CODE_MATCH = `EXISTS (
  SELECT 1 FROM cartas_responsivas_items ci
    LEFT JOIN asignaciones_equipos     ae ON ae.id = ci.asignacion_equipo_id
    LEFT JOIN equipos                  e  ON e.id  = ae.equipo_id
    LEFT JOIN asignaciones_accesorios  aa ON aa.id = ci.asignacion_accesorio_id
    LEFT JOIN accesorios               ac ON ac.id = aa.accesorio_id
    LEFT JOIN asignaciones_impresoras  ai ON ai.id = ci.asignacion_impresora_id
    LEFT JOIN impresoras               ip ON ip.id = ai.impresora_id
    LEFT JOIN asignaciones_celulares   acl ON acl.id = ci.asignacion_celular_id
    LEFT JOIN celulares                ce ON ce.id = acl.celular_id
   WHERE ci.carta_id = c.id
     AND (e.codigo_inventario LIKE :KEY OR ac.codigo_inventario LIKE :KEY
          OR ip.codigo_inventario LIKE :KEY OR ce.codigo_inventario LIKE :KEY))`;

function buildFilters({ search, tipo, estados, desde, hasta, areaId }) {
  const where = [];
  const params = {};

  // Cada palabra debe coincidir con folio, colaborador o codigo de inventario.
  (search || '').split(/\s+/).filter(Boolean).slice(0, 5).forEach((token, i) => {
    const key = `s${i}`;
    where.push(
      `(c.folio LIKE :${key} OR col.nombre LIKE :${key} OR col.apellido_paterno LIKE :${key}
        OR col.apellido_materno LIKE :${key} OR col.id_empleado LIKE :${key}
        OR ${CODE_MATCH.replace(/:KEY/g, `:${key}`)})`
    );
    params[key] = `%${escapeLike(token)}%`;
  });
  if (tipo) {
    where.push('EXISTS (SELECT 1 FROM cartas_responsivas_items t WHERE t.carta_id = c.id AND t.tipo_recurso = :tipo)');
    params.tipo = tipo;
  }
  if (estados?.length) {
    where.push('c.estado IN (:estados)');
    params.estados = estados;
  }
  if (desde) { where.push('c.fecha_entrega >= :desde'); params.desde = desde; }
  if (hasta) { where.push('c.fecha_entrega <= :hasta'); params.hasta = hasta; }
  if (areaId) { where.push('col.area_id = :areaId'); params.areaId = areaId; }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function findAll(filters, { page, limit }) {
  const { whereSql, params } = buildFilters(filters);
  const FROM = `FROM cartas_responsivas c
    JOIN colaboradores col ON col.id = c.colaborador_id
    JOIN areas ar ON ar.id = col.area_id`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT c.id, c.folio, c.estado, c.plantilla, c.colaborador_id,
            DATE_FORMAT(c.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
            DATE_FORMAT(c.fecha_firma, '%Y-%m-%d') AS fecha_firma,
            CONCAT_WS(' ', col.nombre, col.apellido_paterno, col.apellido_materno) AS colaborador_nombre,
            col.id_empleado, ar.nombre AS area, c.created_at
     ${FROM} ${whereSql}
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset: (page - 1) * limit }
  );

  // Recursos de las cartas de la pagina (codigo + descripcion), en una sola consulta.
  if (rows.length) {
    const [items] = await pool.query(
      `SELECT ci.carta_id, ci.tipo_recurso,
              COALESCE(e.codigo_inventario, ac.codigo_inventario, ip.codigo_inventario, ce.codigo_inventario) AS codigo,
              COALESCE(NULLIF(TRIM(CONCAT_WS(' ', e.marca, e.modelo)), ''), ac.nombre,
                       NULLIF(TRIM(CONCAT_WS(' ', ip.marca, ip.modelo)), ''),
                       NULLIF(TRIM(CONCAT_WS(' ', ce.marca, ce.modelo)), '')) AS descripcion
         FROM cartas_responsivas_items ci
         LEFT JOIN asignaciones_equipos     ae ON ae.id = ci.asignacion_equipo_id
         LEFT JOIN equipos                  e  ON e.id  = ae.equipo_id
         LEFT JOIN asignaciones_accesorios  aa ON aa.id = ci.asignacion_accesorio_id
         LEFT JOIN accesorios               ac ON ac.id = aa.accesorio_id
         LEFT JOIN asignaciones_impresoras  ai ON ai.id = ci.asignacion_impresora_id
         LEFT JOIN impresoras               ip ON ip.id = ai.impresora_id
         LEFT JOIN asignaciones_celulares   acl ON acl.id = ci.asignacion_celular_id
         LEFT JOIN celulares                ce ON ce.id = acl.celular_id
        WHERE ci.carta_id IN (:ids)
        ORDER BY ci.carta_id, ci.orden, ci.id`,
      { ids: rows.map((r) => r.id) }
    );
    for (const r of rows) {
      r.recursos = items.filter((i) => i.carta_id === r.id).map(({ tipo_recurso, codigo, descripcion }) => ({ tipo: tipo_recurso, codigo, descripcion }));
    }
  }
  return { rows, total };
}

async function getStats() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(estado = 'borrador'), 0)        AS borrador,
            COALESCE(SUM(estado = 'generada'), 0)        AS generada,
            COALESCE(SUM(estado = 'pendiente_firma'), 0) AS pendiente_firma,
            COALESCE(SUM(estado = 'firmada'), 0)         AS firmada,
            COALESCE(SUM(estado = 'cancelada'), 0)       AS cancelada
       FROM cartas_responsivas`
  );
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

async function findRow(id, db = pool) {
  const [[carta]] = await db.query(
    `SELECT ${CARTA_COLS},
            uc.name AS creado_por_nombre, ua.name AS actualizado_por_nombre,
            ug.name AS generada_por_nombre, ux.name AS cancelada_por_nombre
       FROM cartas_responsivas c
       LEFT JOIN users uc ON uc.id = c.creado_por
       LEFT JOIN users ua ON ua.id = c.actualizado_por
       LEFT JOIN users ug ON ug.id = c.generada_por
       LEFT JOIN users ux ON ux.id = c.cancelada_por
      WHERE c.id = :id`,
    { id }
  );
  return carta || null;
}

async function findItemRows(id, db = pool) {
  const [rows] = await db.query('SELECT * FROM cartas_responsivas_items WHERE carta_id = :id ORDER BY orden, id', { id });
  return rows;
}

/** Datos del recurso de un item: la copia congelada si la carta ya se genero; si no, los vivos. */
async function resolveRecurso(item) {
  const tipo = item.tipo_recurso;
  const recurso = RECURSOS[tipo];
  const cfg = KINDS[recurso.kind];
  const [[asig]] = await pool.query(
    `SELECT id, ${cfg.asigFk} AS item_id, fecha_asignacion, fecha_devolucion FROM ${cfg.asigTable} WHERE id = :id`,
    { id: item[recurso.col] }
  );
  let datos = item.snapshot;
  if (!datos) {
    const vivo = await INV[tipo].findById(asig.item_id);
    datos = vivo ? snapshotRecurso(vivo) : {};
  }
  return { tipo, recurso, asig, datos };
}

async function findById(id) {
  const carta = await findRow(id);
  if (!carta) return null;

  const colaborador = carta.colaborador_snapshot
    || pickColaborador(await colaboradorModel.findById(carta.colaborador_id));

  const recursos = [];
  for (const item of await findItemRows(id)) {
    const { tipo, recurso, asig, datos } = await resolveRecurso(item);
    recursos.push({
      id: item.id,
      tipo,
      label: recurso.label,
      kind: recurso.kind,
      item_id: asig.item_id,
      asignacion_id: asig.id,
      fecha_asignacion: asig.fecha_asignacion,
      fecha_devolucion: asig.fecha_devolucion,
      devuelto: !!asig.fecha_devolucion, // la carta sigue vigente aunque el recurso ya se haya devuelto
      activo: !!item.activo,
      codigo_inventario: datos.codigo_inventario,
      titulo: datos.titulo,
      campos: camposRecurso(tipo, datos),
    });
  }

  const [documentos] = await pool.query(
    `SELECT d.id, d.tipo, d.version, d.vigente, d.nombre_original, d.mime, d.tamano, d.sha256,
            d.created_at, u.name AS subido_por
       FROM cartas_responsivas_documentos d LEFT JOIN users u ON u.id = d.subido_por
      WHERE d.carta_id = :id ORDER BY d.tipo, d.version DESC`,
    { id }
  );

  const { colaborador_snapshot, empresa_snapshot, ...rest } = carta;
  return { ...rest, congelada: !!colaborador_snapshot, colaborador, recursos, documentos: documentos.map((d) => ({ ...d, vigente: !!d.vigente })) };
}

async function findHistorial(id) {
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS usuario
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.entity = :entity AND a.entity_id = :id
      ORDER BY a.created_at, a.id`,
    { entity: ENTITY, id: String(id) }
  );
  return rows;
}

// ---------------------------------------------------------------------------
// PDF: vista previa (borrador) y generacion (congela los datos)
// ---------------------------------------------------------------------------

async function loadLogo() {
  const raw = await empresaModel.getRaw();
  if (!raw.logo) return null;
  const mime = raw.logo.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return logoDataUrl(documentUploads.logo.filePath(raw.logo), mime);
}

/** Reune los datos VIVOS (colaborador, empresa, recursos) para armar el PDF de un borrador. */
async function collectLiveData(carta, itemRows) {
  const colaborador = pickColaborador(await colaboradorModel.findById(carta.colaborador_id));
  const e = await empresaModel.get();
  const empresa = {
    nombre: e.nombre, rfc: e.rfc, direccion: e.direccion, telefono: e.telefono, correo: e.correo,
    sitio_web: e.sitio_web, pie_documento: e.pie_documento,
    encabezado_documento: e.encabezado_documento, formato_fecha: e.formato_fecha,
    texto_declaracion: e.texto_declaracion, texto_condiciones: e.texto_condiciones,
  };
  const recursos = [];
  for (const item of itemRows) {
    const { tipo, recurso, datos } = await resolveRecurso(item);
    recursos.push({ tipo, label: recurso.label, snapshot: datos });
  }
  return { colaborador, empresa, recursos };
}

function toRenderInput(carta, { colaborador, empresa, recursos }, logo, watermark) {
  return {
    carta,
    colaborador,
    empresa,
    recursos: recursos.map((r) => ({ label: r.label, campos: camposRecurso(r.tipo, r.snapshot) })),
    logo,
    watermark,
  };
}

async function renderPreview(id) {
  const carta = await findRow(id);
  if (!carta) throw new AppError('Carta no encontrada.', 404);
  if (carta.estado !== 'borrador') throw new AppError('La vista previa solo está disponible para borradores.', 409);
  const data = await collectLiveData(carta, await findItemRows(id));
  return renderCartaPdf(toRenderInput(carta, data, await loadLogo(), 'BORRADOR'));
}

async function generar(id, userId, ip) {
  let savedFile = null;
  try {
    return await withTransaction(async (conn) => {
      const lock = await lockCarta(conn, id);
      if (lock.estado !== 'borrador') throw new AppError('Solo una carta en borrador se puede generar.', 409);
      if (!lock.entrega_nombre || !lock.entrega_cargo) {
        throw fieldError(400, 'Indica el nombre y el cargo de quien entrega.', 'entrega_nombre');
      }

      const carta = await findRow(id, conn);
      const itemRows = await findItemRows(id, conn);

      // Los recursos deben seguir asignados al colaborador.
      for (const item of itemRows) {
        const { asig } = await resolveRecurso(item);
        if (asig.fecha_devolucion) {
          throw fieldError(409, 'Uno de los recursos ya fue devuelto. Edita el borrador para quitarlo.', 'items');
        }
      }

      const data = await collectLiveData(carta, itemRows);
      const buffer = await renderCartaPdf(toRenderInput(carta, data, await loadLogo(), null));

      // Archivo en storage (nombre aleatorio; nunca se expone la ruta).
      const archivo = `${crypto.randomUUID()}.pdf`;
      savedFile = archivo;
      fs.writeFileSync(documentUploads.cartas.filePath(archivo), buffer);

      await conn.query(
        `UPDATE cartas_responsivas
            SET estado = 'generada', generada_en = NOW(), generada_por = :userId, actualizado_por = :userId,
                colaborador_snapshot = :colaborador, empresa_snapshot = :empresa
          WHERE id = :id`,
        { id, userId: userId ?? null, colaborador: JSON.stringify(data.colaborador), empresa: JSON.stringify(data.empresa) }
      );
      for (const [i, item] of itemRows.entries()) {
        await conn.query('UPDATE cartas_responsivas_items SET snapshot = :snap WHERE id = :id', {
          id: item.id, snap: JSON.stringify(data.recursos[i].snapshot),
        });
      }
      await conn.query(
        `INSERT INTO cartas_responsivas_documentos (carta_id, tipo, version, vigente, archivo, nombre_original, mime, tamano, sha256, subido_por)
         VALUES (:id, 'generado', 1, 1, :archivo, :nombre, 'application/pdf', :tamano, :sha, :userId)`,
        {
          id, archivo, nombre: `${carta.folio}.pdf`, tamano: buffer.length,
          sha: crypto.createHash('sha256').update(buffer).digest('hex'), userId: userId ?? null,
        }
      );
      await logAudit(conn, { userId, ip, action: 'pdf_generado', entity: ENTITY, entityId: id, details: { folio: carta.folio } });
      savedFile = null; // confirmado
      return id;
    });
  } catch (err) {
    if (savedFile) documentUploads.cartas.remove(savedFile);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Documentos: descarga, firmada, cancelacion
// ---------------------------------------------------------------------------

async function getDocumento(cartaId, tipo) {
  const [[doc]] = await pool.query(
    'SELECT * FROM cartas_responsivas_documentos WHERE carta_id = :cartaId AND tipo = :tipo AND vigente = 1',
    { cartaId, tipo }
  );
  return doc || null;
}

async function getDocumentoById(cartaId, docId) {
  const [[doc]] = await pool.query('SELECT * FROM cartas_responsivas_documentos WHERE id = :docId AND carta_id = :cartaId', { docId, cartaId });
  return doc || null;
}

/** Registra una descarga. La primera descarga de una carta GENERADA la pasa a PENDIENTE_FIRMA. */
async function registrarDescarga(id, tipoDoc, userId, ip) {
  await withTransaction(async (conn) => {
    const carta = await lockCarta(conn, id);
    let transicion = false;
    if (tipoDoc === 'generado' && carta.estado === 'generada') {
      await conn.query("UPDATE cartas_responsivas SET estado = 'pendiente_firma', actualizado_por = :userId WHERE id = :id", { id, userId: userId ?? null });
      transicion = true;
    }
    await logAudit(conn, {
      userId, ip, action: tipoDoc === 'generado' ? 'pdf_descargado' : 'firmada_descargada',
      entity: ENTITY, entityId: id, details: transicion ? { estado: 'pendiente_firma' } : null,
    });
  });
}

/**
 * Registra el documento firmado. Si ya habia uno, crea una version nueva (el anterior
 * queda con vigente = 0: no se borra). Solo un administrador puede reemplazar.
 */
async function subirFirmada(id, file, { fechaFirma, userId, isAdmin, ip }) {
  const buffer = fs.readFileSync(file.path);
  try {
    return await withTransaction(async (conn) => {
      const carta = await lockCarta(conn, id);
      if (carta.estado === 'borrador') throw new AppError('Genera el PDF de la carta antes de subir la versión firmada.', 409);
      if (carta.estado === 'cancelada') throw new AppError('No se puede subir un documento a una carta cancelada.', 409);
      const reemplazo = carta.estado === 'firmada';
      if (reemplazo && !isAdmin) throw new AppError('Solo un administrador puede reemplazar una carta firmada.', 403);

      const [[{ v }]] = await conn.query(
        "SELECT COALESCE(MAX(version), 0) + 1 AS v FROM cartas_responsivas_documentos WHERE carta_id = :id AND tipo = 'firmado'",
        { id }
      );
      await conn.query("UPDATE cartas_responsivas_documentos SET vigente = 0 WHERE carta_id = :id AND tipo = 'firmado' AND vigente = 1", { id });
      await conn.query(
        `INSERT INTO cartas_responsivas_documentos (carta_id, tipo, version, vigente, archivo, nombre_original, mime, tamano, sha256, subido_por)
         VALUES (:id, 'firmado', :v, 1, :archivo, :nombre, :mime, :tamano, :sha, :userId)`,
        {
          id, v, archivo: file.filename, nombre: (file.originalname || '').slice(0, 255) || null,
          mime: file.mimetype, tamano: file.size, sha: crypto.createHash('sha256').update(buffer).digest('hex'), userId: userId ?? null,
        }
      );
      await conn.query(
        "UPDATE cartas_responsivas SET estado = 'firmada', fecha_firma = :fecha, actualizado_por = :userId WHERE id = :id",
        { id, fecha: fechaFirma || localDateString(), userId: userId ?? null }
      );
      await logAudit(conn, {
        userId, ip, action: reemplazo ? 'firmada_reemplazada' : 'firmada_subida', entity: ENTITY, entityId: id,
        details: { version: v, archivo_original: file.originalname, tamano: file.size },
      });
      return id;
    });
  } catch (err) {
    documentUploads.cartas.remove(file.filename); // no dejar archivos huerfanos
    throw err;
  }
}

async function cancelar(id, motivo, { userId, isAdmin, ip }) {
  await withTransaction(async (conn) => {
    const carta = await lockCarta(conn, id);
    if (carta.estado === 'cancelada') throw new AppError('La carta ya está cancelada.', 409);
    if (carta.estado === 'firmada') {
      if (!isAdmin) throw new AppError('Solo un administrador puede cancelar una carta firmada.', 403);
      if (!motivo) throw fieldError(400, 'Indica el motivo de la cancelación.', 'motivo');
    }
    await conn.query(
      `UPDATE cartas_responsivas
          SET estado = 'cancelada', cancelada_en = NOW(), cancelada_por = :userId,
              motivo_cancelacion = :motivo, actualizado_por = :userId
        WHERE id = :id`,
      { id, userId: userId ?? null, motivo: motivo || null }
    );
    // Libera las asignaciones: podran incluirse en una carta nueva.
    await conn.query('UPDATE cartas_responsivas_items SET activo = 0 WHERE carta_id = :id', { id });
    await logAudit(conn, {
      userId, ip, action: 'cancelada', entity: ENTITY, entityId: id,
      details: { estado_anterior: carta.estado, motivo: motivo || null },
    });
  });
}

/** Cartas vigentes (no canceladas) por asignacion de un colaborador: { 'EQUIPO:12': { id, folio, estado } }. */
async function findCartasPorAsignacion(colaboradorId) {
  const [rows] = await pool.query(
    `SELECT ci.tipo_recurso AS tipo,
            COALESCE(ci.asignacion_equipo_id, ci.asignacion_accesorio_id, ci.asignacion_impresora_id, ci.asignacion_celular_id) AS asignacion_id,
            c.id AS carta_id, c.folio, c.estado
       FROM cartas_responsivas_items ci JOIN cartas_responsivas c ON c.id = ci.carta_id
      WHERE ci.activo = 1 AND c.colaborador_id = :id`,
    { id: colaboradorId }
  );
  return Object.fromEntries(rows.map((r) => [`${r.tipo}:${r.asignacion_id}`, { id: r.carta_id, folio: r.folio, estado: r.estado }]));
}

module.exports = {
  create, update, findAll, getStats, findById, findHistorial, renderPreview, generar,
  getDocumento, getDocumentoById, registrarDescarga, subirFirmada, cancelar, findCartasPorAsignacion,
  findRow,
};
