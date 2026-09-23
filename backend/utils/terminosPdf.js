const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');
const { VERSION, ACTUALIZADO_EL, SECCIONES } = require('./terminos');

/** PDF de "Términos y condiciones". Mismo motor que cartas/reportes (pdfmake), archivo aparte. */

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);

const FONTS_DIR = path.join(__dirname, '..', 'node_modules', 'pdfmake', 'build', 'fonts', 'Roboto');
const FONT_FILES = {
  normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf',
};
for (const file of Object.values(FONT_FILES)) {
  pdfmake.virtualfs.writeFileSync(file, fs.readFileSync(path.join(FONTS_DIR, file)));
}
pdfmake.addFonts({ Roboto: FONT_FILES });

function renderTerminosPdf(empresaNombre) {
  const docDefinition = {
    pageSize: 'LETTER',
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#1f2937' },
    content: [
      { text: 'Términos y condiciones de uso', fontSize: 16, bold: true, color: '#0B1F3A' },
      { text: `${empresaNombre || 'TechControl'} · Versión ${VERSION} · Actualizado el ${ACTUALIZADO_EL}`, fontSize: 9, color: '#6b7280', margin: [0, 4, 0, 16] },
      {
        text: 'Documento de referencia: revísalo con el área legal antes de considerarlo vigente.',
        fontSize: 9, italics: true, color: '#b45309', margin: [0, 0, 0, 16],
      },
      ...SECCIONES.flatMap((s) => [
        { text: s.titulo, fontSize: 11, bold: true, color: '#0B1F3A', margin: [0, 10, 0, 4] },
        { text: s.texto, lineHeight: 1.3 },
      ]),
    ],
    info: { title: 'Términos y condiciones', subject: 'Términos y condiciones de uso' },
  };
  return pdfmake.createPdf(docDefinition).getBuffer();
}

module.exports = { renderTerminosPdf };
