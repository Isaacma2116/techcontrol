const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');

/**
 * PDF del "Reporte general" (Reportes y Analisis). Mismo motor que las cartas
 * responsivas (pdfmake, 100% Node), en un archivo aparte para no tocar
 * utils/cartaPdf.js: cada uno carga sus fuentes al arrancar, de forma
 * independiente (llamarlo dos veces con los mismos bytes no causa error).
 */

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);

const FONTS_DIR = path.join(__dirname, '..', 'node_modules', 'pdfmake', 'build', 'fonts', 'Roboto');
const FONT_FILES = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-MediumItalic.ttf',
};
for (const file of Object.values(FONT_FILES)) {
  pdfmake.virtualfs.writeFileSync(file, fs.readFileSync(path.join(FONTS_DIR, file)));
}
pdfmake.addFonts({ Roboto: FONT_FILES });

const COLOR = { brand: '#0B1F3A', text: '#1f2937', muted: '#6b7280', line: '#cbd5e1', label: '#f1f5f9' };
const PAGE_WIDTH = 595.28 - 80;

const sectionTitle = (title) => ({
  table: { widths: ['*'], body: [[{ text: title, color: '#ffffff', bold: true, fontSize: 9, characterSpacing: 0.5, margin: [6, 3, 6, 3] }]] },
  layout: { fillColor: () => COLOR.brand, hLineWidth: () => 0, vLineWidth: () => 0 },
  margin: [0, 14, 0, 0],
});

/** Tabla simple: primera fila como encabezado con fondo, resto texto normal. */
function dataTable(headers, rows, widths) {
  return {
    table: {
      widths: widths || headers.map(() => '*'),
      body: [
        headers.map((h) => ({ text: h, bold: true, fontSize: 8.5, color: COLOR.muted, fillColor: COLOR.label })),
        ...rows.map((r) => r.map((v) => ({ text: v === null || v === undefined ? '—' : String(v), fontSize: 9.5, color: COLOR.text }))),
      ],
    },
    layout: {
      hLineColor: () => COLOR.line, vLineColor: () => COLOR.line, hLineWidth: () => 0.5, vLineWidth: () => 0.5,
      paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 6, paddingRight: () => 6,
    },
    margin: [0, 4, 0, 0],
  };
}

/** 4 tarjetas por fila (etiqueta + numero grande), igual espiritu que las StatCard del frontend. */
function statCards(items) {
  const fila = (grupo) => ({
    columns: grupo.map(({ label, value }) => ({
      width: '*',
      stack: [
        { text: String(value), bold: true, fontSize: 16, color: COLOR.brand },
        { text: label, fontSize: 8, color: COLOR.muted },
      ],
    })),
    columnGap: 10,
    margin: [0, 6, 0, 0],
  });
  const filas = [];
  for (let i = 0; i < items.length; i += 4) filas.push(fila(items.slice(i, i + 4)));
  return { stack: filas };
}

/**
 * Arma el documento del reporte general. `data` = lo que devuelve
 * reporteModel.dashboard(); `meta` = { empresaNombre, generadoPor, generadoEl, filtrosTexto }.
 */
