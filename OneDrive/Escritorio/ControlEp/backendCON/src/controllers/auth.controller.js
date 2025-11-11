const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, rol: user.rol }, // Solo datos esenciales
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.register = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // Validación mejorada
    if (!nombre?.trim() || !correo?.trim() || !contrasena) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, correo y contraseña son requeridos' 
      });
    }

    if (!validateEmail(correo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de correo inválido' 
      });
    }

    if (contrasena.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }

    const id = await User.create({ nombre, correo, contrasena });
    const user = await User.findById(id);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { 
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    console.error('Error en auth/register:', error);
    
    if (error.code === 'DUPLICATE_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: error.message || 'El correo o nombre ya está en uso' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, contrasena } = req.body;

    if (!identifier?.trim() || !contrasena) {
      return res.status(400).json({ 
        success: false, 
        message: 'Correo/usuario y contraseña son requeridos' 
      });
    }

    const user = await User.findByEmailOrUsername(identifier);
    
    // Protección contra timing attacks
    if (!user) {
      await bcrypt.compare(contrasena, '$2a$10$fakehashforsecurity');
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    if (!(await bcrypt.compare(contrasena, user.contrasena))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    if (user.estado === 'inactivo') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cuenta inactiva. Contacte al administrador.' 
      });
    }

    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: { 
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    console.error('Error en auth/login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};