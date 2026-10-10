const ExcelJS = require('exceljs');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const { agregarHoja } = require('../utils/importExport');
const { logAudit } = require('../utils/audit');

/**
 * "Respaldo manual": exporta el inventario y los catalogos principales a un
 * solo Excel con varias hojas. No hay mysqldump ni backups automaticos (no es
 * seguro invocar el shell del servidor desde una peticion HTTP en esta
 * arquitectura) — esto es lo que la app SI puede ofrecer de forma segura.
 */

const HOJAS = [
  {
    nombre: 'Equipos',
    columnas: [
      { key: 'codigo_inventario', header: 'Código' }, { key: 'tipo', header: 'Tipo' },
      { key: 'marca', header: 'Marca' }, { key: 'modelo', header: 'Modelo' },
      { key: 'numero_serie', header: 'Número de serie' }, { key: 'estado', header: 'Estado' },
      { key: 'colaborador', header: 'Asignado a' }, { key: 'garantia_vence', header: 'Garantía vence' },
    ],
    sql: `SELECT e.codigo_inventario, t.nombre AS tipo, e.marca, e.modelo, e.numero_serie, e.estado,
                 CONCAT_WS(' ', c.nombre, c.apellido_paterno) AS colaborador, e.garantia_vence
            FROM equipos e JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
            LEFT JOIN asignaciones_equipos a ON a.equipo_vigente_id = e.id
            LEFT JOIN colaboradores c ON c.id = a.colaborador_id
           ORDER BY e.codigo_inventario`,
  },
  {
    nombre: 'Accesorios',
    columnas: [
      { key: 'codigo_inventario', header: 'Código' }, { key: 'tipo', header: 'Tipo' }, { key: 'nombre', header: 'Nombre' },
      { key: 'marca', header: 'Marca' }, { key: 'modelo', header: 'Modelo' }, { key: 'estado', header: 'Estado' },
      { key: 'colaborador', header: 'Asignado a' },
    ],
    sql: `SELECT a.codigo_inventario, t.nombre AS tipo, a.nombre, a.marca, a.modelo, a.estado,
                 CONCAT_WS(' ', c.nombre, c.apellido_paterno) AS colaborador
            FROM accesorios a JOIN tipos_accesorio t ON t.id = a.tipo_accesorio_id
            LEFT JOIN asignaciones_accesorios aa ON aa.accesorio_vigente_id = a.id
            LEFT JOIN colaboradores c ON c.id = aa.colaborador_id
           ORDER BY a.codigo_inventario`,
  },
  {
    nombre: 'Impresoras',
    columnas: [
      { key: 'codigo_inventario', header: 'Código' }, { key: 'marca', header: 'Marca' }, { key: 'modelo', header: 'Modelo' },
      { key: 'ip', header: 'IP' }, { key: 'ubicacion', header: 'Ubicación' }, { key: 'estado', header: 'Estado' },
    ],
    sql: `SELECT p.codigo_inventario, p.marca, p.modelo, p.ip, u.nombre AS ubicacion, p.estado
            FROM impresoras p LEFT JOIN ubicaciones u ON u.id = p.ubicacion_id
           ORDER BY p.codigo_inventario`,
  },
  {
    nombre: 'Celulares',
    columnas: [
      { key: 'codigo_inventario', header: 'Código' }, { key: 'marca', header: 'Marca' }, { key: 'modelo', header: 'Modelo' },
      { key: 'numero_telefono', header: 'Número' }, { key: 'estado', header: 'Estado' }, { key: 'colaborador', header: 'Asignado a' },
    ],
    sql: `SELECT c.codigo_inventario, c.marca, c.modelo, c.numero_telefono, c.estado,
                 CONCAT_WS(' ', col.nombre, col.apellido_paterno) AS colaborador
            FROM celulares c
            LEFT JOIN asignaciones_celulares ac ON ac.celular_vigente_id = c.id
            LEFT JOIN colaboradores col ON col.id = ac.colaborador_id
           ORDER BY c.codigo_inventario`,
  },
  {
    nombre: 'Colaboradores',
    columnas: [
      { key: 'id_empleado', header: 'ID Empleado' }, { key: 'nombre_completo', header: 'Nombre' },
      { key: 'area', header: 'Área' }, { key: 'cargo', header: 'Cargo' },
      { key: 'correo_empresarial', header: 'Correo' }, { key: 'activo', header: 'Activo' },
    ],
    sql: `SELECT c.id_empleado, CONCAT_WS(' ', c.nombre, c.apellido_paterno, c.apellido_materno) AS nombre_completo,
                 a.nombre AS area, ca.nombre AS cargo, c.correo_empresarial, IF(c.activo, 'Sí', 'No') AS activo
            FROM colaboradores c JOIN areas a ON a.id = c.area_id JOIN cargos ca ON ca.id = c.cargo_id
           ORDER BY c.apellido_paterno, c.nombre`,
  },
  {
    nombre: 'Licencias',
    columnas: [
      { key: 'codigo', header: 'Código' }, { key: 'software', header: 'Software' },
      { key: 'cantidad_total', header: 'Puestos' }, { key: 'fecha_vencimiento', header: 'Vence' }, { key: 'estado', header: 'Estado' },
    ],
    sql: `SELECT l.codigo, s.nombre AS software, l.cantidad_total, l.fecha_vencimiento, l.estado
            FROM licencias l JOIN software s ON s.id = l.software_id
           ORDER BY l.codigo`,
  },
];

// GET /api/datos/exportar   (admin)
const exportar = asyncHandler(async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  for (const hoja of HOJAS) {
    const [rows] = await pool.query(hoja.sql);
    agregarHoja(workbook, hoja.nombre, hoja.columnas, rows);
  }

  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'exportado', entity: 'datos', entityId: null, details: { hojas: HOJAS.map((h) => h.nombre) } });

  const buffer = await workbook.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="techcontrol-datos-${fecha}.xlsx"`,
  });
  res.send(buffer);
});

module.exports = { exportar };