function buildReporteGeneralDocDefinition(data, meta) {
  const { activos, activosPorTipo, activosPorDepartamento, activosPorUbicacion, garantias, mantenimientos, licencias, dispositivosRed } = data;

  const TIPO_LABEL = { equipos: 'Equipos', accesorios: 'Accesorios', impresoras: 'Impresoras', celulares: 'Celulares' };

  return {
    pageSize: 'A4',
    pageMargins: [40, 100, 40, 50],
    header: {
      margin: [40, 24, 40, 0],
      stack: [
        {
          columns: [
            { text: meta.empresaNombre || 'TechControl', bold: true, fontSize: 13, color: COLOR.brand },
            { text: 'Reporte general de inventario y activos', fontSize: 11, color: COLOR.text, alignment: 'right' },
          ],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: PAGE_WIDTH, y2: 8, lineWidth: 1.5, lineColor: COLOR.brand }] },
        {
          columns: [
            { text: `Generado el ${meta.generadoEl} por ${meta.generadoPor}`, fontSize: 8, color: COLOR.muted, margin: [0, 4, 0, 0] },
            { text: meta.filtrosTexto ? `Filtros: ${meta.filtrosTexto}` : 'Sin filtros aplicados', fontSize: 8, color: COLOR.muted, alignment: 'right', margin: [0, 4, 0, 0] },
          ],
        },
      ],
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      columns: [
        { text: 'Generado automáticamente por TechControl · información sujeta a cambios en tiempo real.', fontSize: 7, color: COLOR.muted },
        { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: COLOR.muted, alignment: 'right' },
      ],
    }),
    defaultStyle: { font: 'Roboto', fontSize: 10, color: COLOR.text },
    content: [
      sectionTitle('Resumen de activos'),
      statCards([
        { label: 'Total de activos', value: activos.total },
        { label: 'Asignados', value: activos.asignados },
        { label: 'Disponibles', value: activos.disponibles },
        { label: 'En mantenimiento', value: activos.en_mantenimiento },
        { label: 'Dados de baja', value: activos.de_baja },
        { label: 'Colaboradores', value: activos.colaboradores },
        { label: 'Licencias usadas', value: `${licencias.utilizadas} / ${licencias.total}` },
        { label: 'Dispositivos de red activos', value: dispositivosRed.resumen.activos },
      ]),

      sectionTitle('Activos por tipo'),
      dataTable(['Tipo', 'Total'], activosPorTipo.map((r) => [TIPO_LABEL[r.tipo] || r.tipo, r.total]), ['*', 80]),

      sectionTitle('Activos por departamento'),
      dataTable(['Departamento', 'Total'], activosPorDepartamento.map((r) => [r.departamento, r.total]), ['*', 80]),

      sectionTitle('Activos por ubicación (impresoras)'),
      activosPorUbicacion.length
        ? dataTable(['Ubicación', 'Total'], activosPorUbicacion.map((r) => [r.ubicacion, r.total]), ['*', 80])
        : { text: 'Sin datos para los filtros aplicados.', fontSize: 9, color: COLOR.muted, margin: [0, 4, 0, 0] },

      sectionTitle('Garantías'),
      statCards([
        { label: 'Vigentes', value: garantias.vigentes },
        { label: 'Por vencer', value: garantias.por_vencer },
        { label: 'Vencidas', value: garantias.vencidas },
        { label: 'Sin garantía registrada', value: garantias.sin_garantia },
      ]),

      sectionTitle('Mantenimientos'),
      statCards([
        { label: 'Realizados', value: mantenimientos.realizados },
        { label: 'Pendientes', value: mantenimientos.pendientes },
        { label: 'Vencidos', value: mantenimientos.vencidos },
      ]),
      dataTable(
        ['Periodo', 'Preventivos', 'Correctivos'],
        mantenimientos.porPeriodo.map((r) => [r.periodo, r.preventivos, r.correctivos]),
        ['*', 90, 90]
      ),

      sectionTitle('Dispositivos de red'),
      statCards([
        { label: 'Total', value: dispositivosRed.resumen.total },
        { label: 'Activos', value: dispositivosRed.resumen.activos },
        { label: 'Inactivos', value: dispositivosRed.resumen.inactivos },
        { label: 'En mantenimiento', value: dispositivosRed.resumen.en_mantenimiento },
      ]),
      dataTable(['Tipo', 'Total'], dispositivosRed.porTipo.map((r) => [r.tipo, r.total]), ['*', 80]),
    ],
  };
}

function renderReportePdf(data, meta) {
  const docDefinition = buildReporteGeneralDocDefinition(data, meta);
  docDefinition.info = { title: 'Reporte general de inventario y activos', author: meta.empresaNombre || 'TechControl', subject: 'Reporte' };
  return pdfmake.createPdf(docDefinition).getBuffer();
}

module.exports = { renderReportePdf };
