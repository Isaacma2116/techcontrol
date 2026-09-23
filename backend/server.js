require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const colaboradorRoutes = require('./routes/colaboradorRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const { makeInventarioRouter } = require('./routes/inventarioRoutes');
const asignacionRoutes = require('./routes/asignacionRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const cartaRoutes = require('./routes/cartaRoutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const softwareRoutes = require('./routes/softwareRoutes');
const licenciaRoutes = require('./routes/licenciaRoutes');
const redRoutes = require('./routes/redRoutes');
const dispositivoRedRoutes = require('./routes/dispositivoRedRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const datosRoutes = require('./routes/datosRoutes');
const terminosRoutes = require('./routes/terminosRoutes');
const { protect } = require('./middleware/authMiddleware');
const { authorize } = require('./middleware/roleMiddleware');
const { UPLOADS_ROOT } = require('./middleware/uploadMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --- Seguridad y utilidades basicas ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // necesario para que el navegador envie la cookie
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- Rutas ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'TechControl API operativa.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/colaboradores', colaboradorRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/equipos', makeInventarioRouter('equipos'));
app.use('/api/accesorios', makeInventarioRouter('accesorios'));
app.use('/api/impresoras', makeInventarioRouter('impresoras'));
app.use('/api/celulares', makeInventarioRouter('celulares'));
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/cartas-responsivas', cartaRoutes);
app.use('/api/mantenimientos', mantenimientoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/licencias', licenciaRoutes);
app.use('/api/redes', redRoutes);
app.use('/api/dispositivos-red', dispositivoRedRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/datos', datosRoutes);
app.use('/api/terminos', terminosRoutes);

// Imagenes: se sirven solo con sesion valida. helmet marca los recursos como
// same-origin; el <img> del frontend vive en otro origen (puerto), asi que se
// permite explicitamente para estos archivos.
//  - colaboradores: datos personales -> solo admin/tecnico.
//  - equipos/accesorios/impresoras/celulares: cualquier usuario autenticado (igual que el inventario).
const serveUploads = (subdir, ...guards) =>
  app.use(
    `/api/uploads/${subdir}`,
    protect,
    ...guards,
    express.static(path.join(UPLOADS_ROOT, subdir), {
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    })
  );
serveUploads('colaboradores', authorize('admin', 'technician'));
serveUploads('equipos');
serveUploads('accesorios');
serveUploads('usuarios'); // fotos de perfil: cualquier usuario con sesion
serveUploads('impresoras');
serveUploads('celulares');
serveUploads('dispositivos-red');

// --- Manejo de errores (siempre al final) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`[TechControl API] Escuchando en http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
