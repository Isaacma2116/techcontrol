const Equipo = require('../models/equipo.model');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Función para normalizar los datos del equipo
const normalizeEquipo = (equipo) => {
  // Si el equipo es null o undefined, retornar null
  if (!equipo) return null;

  return {
    id: Number(equipo.id),
    nombre: equipo.nombre || `Equipo ${equipo.id}`,
    modelo: equipo.modelo || 'N/A',
    marca: equipo.marca || 'N/A',
    tipo: equipo.tipo || 'computo',
    estado: equipo.estado || 'activo',
    serial: equipo.serial || equipo.numero_serie || '',
    foto_equipo: equipo.foto_equipo || '',
    procesador: equipo.procesador || '',
    ram: equipo.ram || '',
    almacenamiento: equipo.almacenamiento || '',
    sistema_operativo: equipo.sistema_operativo || '',
    numero_serie: equipo.numero_serie || '',
    fecha_adquisicion: equipo.fecha_adquisicion 
      ? new Date(equipo.fecha_adquisicion).toISOString().split('T')[0]
      : null,
    observaciones: equipo.observaciones || '',
    colaborador_id: equipo.colaborador_id ? Number(equipo.colaborador_id) : null,
    colaborador_nombre: equipo.colaborador_nombre || null,
    user_id: equipo.user_id ? Number(equipo.user_id) : null,
    auxiliares: equipo.auxiliares ? (typeof equipo.auxiliares === 'string' 
      ? JSON.parse(equipo.auxiliares) 
      : equipo.auxiliares) 
    : []
  };
};

