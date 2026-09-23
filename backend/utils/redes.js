/**
 * Definiciones compartidas del modulo de Redes y Dispositivos de Red.
 */

const TIPOS_RED = ['wifi', 'lan', 'vlan', 'invitados', 'servidores', 'otra'];
const ESTADOS_RED = ['activa', 'inactiva'];
const SEGURIDAD_WIFI = ['wpa2', 'wpa3', 'wpa2_enterprise', 'wep', 'abierta', 'otra'];

const TIPOS_DISPOSITIVO = [
  'router', 'switch', 'access_point', 'firewall', 'repetidor', 'antena',
  'modem', 'controlador_wifi', 'servidor_red', 'otro',
];
const ESTADOS_DISPOSITIVO = ['activo', 'inactivo', 'mantenimiento', 'baja'];

const CODIGO_PREFIJO = 'NET';

module.exports = {
  TIPOS_RED, ESTADOS_RED, SEGURIDAD_WIFI, TIPOS_DISPOSITIVO, ESTADOS_DISPOSITIVO, CODIGO_PREFIJO,
};
