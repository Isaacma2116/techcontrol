import {
  Antenna, Cable, Cpu, Keyboard, Network, Radio, Router, Server, Shield, ShieldCheck, Wifi,
} from 'lucide-react';

export const TIPOS_RED = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  lan: { label: 'LAN', icon: Cable },
  vlan: { label: 'VLAN', icon: Network },
  invitados: { label: 'Red de invitados', icon: Wifi },
  servidores: { label: 'Servidores', icon: Server },
  otra: { label: 'Otra', icon: Network },
};

export const ESTADOS_RED = {
  activa: { label: 'Activa', tone: 'green' },
  inactiva: { label: 'Inactiva', tone: 'slate' },
};

export const SEGURIDAD_WIFI = {
  wpa2: 'WPA2',
  wpa3: 'WPA3',
  wpa2_enterprise: 'WPA2 Enterprise',
  wep: 'WEP',
  abierta: 'Abierta (sin contraseña)',
  otra: 'Otra',
};

export const TIPOS_DISPOSITIVO = {
  router: { label: 'Router', icon: Router },
  switch: { label: 'Switch', icon: Network },
  access_point: { label: 'Access Point', icon: Wifi },
  firewall: { label: 'Firewall', icon: ShieldCheck },
  repetidor: { label: 'Repetidor', icon: Radio },
  antena: { label: 'Antena', icon: Antenna },
  modem: { label: 'Módem', icon: Router },
  controlador_wifi: { label: 'Controlador Wi-Fi', icon: Cpu },
  servidor_red: { label: 'Servidor de red', icon: Server },
  otro: { label: 'Otro', icon: Keyboard },
};

export const ESTADOS_DISPOSITIVO = {
  activo: { label: 'Activo', tone: 'green' },
  inactivo: { label: 'Inactivo', tone: 'slate' },
  mantenimiento: { label: 'Mantenimiento', tone: 'amber' },
  baja: { label: 'Baja', tone: 'red', icon: Shield },
};

export const tipoRedIcon = (tipo) => (TIPOS_RED[tipo] || TIPOS_RED.otra).icon;
export const tipoDispositivoIcon = (tipo) => (TIPOS_DISPOSITIVO[tipo] || TIPOS_DISPOSITIVO.otro).icon;
