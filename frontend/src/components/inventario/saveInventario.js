/**
 * Flujo de guardado comun de Equipo y Accesorio:
 *  1) crea/actualiza los datos (si falla, se propaga el error al formulario);
 *  2) sube o quita la imagen. La imagen es un segundo paso: si falla, los
 *     datos YA quedaron guardados y solo se avisa (`imageFailure`).
 */
export async function saveInventario({ service, id, payload, image, hadImage }) {
  const res = id ? await service.update(id, payload) : await service.create(payload);
  let item = res.data.item;

  let imageFailure = '';
  try {
    if (image.file) {
      item = (await service.uploadImagen(item.id, image.file)).data.item;
    } else if (image.removed && hadImage) {
      item = (await service.deleteImagen(item.id)).data.item;
    }
  } catch (err) {
    imageFailure = err.message;
  }

  return { item, imageFailure };
}

/** Convierte los errores por campo del backend en un mapa { campo: mensaje }. */
export function fieldErrorsFrom(err) {
  return err.errors || {};
}
