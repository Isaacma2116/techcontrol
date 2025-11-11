const { pool } = require('../config/database');
const LicenciaEquipo = require('./licenciaEquipo.model');

module.exports = {
  /**
   * @desc Obtiene todas las licencias de un software
   * @param {number} software_id - ID del software
   * @returns {Promise<Array>} Lista de licencias
   */
  async getAllBySoftware(software_id) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id,
          clave_licencia,
          tipo_licencia,
          estado,
          fecha_adquisicion,
          fecha_caducidad,
          max_dispositivos,
          correo,
          observaciones
         FROM licencia 
         WHERE software_id = ? 
         ORDER BY fecha_caducidad ASC`,
        [software_id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Obtiene una licencia por su ID
   * @param {number} id - ID de la licencia
   * @returns {Promise<Object|null>} Objeto de licencia o null si no existe
   */
  async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id,
          software_id,
          clave_licencia,
          tipo_licencia,
          estado,
          fecha_adquisicion,
          fecha_caducidad,
          max_dispositivos,
          correo,
          observaciones
         FROM licencia 
         WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Crea una nueva licencia
   * @param {Object} data - Datos de la licencia
   * @returns {Promise<Object>} Licencia creada con su ID
   */
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO licencia
        (software_id, clave_licencia, tipo_licencia, estado,
         fecha_adquisicion, fecha_caducidad, max_dispositivos,
         correo, contrasena, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.software_id,
          data.clave_licencia,
          data.tipo_licencia,
          data.estado || 'activa',
          data.fecha_adquisicion || null,
          data.fecha_caducidad || null,
          data.max_dispositivos || 1,
          data.correo || null,
          data.contrasena || null,
          data.observaciones || null
        ]
      );

      // Si hay equipos asociados, crear las relaciones
      if (data.equipos && data.equipos.length > 0) {
        await LicenciaEquipo.setEquipos(result.insertId, data.equipos);
      }

      await conn.commit();
      return { id: result.insertId, ...data };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Actualiza una licencia existente
   * @param {number} id - ID de la licencia
   * @param {Object} data - Nuevos datos de la licencia
   * @returns {Promise<Object>} Licencia actualizada
   */
  async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE licencia 
         SET 
           clave_licencia = ?,
           tipo_licencia = ?,
           estado = ?,
           fecha_adquisicion = ?,
           fecha_caducidad = ?,
           max_dispositivos = ?,
           correo = ?,
           contrasena = ?,
           observaciones = ?
         WHERE id = ?`,
        [
          data.clave_licencia,
          data.tipo_licencia,
          data.estado,
          data.fecha_adquisicion || null,
          data.fecha_caducidad || null,
          data.max_dispositivos || 1,
          data.correo || null,
          data.contrasena || null,
          data.observaciones || null,
          id
        ]
      );

      // Actualizar equipos asociados si se proporcionaron
      if (data.equipos) {
        await LicenciaEquipo.setEquipos(id, data.equipos);
      }

      await conn.commit();
      return { id, ...data };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Elimina una licencia y sus relaciones
   * @param {number} id - ID de la licencia
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Eliminar relaciones con equipos primero
      await LicenciaEquipo.setEquipos(id, []);

      // 2. Eliminar la licencia
      const [result] = await conn.query(
        'DELETE FROM licencia WHERE id = ?',
        [id]
      );

      await conn.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};