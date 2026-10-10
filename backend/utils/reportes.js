/**
 * Definiciones compartidas del modulo de Reportes y Analisis.
 *
 * Todo lo que expone este modulo se CALCULA con SQL sobre las tablas que ya
 * existen (equipos, accesorios, impresoras, celulares, colaboradores, redes,
 * dispositivos_red, mantenimientos, licencias, cartas_responsivas...). No hay
 * ninguna tabla de estadisticas: nada que resumir aqui se guarda por duplicado.
 */

// Los 4 tipos de inventario que se consideran "activos" (monitores son accesorios).
const TIPOS_ACTIVO = ['equipos', 'accesorios', 'impresoras', 'celulares'];

// Garantia "por vencer": mismo criterio en todo el reporte (un solo lugar para cambiarlo).
const GARANTIA_ALERTA_DIAS = 60;

// Granularidad del "mantenimientos por periodo".
const AGRUPACIONES_PERIODO = ['dia', 'semana', 'mes'];

module.exports = { TIPOS_ACTIVO, GARANTIA_ALERTA_DIAS, AGRUPACIONES_PERIODO };
