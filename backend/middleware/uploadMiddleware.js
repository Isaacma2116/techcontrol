const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

// /uploads se sirve como estatico (imagenes de inventario y fotos).
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
// /storage NUNCA se sirve como estatico: documentos sensibles (cartas firmadas, logo)
// que solo salen por endpoints con sesion y rol.
const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

const MB = 1024 * 1024;

// Firma real del archivo segun el tipo declarado (el mimetype lo declara el cliente y es falsificable).
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(PNG_SIGNATURE),
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  'application/pdf': (b) => b.toString('ascii', 0, 5) === '%PDF-',
};

// La extension la decidimos nosotros a partir del tipo, nunca la del cliente.
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function matchesSignature(filePath, mimetype) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const check = SIGNATURES[mimetype];
  return !!check && check(buf);
}

/**
 * Fabrica un cargador de archivos a una carpeta.
 *  - root/subdir: carpeta destino (UPLOADS_ROOT o STORAGE_ROOT)
 *  - field:       nombre del campo multipart
 *  - mimes:       tipos permitidos (de EXT_BY_MIME)
 *  - maxSize:     limite en bytes
 *  - messages:    { type, tooBig, failed, missing, invalid } textos de error 400
 *
 * Los archivos se guardan con nombre aleatorio (UUID) y extension decidida por el
 * servidor. `middleware` traduce los errores de multer a 400 legibles y verifica la
 * firma real del archivo. `remove` borra un archivo del disco; `filePath` da su ruta
 * absoluta (solo el nombre base: protege contra ../).
 */
function createFileUpload({ root, subdir, field, mimes, maxSize, messages }) {
  const dir = path.join(root, subdir);
  fs.mkdirSync(dir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`),
    }),
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!mimes.includes(file.mimetype)) return cb(new AppError(messages.type, 400));
      cb(null, true);
    },
  });

  function remove(filename) {
    if (!filename) return;
    fs.unlink(path.join(dir, path.basename(filename)), () => {});
  }

  const filePath = (filename) => path.join(dir, path.basename(filename));

  function middleware(req, res, next) {
    upload.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? messages.tooBig : messages.failed, 400));
      }
      if (err) return next(err);
      if (!req.file) return next(new AppError(messages.missing, 400));

      if (!matchesSignature(req.file.path, req.file.mimetype)) {
        remove(req.file.filename);
        return next(new AppError(messages.invalid, 400));
      }
      next();
    });
  }

  return { middleware, remove, filePath, dir };
}

/**
 * Cargador de imagenes (JPG, PNG, WEBP, max 2 MB) para una carpeta de /uploads.
 *  - noun: como se llama en los mensajes ("fotografía", "imagen")
 */
function createImageUpload(subdir, field, noun) {
  return createFileUpload({
    root: UPLOADS_ROOT,
    subdir,
    field,
    mimes: IMAGE_MIMES,
    maxSize: 2 * MB,
    messages: {
      type: `La ${noun} debe ser una imagen JPG, PNG o WEBP.`,
      tooBig: `La ${noun} no puede pesar más de 2 MB.`,
      failed: `No se pudo procesar la ${noun}.`,
      missing: `Selecciona una ${noun}.`,
      invalid: 'El archivo no es una imagen válida.',
    },
  });
}

const colaboradores = createImageUpload('colaboradores', 'foto', 'fotografía');

module.exports = {
  createFileUpload,
  createImageUpload,
  // API original (Colaboradores) sin cambios para quien ya la usa:
  uploadFoto: colaboradores.middleware,
  removeFoto: colaboradores.remove,
  // Equipos, accesorios, impresoras y celulares:
  imageUploads: {
    equipos: createImageUpload('equipos', 'imagen', 'imagen'),
    accesorios: createImageUpload('accesorios', 'imagen', 'imagen'),
    impresoras: createImageUpload('impresoras', 'imagen', 'imagen'),
    celulares: createImageUpload('celulares', 'imagen', 'imagen'),
    // Fotografia de perfil de los usuarios del sistema.
    usuarios: createImageUpload('usuarios', 'foto', 'fotografía'),
    'dispositivos-red': createImageUpload('dispositivos-red', 'imagen', 'imagen'),
  },
  // Documentos protegidos (fuera de /uploads):
  documentUploads: {
    // Carta firmada escaneada: PDF, JPG o PNG, max 10 MB.
    cartas: createFileUpload({
      root: STORAGE_ROOT,
      subdir: 'cartas',
      field: 'archivo',
      mimes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 10 * MB,
      messages: {
        type: 'El documento debe ser un PDF, JPG o PNG.',
        tooBig: 'El documento no puede pesar más de 10 MB.',
        failed: 'No se pudo procesar el documento.',
        missing: 'Selecciona el documento firmado.',
        invalid: 'El archivo no es un PDF o imagen válida.',
      },
    }),
    // Logo de la empresa: PNG o JPG, max 2 MB (SVG no: puede contener scripts).
    logo: createFileUpload({
      root: STORAGE_ROOT,
      subdir: 'empresa',
      field: 'logo',
      mimes: ['image/png', 'image/jpeg'],
      maxSize: 2 * MB,
      messages: {
        type: 'El logo debe ser una imagen PNG o JPG.',
        tooBig: 'El logo no puede pesar más de 2 MB.',
        failed: 'No se pudo procesar el logo.',
        missing: 'Selecciona el logo.',
        invalid: 'El archivo no es una imagen PNG o JPG válida.',
      },
    }),
  },
  UPLOADS_ROOT,
  STORAGE_ROOT,
};
