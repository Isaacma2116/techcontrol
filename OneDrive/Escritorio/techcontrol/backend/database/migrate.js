/**
 * Ejecuta las migraciones de database/migrations/*.sql en orden y
 * registra cuales ya se aplicaron en la tabla schema_migrations,
 * de modo que correrlo varias veces es seguro.
 * Uso: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  // Conexion propia (no el pool) porque cada archivo trae varias sentencias.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name       VARCHAR(190) PRIMARY KEY,
       applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB`
  );

  const [rows] = await conn.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    console.log(`Aplicando ${file} ...`);
    await conn.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    count++;
  }

  console.log(count ? `Listo: ${count} migracion(es) aplicada(s).` : 'Base de datos al dia.');
  await conn.end();
}

migrate().catch((err) => {
  console.error('Error en la migracion:', err.message);
  process.exit(1);
});
