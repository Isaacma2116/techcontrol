const ExcelJS = require('exceljs');

/**
 * Ayudantes genericos para exportar/importar Excel (reutiliza `exceljs`, ya
 * usado por Reportes — nada de librerias nuevas). Nada de este archivo sabe
 * de colaboradores/equipos/etc.: cada modulo define sus propias columnas.
 */

/** Hoja simple: encabezados en negrita + una fila por objeto de `rows`. */
function agregarHoja(workbook, nombre, columnas, rows) {
  const hoja = workbook.addWorksheet(nombre);
  hoja.columns = columnas.map((c) => ({ header: c.header, key: c.key, width: c.width || 22 }));
  hoja.getRow(1).font = { bold: true };
  for (const row of rows) hoja.addRow(row);
  return hoja;
}

/** Arma un libro con una sola hoja y lo devuelve como Buffer (.xlsx). */
async function libroDeUnaHoja(nombre, columnas, rows) {
  const workbook = new ExcelJS.Workbook();
  agregarHoja(workbook, nombre, columnas, rows);
  return workbook.xlsx.writeBuffer();
}

/**
 * Lee la PRIMERA hoja de un .xlsx (Buffer) como lista de objetos, mapeando
 * cada columna por POSICION contra `columnas` (el mismo arreglo con el que se
 * genero la plantilla, ver `agregarHoja`/`libroDeUnaHoja`) — NO por el texto
 * del encabezado: los encabezados son para la persona que llena el archivo
 * ("Área (nombre exacto)"), no un identificador estable para parsear. Se
 * salta la fila 1 (encabezado) y asume que las columnas no se reordenaron.
 */
async function leerHojaComoObjetos(buffer, columnas) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const hoja = workbook.worksheets[0];
  if (!hoja) return [];

  const filas = [];
  hoja.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // encabezado
    const valores = row.values; // 1-indexado, [0] vacio
    const vacia = !valores || valores.every((v) => v === null || v === undefined || v === '');
    if (vacia) return;

    const obj = { _fila: rowNumber };
    columnas.forEach((col, i) => {
      const raw = valores[i + 1]; // columnas[0] -> celda 1
      obj[col.key] = raw && typeof raw === 'object' && 'text' in raw ? raw.text : raw; // celdas con formato/formula
    });
    filas.push(obj);
  });
  return filas;
}

module.exports = { agregarHoja, libroDeUnaHoja, leerHojaComoObjetos };
