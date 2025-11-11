const Software = require('../models/software.model');

/**
 * @desc Obtener todos los softwares con resumen
 * @route GET /api/software
 * @access Público
 */
exports.getAll = async (req, res) => {
  try {
    const data = await Software.getAll();
    
    // Formatear respuesta
    const formattedData = data.map(item => ({
      id: item.id,
      nombre: item.nombre || 'Sin nombre',
      tipo: item.tipo || 'Sin tipo',
      version: item.version || '0.0.0',
      licencias_totales: item.licencias_totales || 0,
      licencias_activas: item.licencias_activas || 0,
      licencias_caducadas: item.licencias_caducadas || 0
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('[SoftwareController][getAll] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los softwares'
    });
  }
};

/**
 * @desc Obtener un software específico con detalles completos
 * @route GET /api/software/:id
 * @access Público
 */
exports.getById = async (req, res) => {
  try {
    const software = await Software.getById(req.params.id);
    
    if (!software) {
      return res.status(404).json({
        success: false,
        error: 'Software no encontrado'
      });
    }

    // Formatear licencias
    const licenciasFormateadas = software.licencias.map(lic => ({
      id: lic.id,
      clave_licencia: lic.clave_licencia,
      tipo: lic.tipo_licencia,
      estado: lic.estado,
      fecha_adquisicion: lic.fecha_adquisicion,
      fecha_caducidad: lic.fecha_caducidad,
      max_dispositivos: lic.max_dispositivos,
      correo: lic.correo || null,
      observaciones: lic.observaciones || null,
      equipos: lic.equipos || [] // Array de IDs de equipos
    }));

    const response = {
      id: software.id,
      nombre: software.nombre,
      tipo: software.tipo,
      version: software.version,
      descripcion: software.descripcion || '',
      licencias: licenciasFormateadas
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[SoftwareController][getById] Error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      error: 'Error al obtener el software',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc Crear nuevo software
 * @route POST /api/software
 * @access Privado/Admin
 */
exports.create = async (req, res) => {
  try {
    const { nombre, tipo, version, descripcion, licencias } = req.body;

    // Validación básica
    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre es requerido'
      });
    }

    const result = await Software.create({
      nombre,
      tipo: tipo || null,
      version: version || null,
      descripcion: descripcion || null,
      licencias: licencias || []
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.softwareId,
        licencias_creadas: result.licenciasCount
      }
    });
  } catch (error) {
    console.error('[SoftwareController][create] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el software'
    });
  }
};

/**
 * @desc Actualizar software
 * @route PUT /api/software/:id
 * @access Privado/Admin
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, version, descripcion } = req.body;

    const updated = await Software.update(id, {
      nombre,
      tipo: tipo || null,
      version: version || null,
      descripcion: descripcion || null
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Software no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('[SoftwareController][update] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el software'
    });
  }
};

/**
 * @desc Eliminar software
 * @route DELETE /api/software/:id
 * @access Privado/Admin
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Software.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Software no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('[SoftwareController][delete] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el software'
    });
  }
};

/**
 * @desc Obtener estadísticas de software
 * @route GET /api/software/estadisticas
 * @access Público
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await Software.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[SoftwareController][getStats] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};