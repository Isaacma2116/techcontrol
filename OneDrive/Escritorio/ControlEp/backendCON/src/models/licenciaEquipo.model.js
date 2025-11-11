const { pool } = require('../config/database');

module.exports = {
  /**
   * @desc Obtiene los IDs de equipos asociados a una licencia
   * @param {number} licencia_id - ID de la licencia
   * @returns {Promise<Array>} Lista de IDs de equipos
   */
  async getEquiposByLicencia(licencia_id) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          equipo_id,
          e.nombre AS equipo_nombre
         FROM licencia_equipo le
         JOIN equipos e ON le.equipo_id = e.id
         WHERE le.licencia_id = ?`,
        [licencia_id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Establece los equipos asociados a una licencia
   * @param {number} licencia_id - ID de la licencia
   * @param {Array} equipos - Lista de IDs de equipos
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async setEquipos(licencia_id, equipos) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Eliminar relaciones existentes
      await conn.query(
        'DELETE FROM licencia_equipo WHERE licencia_id = ?',
        [licencia_id]
      );

      // 2. Insertar nuevas relaciones si hay equipos
      if (equipos && equipos.length > 0) {
        await conn.query(
          'INSERT INTO licencia_equipo (licencia_id, equipo_id) VALUES ?',
          [equipos.map(eid => [licencia_id, eid])]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Verifica si un equipo está asociado a alguna licencia
   * @param {number} equipo_id - ID del equipo
   * @returns {Promise<boolean>} True si el equipo tiene licencias asociadas
   */
  async equipoTieneLicencias(equipo_id) {
    try {
      const [rows] = await pool.query(
        'SELECT 1 FROM licencia_equipo WHERE equipo_id = ? LIMIT 1',
        [equipo_id]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
};