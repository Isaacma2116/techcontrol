const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ nombre, correo, contrasena }) {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE correo = ? OR nombre = ?',
      [correo, nombre]
    );

    if (existing.length > 0) {
      const error = new Error('El correo o nombre ya está en uso');
      error.code = 'DUPLICATE_ENTRY';
      throw error;
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nombre, correo, contrasena, rol, estado, creado_en, actualizado_en) VALUES (?, ?, ?, "usuario", "activo", NOW(), NOW())',
      [nombre, correo, hashedPassword]
    );

    return result.insertId;
  }

  static async findByEmailOrUsername(identifier) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE correo = ? OR nombre = ?',
      [identifier, identifier]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, correo, rol FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }
}

module.exports = User;
