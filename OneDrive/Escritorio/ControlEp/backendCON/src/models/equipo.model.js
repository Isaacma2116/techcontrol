const { pool } = require('../config/database');

class Equipo {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM equipos');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM equipos WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      `INSERT INTO equipos 
      (user_id, colaborador_id, tipo, marca, modelo, procesador, ram, almacenamiento, sistema_operativo, numero_serie, estado, observaciones, fecha_adquisicion, foto_equipo, creado_en, actualizado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.user_id, 
        data.colaborador_id, 
        data.tipo, 
        data.marca, 
        data.modelo, 
        data.procesador, 
        data.ram,
        data.almacenamiento, 
        data.sistema_operativo, 
        data.numero_serie, 
        data.estado, 
        data.observaciones,
        data.fecha_adquisicion, 
        data.foto_equipo
      ]
    );
    return { id: result.insertId, ...data };
  }

  // UPDATE DINÁMICO: solo los campos recibidos
  static async updatePartial(id, data) {
    const fields = [];
    const values = [];
    for (const key in data) {
      if (typeof data[key] !== "undefined") {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return false;
    fields.push('actualizado_en = NOW()');
    values.push(id);

    const [result] = await pool.query(
      `UPDATE equipos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM equipos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Equipo;