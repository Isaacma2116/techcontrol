/**
 * Permisos de TechControl.
 *
 * Extiende el sistema por ROLES que ya existe (admin / technician / viewer): cada
 * permiso lista los roles que lo tienen y refleja EXACTAMENTE lo que hoy permiten
 * las rutas (`authorize(...)`), asi que definirlo no cambia el comportamiento de nadie.
 *
 *  - Las rutas pueden usar `requirePermission('cartas.generar')` (middleware/roleMiddleware)
 *    en lugar de listar roles.
 *  - /api/auth/me devuelve la lista de permisos del usuario y el frontend la usa
 *    (useCan) para mostrar u ocultar acciones. El backend valida siempre.
 *  - Mas adelante esta tabla puede salir de la base de datos (roles / permisos) sin
 *    tocar las rutas: solo cambia el origen de PERMISOS.
 *
 * Los permisos "equipos.*" cubren todo el inventario (equipos, accesorios,
 * impresoras y celulares).
 */

const ALL = ['admin', 'technician', 'viewer'];
const STAFF = ['admin', 'technician'];
const ADMIN = ['admin'];

const PERMISOS = {
  'equipos.ver': ALL,
  'equipos.crear': STAFF,
  'equipos.editar': STAFF,
  'equipos.baja': STAFF,
  'equipos.asignar': STAFF,
  // La contrasena del equipo (Windows, BIOS...) se guarda cifrada; verla exige permiso aparte.
  'equipos.ver_contrasenas': ADMIN,

  'colaboradores.ver': STAFF,
  'colaboradores.crear': STAFF,
  'colaboradores.editar': STAFF,

  'mantenimientos.ver': ALL,
  'mantenimientos.programar': STAFF,
  'mantenimientos.realizar': STAFF,
  'mantenimientos.cancelar': STAFF,

  // El catalogo de software (que existe, si requiere licencia) lo ve cualquiera;
  // las licencias (costos, contratos, puestos) solo admin/tecnico.
  'software.ver': ALL,
  'software.gestionar': STAFF,
  'licencias.ver': STAFF,
  'licencias.gestionar': STAFF,
  'licencias.asignar': STAFF,
  'licencias.cancelar': ADMIN,
  'licencias.costos_ver': ADMIN,

  // Redes y dispositivos de red: informacion de infraestructura (IPs, gateways,
  // MACs), no apta para 'viewer'. La contrasena Wi-Fi exige un permiso aparte.
  'redes.ver': STAFF,
  'redes.ver_contrasenas': ADMIN,
  'redes.crear': STAFF,
  'redes.editar': STAFF,
  'redes.eliminar': ADMIN,
  'dispositivos_red.crear': STAFF,
  'dispositivos_red.editar': STAFF,
  'dispositivos_red.eliminar': ADMIN,

  // Reportes: cruza datos de colaboradores, licencias y redes (todos STAFF-only),
  // asi que el modulo completo queda al mismo nivel que ellos.
  'reportes.ver': STAFF,
  'reportes.exportar': STAFF,

  'cartas.ver': STAFF,
  'cartas.generar': STAFF,
  'cartas.subir_firmada': STAFF,
  'cartas.reemplazar_firmada': ADMIN,
  'cartas.cancelar_firmada': ADMIN,
  'documentos.descargar': STAFF,

  'usuarios.administrar': ADMIN,
  'empresa.configurar': ADMIN,
  'auditoria.ver': ADMIN,
};

const can = (role, permiso) => !!PERMISOS[permiso]?.includes(role);

const permissionsFor = (role) => Object.keys(PERMISOS).filter((p) => PERMISOS[p].includes(role));

/** Usuario listo para enviar al frontend: datos publicos + sus permisos. */
const withPermissions = (user) => (user ? { ...user, permissions: permissionsFor(user.role) } : user);

module.exports = { PERMISOS, can, permissionsFor, withPermissions };
