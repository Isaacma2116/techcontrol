const { pool } = require('../config/database');
const Licencia = require('./licencia.model');
const LicenciaEquipo = require('./licenciaEquipo.model');

module.exports = {
  /**
   * @desc Crea un nuevo software con sus licencias
   * @param {Object} softwareData - Datos del software
   * @returns {Promise<Object>} Objeto con ID del software y conteo de licencias
   */
  async create(softwareData) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insertar software principal
      const [swResult] = await conn.query(
        'INSERT INTO software (nombre, tipo, version, descripcion) VALUES (?, ?, ?, ?)',
        [
          softwareData.nombre,
          softwareData.tipo || null,
          softwareData.version || null,
          softwareData.descripcion || null
        ]
      );
      const softwareId = swResult.insertId;
      let licenciasCount = 0;

      // 2. Insertar licencias si existen
      if (softwareData.licencias && softwareData.licencias.length > 0) {
        for (const licencia of softwareData.licencias) {
          const [licResult] = await conn.query(
            `INSERT INTO licencia 
             (software_id, clave_licencia, tipo_licencia, estado, 
              fecha_adquisicion, fecha_caducidad, max_dispositivos, 
              correo, contrasena, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              softwareId,
              licencia.clave_licencia,
              licencia.tipo_licencia,
              licencia.estado || 'activa',
              licencia.fecha_adquisicion || null,
              licencia.fecha_caducidad || null,
              licencia.max_dispositivos || 1,
              licencia.correo || null,
              licencia.contrasena || null,
              licencia.observaciones || null
            ]
          );

          // 3. Insertar relaciones con equipos si existen
          if (licencia.equipos && licencia.equipos.length > 0) {
            await conn.query(
              'INSERT INTO licencia_equipo (licencia_id, equipo_id) VALUES ?',
              [licencia.equipos.map(eid => [licResult.insertId, eid])]
            );
          }
          licenciasCount++;
        }
      }

      await conn.commit();
      return { softwareId, licenciasCount };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Obtiene todos los softwares con resumen de licencias
   * @returns {Promise<Array>} Lista de softwares con conteo de licencias
   */
  async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          s.id,
          s.nombre,
          s.tipo,
          s.version,
          COUNT(l.id) AS licencias_totales,
          SUM(CASE WHEN l.estado = 'activa' THEN 1 ELSE 0 END) AS licencias_activas,
          SUM(CASE WHEN l.estado = 'caducada' THEN 1 ELSE 0 END) AS licencias_caducadas
        FROM software s
        LEFT JOIN licencia l ON s.id = l.software_id
        GROUP BY s.id, s.nombre, s.tipo, s.version
        ORDER BY s.nombre ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Obtiene un software por ID con sus licencias y relaciones con equipos
   * @param {number} id - ID del software
   * @returns {Promise<Object|null>} Objeto del software o null si no existe
   */
  async getById(id) {
    const conn = await pool.getConnection();
    try {
      // 1. Obtener información básica del software
      const [[software]] = await conn.query(
        'SELECT * FROM software WHERE id = ?', 
        [id]
      );
      if (!software) return null;

      // 2. Obtener licencias asociadas
      const [licencias] = await conn.query(
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
         WHERE software_id = ?`,
        [id]
      );

      // 3. Obtener IDs de equipos para cada licencia (sin JOIN con tabla equipos)
      for (const licencia of licencias) {
        const [equipos] = await conn.query(
          `SELECT equipo_id as id 
           FROM licencia_equipo 
           WHERE licencia_id = ?`,
          [licencia.id]
        );
        licencia.equipos = equipos;
      }

      software.licencias = licencias;
      return software;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Actualiza la información básica de un software
   * @param {number} id - ID del software
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `UPDATE software 
         SET nombre = ?, tipo = ?, version = ?, descripcion = ?
         WHERE id = ?`,
        [
          data.nombre,
          data.tipo || null,
          data.version || null,
          data.descripcion || null,
          id
        ]
      );

      await conn.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * @desc Elimina un software y todas sus relaciones
   * @param {number} id - ID del software
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Obtener licencias para eliminar sus relaciones
      const [licencias] = await conn.query(
        'SELECT id FROM licencia WHERE software_id = ?',
        [id]
      );

      // 2. Eliminar relaciones licencia_equipo
      for (const licencia of licencias) {
        await conn.query(
          'DELETE FROM licencia_equipo WHERE licencia_id = ?',
          [licencia.id]
        );
      }

      // 3. Eliminar licencias del software
      await conn.query(
        'DELETE FROM licencia WHERE software_id = ?',
        [id]
      );

      // 4. Eliminar el software
      const [result] = await conn.query(
        'DELETE FROM software WHERE id = ?',
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
  },

  /**
   * @desc Obtiene estadísticas generales de software y licencias
   * @returns {Promise<Object>} Objeto con estadísticas
   */
  async getStats() {
    try {
      const [totalSoftware] = await pool.query('SELECT COUNT(*) as total FROM software');
      const [totalLicencias] = await pool.query('SELECT COUNT(*) as total FROM licencia');
      const [licenciasActivas] = await pool.query(
        'SELECT COUNT(*) as total FROM licencia WHERE estado = "activa"'
      );

      return {
        total_software: totalSoftware[0].total,
        total_licencias: totalLicencias[0].total,
        licencias_activas: licenciasActivas[0].total
      };
    } catch (error) {
      throw error;
    }
  }
};