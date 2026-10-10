const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const model = require('../models/reporteModel');
const empresaModel = require('../models/empresaModel');
const { logAudit } = require('../utils/audit');
const { renderReportePdf } = require('../utils/reportePdf');
const { renderReporteExcel } = require('../utils/reporteExcel');

const ENTITY = 'reporte';

function leerFiltros(query) {
  return {
    desde: query.desde || null,
    hasta: query.hasta || null,
    departamentoId: query.departamento_id || null,
    ubicacionId: query.ubicacion_id || null,
    tipoActivo: query.tipo_activo || null,
    estado: query.estado || null,
  };
}

const TIPO_LABEL = { equipos: 'Equipos', accesorios: 'Accesorios', impresoras: 'Impresoras', celulares: 'Celulares' };

/** Texto legible de los filtros activos, para el encabezado del reporte y la auditoría. */
async function describirFiltros(filtros) {
  const partes = [];
  if (filtros.desde || filtros.hasta) partes.push(`Periodo: ${filtros.desde || '…'} a ${filtros.hasta || '…'}`);
  if (filtros.tipoActivo) partes.push(`Tipo de activo: ${TIPO_LABEL[filtros.tipoActivo] || filtros.tipoActivo}`);
  if (filtros.estado) partes.push(`Estado: ${filtros.estado}`);
  if (filtros.departamentoId) {
    const [[a]] = await pool.query('SELECT nombre FROM areas WHERE id = :id', { id: filtros.departamentoId });
    if (a) partes.push(`Departamento: ${a.nombre}`);
  }
  if (filtros.ubicacionId) {
    const [[u]] = await pool.query('SELECT nombre FROM ubicaciones WHERE id = :id', { id: filtros.ubicacionId });
    if (u) partes.push(`Ubicación: ${u.nombre}`);
  }
  return partes.join(' · ');
}

// GET /api/reportes/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const filtros = leerFiltros(req.query);
  const data = await model.dashboard(filtros);
  res.status(200).json({ success: true, data });
});

// GET /api/reportes/exportar?formato=pdf|excel&...filtros
const exportar = asyncHandler(async (req, res) => {
  const filtros = leerFiltros(req.query);
  const formato = req.query.formato === 'excel' ? 'excel' : 'pdf';

  const [data, empresa, filtrosTexto] = await Promise.all([
    model.dashboard(filtros),
    empresaModel.get(),
    describirFiltros(filtros),
  ]);

  const meta = {
    empresaNombre: empresa.nombre,
    generadoPor: req.user.name,
    generadoEl: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
    filtrosTexto,
  };

  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'generado', entity: ENTITY,
    details: { formato, filtros: filtrosTexto || 'ninguno' },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  if (formato === 'excel') {
    const buffer = await renderReporteExcel(data, meta);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-general-${fecha}.xlsx"`,
    });
    return res.send(buffer);
  }

  const buffer = await renderReportePdf(data, meta);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="reporte-general-${fecha}.pdf"`,
  });
  res.send(buffer);
});

module.exports = { dashboard, exportar };
