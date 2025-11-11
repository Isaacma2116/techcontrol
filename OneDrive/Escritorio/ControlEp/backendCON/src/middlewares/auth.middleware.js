const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const auth = require('./auth.middleware');

module.exports = async (req, res, next) => {
  try {
    // 1. Obtener el token del header 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Acceso no autorizado. Token requerido.' 
      });
    }

    // 2. Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Buscar el usuario en la base de datos
    const [user] = await pool.query(
      'SELECT id, nombre, correo, rol FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // 4. Adjuntar el usuario a la solicitud
    req.user = user[0];
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: 'Token inválido o expirado' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error de autenticación' 
    });
  }
};