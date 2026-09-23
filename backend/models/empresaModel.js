const { pool } = require('../config/db');
const { TEXTO_DECLARACION_DEFAULT, TEXTO_CONDICIONES_DEFAULT } = require('../utils/cartas');

/**
 * Datos de la empresa (una fila, id = 1). Alimentan las cartas responsivas y
 * cualquier documento futuro. El nombre del archivo del logo no sale de aqui:
 * se sirve por endpoint (GET /api/empresa/logo).
 */

const EDITABLE = [
  'nombre', 'rfc', 'direccion', 'telefono', 'correo', 'sitio_web', 'pie_documento',
  'entrega_nombre', 'entrega_cargo', 'folio_prefijo', 'texto_declaracion', 'texto_condiciones',
  'descripcion', 'formato_fecha', 'encabezado_documento',
];

function toDto(row) {
  const { logo, updated_by, ...rest } = row;
  return {
    ...rest,
    // Textos: si no se personalizaron, se muestra (y usa) el texto por defecto.
    texto_declaracion: row.texto_declaracion ?? TEXTO_DECLARACION_DEFAULT,
    texto_condiciones: row.texto_condiciones ?? TEXTO_CONDICIONES_DEFAULT,
    tiene_logo: !!logo,
    logo_version: logo ? logo.replace(/\.[^.]+$/, '') : null, // sirve para refrescar la vista previa
    requiere_reautenticacion_sensible: !!row.requiere_reautenticacion_sensible,
  };
}

/** Fila cruda (incluye el nombre del archivo del logo). Uso interno del backend. */
async function getRaw(db = pool) {
  await db.query('INSERT IGNORE INTO configuracion_empresa (id) VALUES (1)');
  const [[row]] = await db.query('SELECT * FROM configuracion_empresa WHERE id = 1');
  return row;
}

async function get() {
  return toDto(await getRaw());
}

async function update(data, userId) {
  const params = { userId: userId ?? null };
  for (const key of EDITABLE) params[key] = data[key] ?? null;
  params.formato_fecha = params.formato_fecha === 'corta' ? 'corta' : 'larga'; // columna NOT NULL

  // Un texto igual al de por defecto (o vacio) se guarda como NULL: asi el sistema
  // sigue usando el texto por defecto aunque se actualice en una version futura.
  for (const [key, def] of [['texto_declaracion', TEXTO_DECLARACION_DEFAULT], ['texto_condiciones', TEXTO_CONDICIONES_DEFAULT]]) {
    if (!params[key] || params[key].trim() === def.trim()) params[key] = null;
  }

  await getRaw();
  await pool.query(
    `UPDATE configuracion_empresa
        SET ${EDITABLE.map((f) => `${f} = :${f}`).join(', ')}, updated_by = :userId
      WHERE id = 1`,
    params
  );
  return get();
}

async function setLogo(filename, userId) {
  await getRaw();
  await pool.query('UPDATE configuracion_empresa SET logo = :logo, updated_by = :userId WHERE id = 1', {
    logo: filename,
    userId: userId ?? null,
  });
}

/**
 * Politica GLOBAL (no personal): si esta activa, ver datos sensibles (p. ej. la
 * contrasena Wi-Fi) exige confirmar la contrasena de nuevo en los ultimos minutos
 * (ver middleware/reautenticacion.js). La decide un administrador para todos.
 */
async function setPoliticaSeguridad(requiereReautenticacion, userId) {
  await getRaw();
  await pool.query(
    'UPDATE configuracion_empresa SET requiere_reautenticacion_sensible = :valor, updated_by = :userId WHERE id = 1',
    { valor: requiereReautenticacion ? 1 : 0, userId: userId ?? null }
  );
  return get();
}

/** Solo el booleano, para el middleware (evita armar el DTO completo en cada request sensible). */
async function requiereReautenticacion() {
  const row = await getRaw();
  return !!row.requiere_reautenticacion_sensible;
}

module.exports = { getRaw, get, update, setLogo, setPoliticaSeguridad, requiereReautenticacion, toDto };
