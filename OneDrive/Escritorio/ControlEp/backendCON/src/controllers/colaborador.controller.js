const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Convertir funciones de filesystem a promesas
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

// Helper para eliminar archivos de imagen
const deleteImage = async (imagePath) => {
  try {
    const exists = await existsAsync(imagePath);
    if (exists) {
      await unlinkAsync(imagePath);
      console.log(`Imagen eliminada: ${imagePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error eliminando imagen ${imagePath}:`, error);
    return false;
  }
};

module.exports = {
  // Crear nuevo colaborador
  create: async (req, res) => {
    let fileToDelete = null;
    let connection;
    
    try {
      console.log('Body recibido:', req.body);
      console.log('Archivo recibido:', req.file);

      const { nombre, email, telefono, departamento } = req.body;
      const user_id = req.user.id; // Obtiene el ID del usuario autenticado
      
      // Validación básica mejorada
      if (!nombre || !nombre.trim()) {
        throw new Error('El nombre es requerido');
      }

      if (!email || !email.trim()) {
        throw new Error('El email es requerido');
      }

      if (!user_id) {
        throw new Error('Usuario no autenticado');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido');
      }

      // Obtener conexión del pool
      connection = await pool.getConnection();

      // Verificar que el usuario exista
      const [userExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [user_id]
      );
      
      if (userExists.length === 0) {
        throw new Error('El usuario autenticado no existe en la base de datos');
      }

      // Verificar email único
      const [rows] = await connection.execute(
        'SELECT id FROM colaboradores WHERE email = ?', 
        [email.toLowerCase().trim()]
      );
      
      if (rows.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Preparar ruta de la imagen si existe
      let fotoPath = null;
      if (req.file) {
        fileToDelete = path.join(__dirname, '../uploads/colaboradores', req.file.filename);
        fotoPath = `/colaboradores/${req.file.filename}`;
      }

      // Insertar nuevo colaborador
      const [result] = await connection.execute(
        `INSERT INTO colaboradores 
        (user_id, nombre, email, telefono, departamento, foto, creado_en, actualizado_en) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user_id,
          nombre.trim(),
          email.toLowerCase().trim(),
          telefono ? telefono.trim() : null,
          departamento ? departamento.trim() : null,
          fotoPath
        ]
      );

      console.log('Colaborador guardado, ID:', result.insertId);
      
      // Obtener el colaborador recién creado
      const [newColab] = await connection.execute(
        'SELECT * FROM colaboradores WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: newColab[0]
      });
    } catch (error) {
      console.error('Error en create:', error);
      
      // Limpieza de archivos en caso de error
      if (fileToDelete) {
        await deleteImage(fileToDelete);
      }
      
      // Determinar código de estado adecuado
      const statusCode = error.message.includes('requerido') || 
                        error.message.includes('registrado') || 
                        error.message.includes('inválido') || 
                        error.message.includes('no existe') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Obtener todos los colaboradores (con paginación y filtros) - VERSIÓN CORREGIDA
  // Obtener todos los colaboradores (con paginación y filtros) - VERSIÓN FINAL CORREGIDA
findAll: async (req, res) => {
    let connection;
    try {
        // Convertir a números enteros explícitamente y validar
        const page = Math.max(1, parseInt(req.query.page, 10)) || 1;
        const limit = Math.max(1, parseInt(req.query.limit, 10)) || 10;
        const offset = (page - 1) * limit;

        // Construir query base
        let query = `
            SELECT c.*, u.nombre as user_nombre, u.correo as user_correo 
            FROM colaboradores c
            LEFT JOIN users u ON c.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) AS total FROM colaboradores c';
        const params = [];
        const whereClauses = [];
        
        // Filtros
        if (req.query.departamento) {
            whereClauses.push('c.departamento LIKE ?');
            params.push(`%${req.query.departamento}%`);
        }
        
        if (req.query.search) {
            whereClauses.push('(c.nombre LIKE ? OR c.email LIKE ? OR u.nombre LIKE ?)');
            params.push(`%${req.query.search}%`);
            params.push(`%${req.query.search}%`);
            params.push(`%${req.query.search}%`);
        }
        
        // Aplicar WHERE si hay filtros
        if (whereClauses.length > 0) {
            const where = ' WHERE ' + whereClauses.join(' AND ');
            query += where;
            countQuery += where;
        }
        
        // Ordenación y paginación
        query += ' ORDER BY c.creado_en DESC LIMIT ? OFFSET ?';
        
        connection = await pool.getConnection();
        
        // IMPORTANTE: Crear un nuevo array de parámetros para la consulta principal
        const queryParams = [...params];
        
        // Asegurarse de que LIMIT y OFFSET sean números
        queryParams.push(limit.toString(), offset.toString());
        
        // Ejecutar consulta principal
        const [colaboradores] = await connection.execute(query, queryParams);
        
        // Ejecutar consulta de conteo (sin LIMIT/OFFSET)
        const [[total]] = await connection.execute(countQuery, params);
        
        res.json({
            success: true,
            data: colaboradores,
            pagination: {
                total: total.total,
                page,
                pages: Math.ceil(total.total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error en findAll:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener colaboradores',
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                stack: error.stack 
            })
        });
    } finally {
        if (connection) connection.release();
    }
},

  // Obtener un colaborador por ID
  findOne: async (req, res) => {
    let connection;
    try {
      // Validar ID (debe ser número para MySQL)
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT c.*, u.nombre as user_nombre, u.correo as user_correo 
         FROM colaboradores c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Colaborador no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error en findOne:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener colaborador',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Actualizar colaborador
  update: async (req, res) => {
    let fileToDelete = null;
    let oldImagePath = null;
    let connection;
    
    try {
      // Validar ID
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error('ID inválido');
      }

      connection = await pool.getConnection();
      
      // Obtener colaborador actual
      const [rows] = await connection.execute(
        'SELECT * FROM colaboradores WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error('Colaborador no encontrado');
      }

      const colaborador = rows[0];
      let fotoPath = colaborador.foto;

      // Manejo de la imagen
      if (req.file) {
        fileToDelete = path.join(__dirname, '../uploads/colaboradores', req.file.filename);
        if (colaborador.foto) {
          oldImagePath = path.join(__dirname, '../public', colaborador.foto);
        }
        fotoPath = `/colaboradores/${req.file.filename}`;
      }

      // Validar email si se está actualizando
      if (req.body.email && req.body.email !== colaborador.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
          throw new Error('Formato de email inválido');
        }

        const [existing] = await connection.execute(
          'SELECT id FROM colaboradores WHERE email = ? AND id != ?',
          [req.body.email.toLowerCase().trim(), id]
        );
        
        if (existing.length > 0) {
          throw new Error('El email ya está registrado');
        }
      }

      // Construir consulta de actualización
      const updates = {
        nombre: req.body.nombre ? req.body.nombre.trim() : colaborador.nombre,
        email: req.body.email ? req.body.email.toLowerCase().trim() : colaborador.email,
        telefono: req.body.telefono ? req.body.telefono.trim() : colaborador.telefono,
        departamento: req.body.departamento ? req.body.departamento.trim() : colaborador.departamento,
        foto: fotoPath,
        actualizado_en: new Date()
      };

      await connection.execute(
        `UPDATE colaboradores SET 
          nombre = ?, 
          email = ?, 
          telefono = ?, 
          departamento = ?, 
          foto = ?, 
          actualizado_en = ? 
        WHERE id = ?`,
        [
          updates.nombre,
          updates.email,
          updates.telefono,
          updates.departamento,
          updates.foto,
          updates.actualizado_en,
          id
        ]
      );

      // Eliminar imagen anterior si se subió una nueva
      if (oldImagePath) {
        await deleteImage(oldImagePath);
      }

      // Obtener el colaborador actualizado
      const [updated] = await connection.execute(
        'SELECT * FROM colaboradores WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        data: updated[0]
      });
    } catch (error) {
      console.error('Error en update:', error);
      
      // Limpieza de archivos en caso de error
      if (fileToDelete) {
        await deleteImage(fileToDelete);
      }
      
      const statusCode = error.message.includes('ID inválido') ? 400 : 
                        error.message.includes('no encontrado') ? 404 : 
                        error.message.includes('registrado') || 
                        error.message.includes('inválido') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Eliminar colaborador
  delete: async (req, res) => {
    let connection;
    try {
      // Validar ID
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      connection = await pool.getConnection();
      
      // Obtener colaborador para eliminar su imagen
      const [rows] = await connection.execute(
        'SELECT * FROM colaboradores WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Colaborador no encontrado'
        });
      }

      const colaborador = rows[0];

      // Eliminar imagen asociada si existe
      if (colaborador.foto) {
        const imagePath = path.join(__dirname, '../public', colaborador.foto);
        await deleteImage(imagePath);
      }

      // Eliminar de la base de datos
      await connection.execute(
        'DELETE FROM colaboradores WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Colaborador eliminado correctamente',
        data: {
          id: colaborador.id,
          nombre: colaborador.nombre
        }
      });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar colaborador',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    } finally {
      if (connection) connection.release();
    }
  }
};