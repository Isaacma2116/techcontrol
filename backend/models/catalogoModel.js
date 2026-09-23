const { pool } = require('../config/db');

/**
 * Catalogos simples. El nombre de la tabla proviene de esta lista blanca,
 * nunca del request, asi que es seguro interpolarlo en el SQL.
 * `soft`: la tabla tiene columna `activo` (los tipos no la necesitan).
 */
const TABLES = {
  areas: { table: 'areas', soft: true },
  cargos: { table: 'cargos', soft: true },
  'tipos-equipo': { table: 'tipos_equipo', soft: false },
  'tipos-accesorio': { table: 'tipos_accesorio', soft: false },
  'tipos-impresora': { table: 'tipos_impresora', soft: false },
  ubicaciones: { table: 'ubicaciones', soft: true },
  'categorias-software': { table: 'categorias_software', soft: false },
  // Catalogo CON COMPORTAMIENTO (utils/licencias.js): trae columnas ademas de
  // nombre y no se edita aqui (las filas vienen de la migracion 007).
  'modelos-licencia': {
    table: 'modelos_licencia', soft: true, readOnly: true,
    fields: 'id, codigo, nombre, ambito, temporalidad, requiere_desactivacion',
    orderBy: 'orden, nombre',
  },
};

/** Catalogos que solo se consultan (sus filas no se crean vía POST /catalogos/:tipo). */
const READONLY = new Set(Object.entries(TABLES).filter(([, c]) => c.readOnly).map(([tipo]) => tipo));

function config(tipo) {
  const cfg = TABLES[tipo];
  if (!cfg) throw new Error(`Catalogo desconocido: ${tipo}`);
  return cfg;
}

async function findAll(tipo) {
  const { table, soft, fields = 'id, nombre', orderBy = 'nombre' } = config(tipo);
  const [rows] = await pool.query(
    `SELECT ${fields} FROM ${table} ${soft ? 'WHERE activo = 1' : ''} ORDER BY ${orderBy}`
  );
  return rows;
}

async function create(tipo, nombre) {
  const [result] = await pool.query(`INSERT INTO ${config(tipo).table} (nombre) VALUES (:nombre)`, {
    nombre,
  });
  return { id: result.insertId, nombre };
}

module.exports = { findAll, create, CATALOGOS: Object.keys(TABLES), READONLY };
