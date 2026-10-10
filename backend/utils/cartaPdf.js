const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');
const { PLANTILLAS, fechaLarga, fechaCorta, fillTemplate } = require('./cartas');

/**
 * Generador del PDF de la carta responsiva (pdfmake, 100% Node: sin navegador).
 *
 * UNA sola plantilla base para todos los tipos: solo cambia el subtitulo y la
 * tabla de datos de cada recurso (que viene ya resuelta de utils/cartas.js).
 * Las cartas con varios recursos repiten el bloque de datos por cada uno.
 */

// pdfmake no debe leer archivos locales ni descargar URLs: solo usamos imagenes en base64.
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);

const FONTS_DIR = path.join(__dirname, '..', 'node_modules', 'pdfmake', 'build', 'fonts', 'Roboto');
const FONT_FILES = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-MediumItalic.ttf',
};
// Las fuentes se cargan desde disco UNA vez al sistema de archivos virtual de pdfmake
// (asi no necesita acceso al disco durante el render).
for (const file of Object.values(FONT_FILES)) {
  pdfmake.virtualfs.writeFileSync(file, fs.readFileSync(path.join(FONTS_DIR, file)));
}
pdfmake.addFonts({ Roboto: FONT_FILES });

const COLOR = { brand: '#0B1F3A', text: '#1f2937', muted: '#6b7280', line: '#cbd5e1', label: '#f1f5f9' };
const PAGE_WIDTH = 595.28 - 80; // A4 menos margenes laterales

const sectionTitle = (title) => ({
  table: { widths: ['*'], body: [[{ text: title, color: '#ffffff', bold: true, fontSize: 9, characterSpacing: 0.5, margin: [6, 3, 6, 3] }]] },
  layout: { fillColor: () => COLOR.brand, hLineWidth: () => 0, vLineWidth: () => 0 },
  margin: [0, 8, 0, 0],
});

/** Titulo + contenido como bloque indivisible: un titulo nunca queda solo al final de una pagina. */
const section = (title, ...nodes) => ({ unbreakable: true, stack: [sectionTitle(title), ...nodes] });

/** Tabla etiqueta/valor en 2 pares por renglon (compacta y facil de leer). */
function kvTable(rows) {
  const cell = (r) => (r ? [
    { text: r.label, bold: true, fontSize: 8.5, color: COLOR.muted, fillColor: COLOR.label },
    { text: String(r.value), fontSize: 9.5, color: COLOR.text },
  ] : [{ text: '', fillColor: COLOR.label }, { text: '' }]);

  const body = [];
  for (let i = 0; i < rows.length; i += 2) body.push([...cell(rows[i]), ...cell(rows[i + 1])]);

  return {
    table: { widths: [92, '*', 92, '*'], body, dontBreakRows: true },
    layout: {
      hLineColor: () => COLOR.line,
      vLineColor: () => COLOR.line,
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingTop: () => 2.5,
      paddingBottom: () => 2.5,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    },
  };
}

function headerBlock(empresa, logo) {
  const datos = [
    empresa.rfc && `RFC: ${empresa.rfc}`,
    empresa.direccion,
    [empresa.telefono && `Tel. ${empresa.telefono}`, empresa.correo].filter(Boolean).join('  ·  '),
    empresa.sitio_web,
  ].filter(Boolean);

  const right = {
    stack: [
      { text: empresa.nombre, bold: true, fontSize: 13, color: COLOR.brand, alignment: 'right' },
      ...(empresa.encabezado_documento ? [{ text: empresa.encabezado_documento, fontSize: 9, italics: true, color: COLOR.text, alignment: 'right', margin: [0, 1, 0, 1] }] : []),
      ...datos.map((t) => ({ text: t, fontSize: 8, color: COLOR.muted, alignment: 'right' })),
    ],
  };

  return {
    margin: [40, 24, 40, 0],
    stack: [
      {
        columns: logo ? [{ image: logo, fit: [130, 52], width: 140 }, right] : [right],
        columnGap: 10,
      },
      { canvas: [{ type: 'line', x1: 0, y1: 8, x2: PAGE_WIDTH, y2: 8, lineWidth: 1.5, lineColor: COLOR.brand }] },
    ],
  };
}

function firmasBlock(carta, colaborador) {
  const firma = (rol, nombre, cargo) => ({
    stack: [
      { canvas: [{ type: 'line', x1: 10, y1: 0, x2: 215, y2: 0, lineWidth: 0.8, lineColor: COLOR.text }], margin: [0, 34, 0, 4] },
      { text: rol, fontSize: 8, bold: true, color: COLOR.muted, alignment: 'center', characterSpacing: 0.4 },
      { text: nombre || ' ', fontSize: 10, bold: true, alignment: 'center', margin: [0, 3, 0, 0] },
      { text: cargo || ' ', fontSize: 9, color: COLOR.muted, alignment: 'center' },
    ],
  });

  return {
    unbreakable: true,
    margin: [0, 12, 0, 0],
    stack: [
      {
        columns: [
          firma('RECIBE — COLABORADOR', colaborador.nombre_completo, [colaborador.cargo, colaborador.area].filter(Boolean).join(' · ')),
          firma('ENTREGA', carta.entrega_nombre, carta.entrega_cargo),
        ],
        columnGap: 30,
      },
      { text: 'Fecha de firma: ____ / ____ / ________', fontSize: 8.5, color: COLOR.muted, alignment: 'center', margin: [0, 10, 0, 0] },
    ],
  };
}

