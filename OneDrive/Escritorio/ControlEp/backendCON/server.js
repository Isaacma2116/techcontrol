require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Aquí importamos solo pool, no connection
const { pool, connectDB } = require('./src/config/database');

const app = express();

// --------- CORS para APIs ---------
const corsOrigin =
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Seguridad y logs
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------- CORS para archivos estáticos ---------
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    // Permite preflight
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// --------- Rutas ---------
const authRoutes = require('./src/routes/auth.routes');
const colaboradorRoutes = require('./src/routes/colaborador.routes');
const equipoRoutes = require('./src/routes/equipo.routes');
const mantenimientosRoutes = require('./src/routes/mantenimientos');
const auxiliaresRoutes = require('./src/routes/auxiliares');
const equiposPersonalizacionRoutes = require('./src/routes/equiposPersonalizacion.routes');
const softwareRoutes = require('./src/routes/software.routes');
const licenciaRoutes = require('./src/routes/licencia.routes');

app.use('/api/software', softwareRoutes);
app.use('/api/licencias', licenciaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/colaboradores', colaboradorRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/auxiliares', auxiliaresRoutes);
app.use('/api/equipos-personalizacion', equiposPersonalizacionRoutes);

// --------- Health Check ---------
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      message: 'API funcionando correctamente'
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

// --------- Errores globales ---------
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// --------- Inicio del servidor ---------
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectDB(); // Hace el test de conexión al iniciar
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🔗 Frontend: ${corsOrigin}`);
  console.log('📁 Archivos estáticos en:', path.join(__dirname, 'uploads'));
  console.log('🖼️  Archivos de equipos en:', path.join(__dirname, 'uploads/equipos'));
});