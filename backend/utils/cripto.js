const crypto = require('crypto');
const AppError = require('./AppError');

/**
 * Cifrado reversible (AES-256-GCM) para secretos que un usuario autorizado debe
 * poder RECUPERAR en claro (p. ej. una contraseña Wi-Fi que hay que darle a un
 * invitado). No es para contraseñas de acceso al sistema: esas siguen con hash
 * (bcrypt, ver utils/password.js) porque nunca hace falta leerlas de vuelta.
 *
 * La clave NO vive en la base ni en el código: sale de la variable de entorno
 * NETWORK_SECRET_KEY (32 bytes en base64). Si falta o no mide 32 bytes, cifrar
 * o descifrar falla con un error claro (no se cae todo el servidor: el resto
 * de la API sigue funcionando aunque esta variable no esté configurada).
 *
 * Formato guardado (Buffer, va directo a una columna VARBINARY):
 *   [12 bytes IV][16 bytes tag de autenticación][ciphertext]
 */

const ALGORITMO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function obtenerClave() {
  const b64 = process.env.NETWORK_SECRET_KEY;
  if (!b64) {
    throw new AppError(
      'El cifrado de contraseñas de red no está configurado (falta NETWORK_SECRET_KEY). Pide a un administrador que lo configure.',
      500
    );
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new AppError('NETWORK_SECRET_KEY debe ser una clave de 32 bytes en base64.', 500);
  }
  return key;
}

/** string -> Buffer cifrado (listo para guardar en una columna VARBINARY). */
function cifrar(texto) {
  const key = obtenerClave();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITMO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

/** Buffer cifrado -> string original. Lanza AppError 500 si la clave cambió o el dato esta dañado. */
function descifrar(buffer) {
  const key = obtenerClave();
  if (!Buffer.isBuffer(buffer) || buffer.length < IV_LEN + TAG_LEN) {
    throw new AppError('El dato cifrado no es válido.', 500);
  }
  const iv = buffer.subarray(0, IV_LEN);
  const tag = buffer.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buffer.subarray(IV_LEN + TAG_LEN);
  try {
    const decipher = crypto.createDecipheriv(ALGORITMO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new AppError('No se pudo descifrar el dato (la clave de cifrado pudo haber cambiado).', 500);
  }
}

module.exports = { cifrar, descifrar };
