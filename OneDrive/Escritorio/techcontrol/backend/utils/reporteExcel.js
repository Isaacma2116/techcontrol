const ExcelJS = require('exceljs');

/**
 * Excel del "Reporte general" (Reportes y Analisis): una hoja de resumen y
 * una hoja por desglose, todas a partir de reporteModel.dashboard().
 */

const TIPO_LABEL = { equipos: 'Equipos', accesorios: 'Accesorios', impresoras: 'Impresoras', celulares: 'Celulares' };
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F3A' } };
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true };

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

function addTable(sheet, title, headers, rows) {
  const titleRow = sheet.addRow([title]);
  titleRow.font = { bold: true, size: 13 };
  sheet.addRow([]);
  styleHeader(sheet.addRow(headers));
  rows.forEach((r) => sheet.addRow(r));
  sheet.addRow([]);
  sheet.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: true }, (cell) => { max = Math.max(max, String(cell.value ?? '').length + 2); });
    col.width = Math.min(max, 45);
  });
}

/** `data` = reporteModel.dashboard(); `meta` = { empresaNombre, generadoPor, generadoEl, filtrosTexto }. */
async function renderReporteExcel(data, meta) {
  const { activos, activosPorTipo, activosPorDepartamento, activosPorUbicacion, garantias, mantenimientos, licencias, dispositivosRed } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = meta.generadoPor;
  workbook.created = new Date();

  const resumen = workbook.addWorksheet('Resumen');
  resumen.addRow([meta.empresaNombre || 'TechControl']).font = { bold: true, size: 14 };
  resumen.addRow(['Reporte general de inventario y activos']).font = { italic: true };
  resumen.addRow([`Generado el ${meta.generadoEl} por ${meta.generadoPor}`]);
  resumen.addRow([meta.filtrosTexto ? `Filtros: ${meta.filtrosTexto}` : 'Sin filtros aplicados']);
  resumen.addRow([]);
  addTable(resumen, 'Activos', ['Indicador', 'Valor'], [
    ['Total de activos', activos.total],
    ['Asignados', activos.asignados],
    ['Disponibles', activos.disponibles],
    ['En mantenimiento', activos.en_mantenimiento],
    ['Dados de baja', activos.de_baja],
    ['Colaboradores', activos.colaboradores],
  ]);
  addTable(resumen, 'Garantías', ['Indicador', 'Valor'], [
    ['Vigentes', garantias.vigentes],
    ['Por vencer', garantias.por_vencer],
    ['Vencidas', garantias.vencidas],
    ['Sin garantía registrada', garantias.sin_garantia],
  ]);
  addTable(resumen, 'Mantenimientos', ['Indicador', 'Valor'], [
    ['Realizados', mantenimientos.realizados],
    ['Pendientes', mantenimientos.pendientes],
    ['Vencidos', mantenimientos.vencidos],
  ]);
  addTable(resumen, 'Licencias', ['Indicador', 'Valor'], [
    ['Puestos totales', licencias.total],
    ['Utilizados', licencias.utilizadas],
    ['Disponibles', licencias.disponibles],
  ]);
  addTable(resumen, 'Dispositivos de red', ['Indicador', 'Valor'], [
    ['Total', dispositivosRed.resumen.total],
    ['Activos', dispositivosRed.resumen.activos],
    ['Inactivos', dispositivosRed.resumen.inactivos],
    ['En mantenimiento', dispositivosRed.resumen.en_mantenimiento],
    ['De baja', dispositivosRed.resumen.de_baja],
  ]);

  const hojaActivos = workbook.addWorksheet('Activos');
  addTable(hojaActivos, 'Activos por tipo', ['Tipo', 'Total'], activosPorTipo.map((r) => [TIPO_LABEL[r.tipo] || r.tipo, r.total]));
  addTable(hojaActivos, 'Activos por departamento', ['Departamento', 'Total'], activosPorDepartamento.map((r) => [r.departamento, r.total]));
  addTable(hojaActivos, 'Activos por ubicación (impresoras)', ['Ubicación', 'Total'], activosPorUbicacion.map((r) => [r.ubicacion, r.total]));

  const hojaMant = workbook.addWorksheet('Mantenimientos');
  addTable(hojaMant, 'Mantenimientos por periodo', ['Periodo', 'Preventivos', 'Correctivos'], mantenimientos.porPeriodo.map((r) => [r.periodo, r.preventivos, r.correctivos]));

  const hojaRed = workbook.addWorksheet('Dispositivos de red');
  addTable(hojaRed, 'Dispositivos por tipo', ['Tipo', 'Total'], dispositivosRed.porTipo.map((r) => [r.tipo, r.total]));

  return workbook.xlsx.writeBuffer();
}

module.exports = { renderReporteExcel };