// Obtener todos los equipos con nombre de colaborador
exports.getAllEquipos = async (req, res) => {
  try {
    const [equipos] = await pool.execute(`
      SELECT 
        e.*, 
        c.nombre AS colaborador_nombre 
      FROM equipos e
      LEFT JOIN colaboradores c ON e.colaborador_id = c.id
      ORDER BY e.id DESC
    `);
    
    const normalized = (Array.isArray(equipos) ? equipos : [])
      .map(normalizeEquipo)
      .filter(equipo => equipo !== null);
    
    res.status(200).json(normalized);
  } catch (err) {
    console.error('[getAllEquipos] Error:', err);
    res.status(500).json({ 
      error: err.message || 'Error al obtener los equipos',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Obtener equipo por ID con nombre de colaborador
exports.getEquipoById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        e.*, 
        c.nombre AS colaborador_nombre 
      FROM equipos e
      LEFT JOIN colaboradores c ON e.colaborador_id = c.id
      WHERE e.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
        id: req.params.id
      });
    }
    
    const equipo = normalizeEquipo(rows[0]);
    if (!equipo) {
      return res.status(500).json({ error: 'Error al normalizar los datos del equipo' });
    }
    
    res.json(equipo);
  } catch (err) {
    console.error('[getEquipoById] Error:', err);
    res.status(500).json({ 
      error: err.message || 'Error al obtener el equipo',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Crear un nuevo equipo
exports.createEquipo = async (req, res) => {
  try {
    const foto_equipo = req.file 
      ? '/uploads/equipos/' + req.file.filename 
      : null;

    const data = {
      ...req.body,
      foto_equipo,
      colaborador_id: req.body.colaborador_id && !isNaN(Number(req.body.colaborador_id))
        ? Number(req.body.colaborador_id)
        : null,
      user_id: req.user?.id || null
    };

    // Validación básica
    if (!data.nombre || !data.marca || !data.modelo) {
      if (req.file) {
        // Eliminar la imagen subida si hay error de validación
        fs.unlinkSync(path.join(__dirname, '../public', req.file.path));
      }
      return res.status(400).json({ 
        error: 'Nombre, marca y modelo son campos requeridos' 
      });
    }

    const equipo = await Equipo.create(data);
    const normalized = normalizeEquipo(equipo);
    
    res.status(201).json(normalized);
  } catch (err) {
    console.error('[createEquipo] Error:', err);
    if (req.file) {
      // Eliminar la imagen subida si hay error
      fs.unlinkSync(path.join(__dirname, '../public', req.file.path));
    }
    res.status(500).json({ 
      error: err.message || 'Error al crear el equipo',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Actualizar equipo
exports.updateEquipo = async (req, res) => {
  try {
    let data = { ...req.body };
    
    // Manejo de la imagen
    if (req.file) {
      data.foto_equipo = '/uploads/equipos/' + req.file.filename;
      
      // Obtener la imagen anterior para eliminarla después
      const [oldEquipo] = await pool.execute(
        'SELECT foto_equipo FROM equipos WHERE id = ?', 
        [req.params.id]
      );
      
      if (oldEquipo[0]?.foto_equipo) {
        const oldPath = path.join(__dirname, '../public', oldEquipo[0].foto_equipo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Conversión de tipos
    if ('colaborador_id' in data) {
      data.colaborador_id = data.colaborador_id && !isNaN(Number(data.colaborador_id)) 
        ? Number(data.colaborador_id) 
        : null;
    }

    // Actualizar el equipo
    const updated = await Equipo.updatePartial(req.params.id, data);
    if (!updated) {
      if (req.file) {
        // Eliminar la imagen subida si el equipo no existe
        fs.unlinkSync(path.join(__dirname, '../public', req.file.path));
      }
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
        id: req.params.id
      });
    }

    // Obtener el equipo actualizado con datos normalizados
    const [rows] = await pool.execute(`
      SELECT 
        e.*, 
        c.nombre AS colaborador_nombre 
      FROM equipos e
      LEFT JOIN colaboradores c ON e.colaborador_id = c.id
      WHERE e.id = ?
    `, [req.params.id]);
    
    const normalized = normalizeEquipo(rows[0]);
    if (!normalized) {
      return res.status(500).json({ error: 'Error al normalizar los datos del equipo' });
    }
    
    res.json(normalized);
  } catch (err) {
    console.error('[updateEquipo] Error:', err);
    if (req.file) {
      // Eliminar la imagen subida si hay error
      fs.unlinkSync(path.join(__dirname, '../public', req.file.path));
    }
    res.status(500).json({ 
      error: err.message || 'Error al actualizar el equipo',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Eliminar equipo
exports.deleteEquipo = async (req, res) => {
  try {
    // Obtener el equipo primero para eliminar la imagen asociada
    const [equipo] = await pool.execute(
      'SELECT foto_equipo FROM equipos WHERE id = ?', 
      [req.params.id]
    );
    
    const deleted = await Equipo.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
        id: req.params.id
      });
    }
    
    // Eliminar la imagen asociada si existe
    if (equipo[0]?.foto_equipo) {
      const imagePath = path.join(__dirname, '../public', equipo[0].foto_equipo);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ 
      message: 'Equipo eliminado correctamente',
      id: req.params.id
    });
  } catch (err) {
    console.error('[deleteEquipo] Error:', err);
    res.status(500).json({ 
      error: err.message || 'Error al eliminar el equipo',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Buscar equipos por término de búsqueda
exports.searchEquipos = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'El término de búsqueda debe tener al menos 2 caracteres' 
      });
    }
    
    const [equipos] = await pool.execute(`
      SELECT 
        e.*, 
        c.nombre AS colaborador_nombre 
      FROM equipos e
      LEFT JOIN colaboradores c ON e.colaborador_id = c.id
      WHERE 
        e.nombre LIKE ? OR
        e.modelo LIKE ? OR
        e.marca LIKE ? OR
        e.numero_serie LIKE ? OR
        e.sistema_operativo LIKE ? OR
        c.nombre LIKE ?
      ORDER BY e.id DESC
      LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
    
    const normalized = (Array.isArray(equipos) ? equipos : [])
      .map(normalizeEquipo)
      .filter(equipo => equipo !== null);
    
    res.json(normalized);
  } catch (err) {
    console.error('[searchEquipos] Error:', err);
    res.status(500).json({ 
      error: err.message || 'Error en la búsqueda de equipos',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};