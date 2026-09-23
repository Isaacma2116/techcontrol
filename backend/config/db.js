const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones: evita abrir/cerrar una conexion por request
// y usa "prepared statements" via pool.execute()/query() con placeholders,
// lo que protege contra inyeccion SQL.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Conexion a MySQL establecida correctamente.');
  } catch (err) {
    console.error('[DB] No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
