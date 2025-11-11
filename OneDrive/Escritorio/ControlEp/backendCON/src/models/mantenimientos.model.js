const { pool } = require('../config/database');

const TABLE = 'mantenimientos_programados';

const Mantenimiento = {};

// Obtener todos
Mantenimiento.getAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE}`);
  return rows;
};

// Obtener uno por ID
Mantenimiento.getById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return rows[0];
};

// Crear uno nuevo
Mantenimiento.create = async (data) => {
  const {
    equipo_id,
    tipo_mantenimiento,
    fecha_programada,
    prioridad,
    descripcion,
    estado,
    fecha_reprogramada
  } = data;

  const [result] = await pool.query(
    `INSERT INTO ${TABLE} 
      (equipo_id, tipo_mantenimiento, fecha_programada, prioridad, descripcion, estado, fecha_reprogramada)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [equipo_id, tipo_mantenimiento, fecha_programada, prioridad, descripcion, estado || 'pendiente', fecha_reprogramada || null]
  );
  return result.insertId;
};

// Actualizar
Mantenimiento.update = async (id, data) => {
  const fields = [];
  const values = [];

  for (const key of ['equipo_id', 'tipo_mantenimiento', 'fecha_programada', 'prioridad', 'descripcion', 'estado', 'fecha_reprogramada']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) return 0;

  values.push(id);
  const [result] = await pool.query(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows;
};

// Eliminar
Mantenimiento.remove = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
  return result.affectedRows;
};

module.exports = Mantenimiento;