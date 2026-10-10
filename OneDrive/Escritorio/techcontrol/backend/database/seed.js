/**
 * Script de siembra: crea el usuario administrador inicial.
 * Uso: npm run seed
 *
 * No se hardcodea ninguna contrasenia ni hash: se generan a partir
 * de las variables de entorno SEED_ADMIN_* definidas en .env
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const email = process.env.SEED_ADMIN_EMAIL;
  const plainPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !plainPassword) {
    console.error('Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en tu .env');
    process.exit(1);
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = :email OR username = :username',
    { email, username }
  );

  if (existing.length > 0) {
    console.log(`Ya existe un usuario con ese correo o nombre de usuario. No se creo ninguno nuevo.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  await pool.query(
    `INSERT INTO users (name, nombres, username, email, password_hash, role, active, password_changed_at)
     VALUES (:name, :name, :username, :email, :passwordHash, 'admin', 1, NOW())`,
    { name, username, email, passwordHash }
  );

  console.log('Usuario administrador creado correctamente:');
  console.log(`  Usuario:     ${username}`);
  console.log(`  Correo:      ${email}`);
  console.log(`  Contrasenia: (la definida en SEED_ADMIN_PASSWORD)`);
  console.log('Recuerda cambiarla despues del primer inicio de sesion.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error al ejecutar el seed:', err);
  process.exit(1);
});
