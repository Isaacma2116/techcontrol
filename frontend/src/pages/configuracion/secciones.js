import {
  AlertTriangle, Bell, Building2, Database, FileSignature, Info,
  Palette, ScrollText, ShieldCheck, User, Users,
} from 'lucide-react';

/**
 * Secciones de Configuracion. Agregar una seccion = agregar una entrada aqui + su ruta en App.jsx.
 *  - grupo:         'cuenta' (todos, personal) | 'organizacion' (solo admin, GLOBAL) | 'informacion' (todos, de solo lectura) | 'peligro'
 *  - proximamente:  todavia no disponible; muestra lo que incluira (`incluye`)
 *
 * La separacion "personal vs. global" no es solo visual: coincide con quien
 * puede escribir cada cosa. 'cuenta' cambia SOLO la cuenta de quien la edita
 * (backend: /api/perfil/*); 'organizacion' cambia algo que ven TODOS los
 * usuarios (backend: /api/empresa/*, /api/datos/*, /api/colaboradores/importar),
 * por eso son las unicas que exigen rol admin.
 */
export const GRUPOS = [
  { id: 'cuenta', titulo: 'Mi cuenta' },
  { id: 'organizacion', titulo: 'Empresa / Administración', admin: true },
  { id: 'informacion', titulo: 'Información' },
  { id: 'peligro', titulo: null },
];

export const SECCIONES = [
  { id: 'perfil', grupo: 'cuenta', titulo: 'Mi perfil', icon: User, descripcion: 'Tus datos personales y tu fotografía.' },
  { id: 'apariencia', grupo: 'cuenta', titulo: 'Apariencia', icon: Palette, descripcion: 'Tema, color de acento y densidad.' },
  { id: 'notificaciones', grupo: 'cuenta', titulo: 'Notificaciones', icon: Bell, descripcion: 'Elige de qué quieres enterarte.' },
  { id: 'seguridad', grupo: 'cuenta', titulo: 'Privacidad y seguridad', icon: ShieldCheck, descripcion: 'Contraseña, sesiones abiertas y dos pasos.' },

  { id: 'empresa', grupo: 'organizacion', admin: true, titulo: 'Empresa', icon: Building2, descripcion: 'Nombre, logo y datos corporativos.' },
  { id: 'documentos', grupo: 'organizacion', admin: true, titulo: 'Documentos', icon: FileSignature, descripcion: 'Encabezado, pie, folios y textos de las cartas responsivas.' },
  { id: 'usuarios', grupo: 'organizacion', admin: true, titulo: 'Usuarios y permisos', icon: Users, descripcion: 'Quién puede entrar al sistema y qué puede hacer.' },
  { id: 'seguridad-organizacion', grupo: 'organizacion', admin: true, titulo: 'Configuración de seguridad', icon: ShieldCheck, descripcion: 'Políticas que aplican a todo el personal.' },
  { id: 'datos', grupo: 'organizacion', admin: true, titulo: 'Datos y respaldos', icon: Database, descripcion: 'Exportar información e importar colaboradores.' },

  { id: 'terminos', grupo: 'informacion', titulo: 'Términos y condiciones', icon: ScrollText, descripcion: 'Términos de uso vigentes.' },
  { id: 'acerca-de', grupo: 'informacion', titulo: 'Acerca del sistema', icon: Info, descripcion: 'Versión, tecnologías y soporte.' },

  {
    id: 'zona-peligrosa', grupo: 'peligro', titulo: 'Zona peligrosa', icon: AlertTriangle, danger: true,
    descripcion: 'Acciones que no se pueden deshacer fácilmente.',
  },
];

export const seccionesVisibles = (role) => SECCIONES.filter((s) => !s.admin || role === 'admin');
