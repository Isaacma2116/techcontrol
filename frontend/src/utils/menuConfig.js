/**
 * Configuracion centralizada del menu lateral.
 * Agregar/quitar un modulo despues es tan simple como
 * agregar/quitar una entrada aqui - no hay que tocar el
 * componente Sidebar.
 *
 * `roles`: si se omite, el item es visible para todos los roles.
 */
export const menuSections = [
  {
    title: 'Principal',
    items: [{ label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' }],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Equipos', icon: 'Laptop', path: '/equipos' },
      { label: 'Accesorios', icon: 'Mouse', path: '/accesorios' },
      { label: 'Monitores', icon: 'Monitor', path: '/monitores' },
      { label: 'Impresoras', icon: 'Printer', path: '/impresoras' },
      { label: 'Celulares', icon: 'Smartphone', path: '/celulares' },
      { label: 'Redes y dispositivos', icon: 'Network', path: '/redes', roles: ['admin', 'technician'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      {
        label: 'Colaboradores',
        icon: 'Users',
        path: '/colaboradores',
        roles: ['admin', 'technician'],
      },
      {
        label: 'Cartas Responsivas',
        icon: 'FileSignature',
        path: '/cartas-responsivas',
        roles: ['admin', 'technician'],
      },
    ],
  },
  {
    title: 'Software',
    items: [
      { label: 'Software', icon: 'Package', path: '/software' },
      { label: 'Licencias', icon: 'KeyRound', path: '/licencias', roles: ['admin', 'technician'] },
    ],
  },
  {
    title: 'Servicios',
    items: [
      { label: 'Mantenimientos', icon: 'Wrench', path: '/mantenimientos' },
    ],
  },
  {
    title: 'Reportes',
    items: [{ label: 'Reportes', icon: 'BarChart3', path: '/reportes', roles: ['admin', 'technician'] }],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Configuración',
        icon: 'Settings',
        path: '/configuracion',
      },
    ],
  },
];

export function getVisibleMenu(role) {
  return menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

export const roleLabels = {
  admin: 'Administrador',
  technician: 'Técnico TI',
  viewer: 'Consulta',
};
