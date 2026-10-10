import { Laptop, Mouse, Printer, Smartphone } from 'lucide-react';

/** Presentacion de los estados del inventario (el valor real viaja en minusculas). */
export const ESTADOS = {
  disponible: { label: 'Disponible', tone: 'blue' },
  asignado: { label: 'Asignado', tone: 'green' },
  mantenimiento: { label: 'Mantenimiento', tone: 'amber' },
  reparacion: { label: 'Reparación', tone: 'amber' },
  baja: { label: 'Baja', tone: 'slate' },
  perdido: { label: 'Perdido', tone: 'red' },
};

/** Estados que se pueden fijar a mano ("asignado" solo cambia al asignar/devolver). */
export const ESTADOS_MANUALES = ['disponible', 'mantenimiento', 'reparacion', 'baja', 'perdido'];

export const CONDICIONES = {
  bueno: 'Buen estado',
  regular: 'Estado regular',
  danado: 'Con daños',
  perdido: 'Extraviado',
};

export const ESTADOS_FISICOS = {
  excelente: 'Excelente',
  bueno: 'Bueno',
  regular: 'Regular',
  malo: 'Malo',
};

export const TIPOS_CONEXION = {
  usb: 'USB',
  red: 'Red (Ethernet)',
  wifi: 'Wi-Fi',
};

/**
 * Configuracion de cada tipo de inventario para las pantallas genericas.
 *  - el / del / este / o: genero gramatical para armar mensajes ("la impresora",
 *    "de la impresora", "asignad{a}").
 *  - catalog: catalogo de tipos (null = sin tipos; se oculta el filtro y la columna).
 *  - extraFilter: cuarto filtro del listado (colaborador | marca | ubicacion).
 *  - showMantenimiento: tarjeta "En mantenimiento" en el listado.
 *  - showUbicacion: columna y filtro de ubicacion fisica.
 *  - byMarca: la descripcion del listado es marca / modelo (si no, el titulo).
 */
export const KINDS = {
  equipos: {
    kind: 'equipos',
    singular: 'equipo',
    Singular: 'Equipo',
    plural: 'equipos',
    Plural: 'Equipos',
    el: 'el',
    del: 'del',
    este: 'este',
    o: 'o',
    basePath: '/equipos',
    catalog: 'tipos-equipo',
    idField: 'equipo_id',
    icon: Laptop,
    description: 'Inventario de equipos de cómputo y su responsable actual.',
    extraFilter: 'colaborador',
    showMantenimiento: true,
    showUbicacion: false,
    byMarca: true,
  },
  accesorios: {
    kind: 'accesorios',
    singular: 'accesorio',
    Singular: 'Accesorio',
    plural: 'accesorios',
    Plural: 'Accesorios',
    el: 'el',
    del: 'del',
    este: 'este',
    o: 'o',
    basePath: '/accesorios',
    catalog: 'tipos-accesorio',
    idField: 'accesorio_id',
    icon: Mouse,
    description: 'Periféricos y accesorios, con o sin número de serie.',
    extraFilter: 'marca',
    showMantenimiento: false,
    showUbicacion: false,
    byMarca: false,
  },
  impresoras: {
    kind: 'impresoras',
    singular: 'impresora',
    Singular: 'Impresora',
    plural: 'impresoras',
    Plural: 'Impresoras',
    el: 'la',
    del: 'de la',
    este: 'esta',
    o: 'a',
    basePath: '/impresoras',
    catalog: 'tipos-impresora',
    idField: 'impresora_id',
    icon: Printer,
    description: 'Impresoras, su ubicación física y quién las tiene a su cargo.',
    extraFilter: 'ubicacion',
    showMantenimiento: true,
    showUbicacion: true,
    byMarca: true,
  },
  celulares: {
    kind: 'celulares',
    singular: 'celular',
    Singular: 'Celular',
    plural: 'celulares',
    Plural: 'Celulares',
    el: 'el',
    del: 'del',
    este: 'este',
    o: 'o',
    basePath: '/celulares',
    catalog: null,
    idField: 'celular_id',
    icon: Smartphone,
    description: 'Teléfonos móviles corporativos y su responsable actual.',
    extraFilter: 'colaborador',
    showMantenimiento: true,
    showUbicacion: false,
    byMarca: true,
  },
};