/**
 * Construye el PDF y devuelve un Buffer.
 *  - carta:        fila de cartas_responsivas (folio, fechas, textos, quien entrega)
 *  - colaborador:  { nombre_completo, id_empleado, area, cargo, correo_empresarial, ... }
 *  - empresa:      datos de la empresa (+ textos de declaracion y condiciones efectivos)
 *  - recursos:     [{ label, campos: [{label, value}] }]
 *  - logo:         data URL (png/jpeg) o null
 *  - watermark:    'BORRADOR' | 'CANCELADA' | null
 */
async function renderCartaPdf({ carta, colaborador, empresa, recursos, logo, watermark }) {
  const vars = { empresa: empresa.nombre, colaborador: colaborador.nombre_completo };
  const condiciones = fillTemplate(empresa.texto_condiciones, vars).split('\n').map((l) => l.trim()).filter(Boolean);
  const multiple = recursos.length > 1;
  const fecha = empresa.formato_fecha === 'corta' ? fechaCorta : fechaLarga; // Configuracion > Documentos

  const content = [
    // Titulo + folio / fecha
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'CARTA RESPONSIVA', fontSize: 22, bold: true, color: COLOR.brand },
            { text: `Entrega de ${PLANTILLAS[carta.plantilla].toLowerCase()}`, fontSize: 10.5, color: COLOR.muted, margin: [0, 2, 0, 0] },
          ],
        },
        {
          width: 170,
          table: {
            widths: ['*'],
            body: [
              [{ stack: [{ text: 'FOLIO', fontSize: 7.5, color: COLOR.muted, bold: true }, { text: carta.folio, fontSize: 12, bold: true, color: COLOR.brand }], margin: [6, 4, 6, 2] }],
              [{ stack: [{ text: 'FECHA DE ENTREGA', fontSize: 7.5, color: COLOR.muted, bold: true }, { text: fecha(carta.fecha_entrega), fontSize: 10 }], margin: [6, 2, 6, 4] }],
            ],
          },
          layout: { hLineColor: () => COLOR.line, vLineColor: () => COLOR.line, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
        },
      ],
    },

    // Colaborador
    section('DATOS DEL COLABORADOR', kvTable([
      { label: 'Nombre completo', value: colaborador.nombre_completo },
      { label: 'ID de empleado', value: colaborador.id_empleado },
      { label: 'Área / departamento', value: colaborador.area },
      { label: 'Cargo', value: colaborador.cargo },
      ...(colaborador.correo_empresarial ? [{ label: 'Correo', value: colaborador.correo_empresarial }] : []),
      ...(colaborador.telefono_empresarial ? [{ label: 'Teléfono', value: colaborador.telefono_empresarial }] : []),
    ])),

    // Recursos (uno o varios)
    ...recursos.map((r, i) =>
      section(
        multiple ? `RECURSO ${i + 1} DE ${recursos.length}: ${r.label.toUpperCase()}` : `DATOS DEL RECURSO: ${r.label.toUpperCase()}`,
        kvTable(r.campos.map((c) => ({ label: c.label, value: c.value })))
      )
    ),

    // Fechas
    ...(carta.fecha_devolucion_esperada
      ? [section('FECHAS', kvTable([
          { label: 'Fecha de entrega', value: fecha(carta.fecha_entrega) },
          { label: 'Devolución esperada', value: fecha(carta.fecha_devolucion_esperada) },
        ]))]
      : []),

  ];

  // Bloques finales. El ULTIMO va junto con las firmas en un grupo indivisible: asi la
  // pagina de firmas nunca queda sola, sin nada del contenido arriba.
  const texto = (t) => ({ text: t, fontSize: 9.5, alignment: 'justify', lineHeight: 1.2, margin: [0, 6, 0, 0] });
  const closing = [
    [sectionTitle('DECLARACIÓN DE RECEPCIÓN Y RESPONSABILIDAD'), texto(fillTemplate(empresa.texto_declaracion, vars))],
    [
      sectionTitle('CONDICIONES DE USO Y CUIDADO'),
      { ol: condiciones.map((c) => ({ text: c, fontSize: 8.8, alignment: 'justify', margin: [0, 0, 0, 1] })), margin: [0, 6, 0, 0], lineHeight: 1.15 },
    ],
    ...(carta.condiciones_especiales ? [[sectionTitle('CONDICIONES ESPECIALES'), texto(carta.condiciones_especiales)]] : []),
    ...(carta.observaciones ? [[sectionTitle('OBSERVACIONES'), texto(carta.observaciones)]] : []),
  ];
  const last = closing.pop();
  content.push(...closing.map((nodes) => ({ unbreakable: true, stack: nodes })), { unbreakable: true, stack: [...last, firmasBlock(carta, colaborador)] });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 96, 40, 56],
    info: { title: `Carta responsiva ${carta.folio}`, author: empresa.nombre, subject: 'Carta responsiva' },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: COLOR.text },
    header: () => headerBlock(empresa, logo),
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 0],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: PAGE_WIDTH, y2: 0, lineWidth: 0.5, lineColor: COLOR.line }], margin: [0, 0, 0, 5] },
        {
          columns: [
            { text: empresa.pie_documento || '', fontSize: 7.5, color: COLOR.muted, width: '*' },
            { text: `${carta.folio}  ·  Página ${currentPage} de ${pageCount}`, fontSize: 7.5, color: COLOR.muted, alignment: 'right', width: 'auto' },
          ],
        },
      ],
    }),
    content,
  };

  if (watermark) {
    docDefinition.watermark = { text: watermark, color: '#94a3b8', opacity: 0.18, bold: true, fontSize: 90 };
  }

  return pdfmake.createPdf(docDefinition).getBuffer();
}

/** Lee el logo de disco y lo devuelve como data URL para pdfmake (o null si no hay / falta). */
function logoDataUrl(filePath, mime) {
  try {
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch {
    return null;
  }
}

module.exports = { renderCartaPdf, logoDataUrl };
