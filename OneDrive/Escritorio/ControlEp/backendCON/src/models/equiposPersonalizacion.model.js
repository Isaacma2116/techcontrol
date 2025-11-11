const { pool } = require('../config/database');

const EquiposPersonalizacion = {};

// Obtener personalización por equipo_id
EquiposPersonalizacion.getByEquipoId = async (equipo_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM equipos_personalizacion WHERE equipo_id = ?',
    [equipo_id]
  );
  return rows[0];
};

// Crear o actualizar personalización
EquiposPersonalizacion.upsert = async (equipo_id, color, icono) => {
  // ON DUPLICATE KEY UPDATE para upsert
  const [result] = await pool.query(
    `INSERT INTO equipos_personalizacion (equipo_id, color, icono)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE color = VALUES(color), icono = VALUES(icono)`,
    [equipo_id, color, icono]
  );
  return result.insertId;
};

// Obtener todas las personalizaciones
EquiposPersonalizacion.getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM equipos_personalizacion');
  return rows;
};

module.exports = EquiposPersonalizacion;