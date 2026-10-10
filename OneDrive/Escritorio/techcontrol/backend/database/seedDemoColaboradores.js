/**
 * Datos de DEMOSTRACION para Colaboradores, Equipos, Accesorios, Impresoras y
 * Celulares (opcional).
 * Uso: npm run seed:demo
 *
 * Inserta areas, cargos, ubicaciones, colaboradores, equipos, accesorios,
 * impresoras, celulares y asignaciones de ejemplo (vigentes e historicas). Es
 * idempotente: si ya existen colaboradores no inserta nada, para no mezclar
 * datos de prueba con datos reales.
 * Requiere haber corrido antes `npm run migrate` (migraciones 001, 002 y 003).
 */
require('dotenv').config();
const { pool } = require('../config/db');

const areas = ['Sistemas', 'Recursos Humanos', 'Finanzas', 'Operaciones', 'Ventas'];
const cargos = ['Analista', 'Gerente', 'Coordinador', 'Técnico', 'Auxiliar'];

// [nombre, area|null]
const ubicaciones = [
  ['Oficina de Sistemas', 'Sistemas'],
  ['Contabilidad', 'Finanzas'],
  ['Recepción', null],
  ['Bodega TI', null],
];

// [id_empleado, nombre, paterno, materno, area, cargo, alta, baja|null]
const colaboradores = [
  ['E-1001', 'María Fernanda', 'López', 'García', 'Sistemas', 'Gerente', '2019-03-04', null],
  ['E-1002', 'Carlos', 'Hernández', 'Ruiz', 'Sistemas', 'Técnico', '2021-08-16', null],
  ['E-1003', 'Ana Sofía', 'Martínez', 'Torres', 'Recursos Humanos', 'Coordinador', '2020-01-13', null],
  ['E-1004', 'Jorge', 'Ramírez', null, 'Finanzas', 'Analista', '2022-05-02', null],
  ['E-1005', 'Lucía', 'Domínguez', 'Vega', 'Finanzas', 'Gerente', '2018-11-19', null],
  ['E-1006', 'Miguel Ángel', 'Castillo', 'Soto', 'Operaciones', 'Coordinador', '2020-09-07', null],
  ['E-1007', 'Paola', 'Ortega', 'Núñez', 'Ventas', 'Analista', '2023-02-20', null],
  ['E-1008', 'Ricardo', 'Mendoza', 'Ibarra', 'Ventas', 'Auxiliar', '2023-07-10', null],
  ['E-1009', 'Daniela', 'Salazar', 'Cruz', 'Operaciones', 'Auxiliar', '2021-04-05', '2024-06-28'],
  ['E-1010', 'Fernando', 'Aguilar', 'Peña', 'Sistemas', 'Analista', '2017-10-30', '2023-12-15'],
];

// [codigo, tipo, marca, modelo, serie, procesador, ram, disco, sistema operativo, estado fisico]
const equipos = [
  ['EQ-00001', 'Laptop', 'Dell', 'Latitude 5440', 'DL5440-A1', 'Intel Core i7-1355U', '16 GB', 'SSD 512 GB', 'Windows 11 Pro', 'bueno'],
  ['EQ-00002', 'Laptop', 'Lenovo', 'ThinkPad E14', 'LNV-E14-337', 'Intel Core i5-1235U', '16 GB', 'SSD 512 GB', 'Windows 11 Pro', 'regular'],
  ['EQ-00003', 'PC', 'HP', 'ProDesk 400 G9', 'HP400-5567', 'Intel Core i5-12500', '16 GB', 'SSD 256 GB', 'Windows 11 Pro', 'bueno'],
  ['EQ-00004', 'Laptop', 'HP', 'ProBook 450 G9', 'HP450-9021', 'Intel Core i5-1235U', '8 GB', 'SSD 256 GB', 'Windows 10 Pro', 'bueno'],
  ['EQ-00005', 'Laptop', 'Apple', 'MacBook Air M2', 'AP-MBA-2201', 'Apple M2', '8 GB', 'SSD 256 GB', 'macOS 14', 'excelente'],
];

// [codigo, tipo, marca, modelo, serie|null, ip|null, ubicacion|null, conexion, imprime_color, duplex]
const impresoras = [
  ['IMP-00001', 'Láser', 'HP', 'LaserJet Pro M404dn', 'HP-M404-3301', '192.168.10.25', 'Contabilidad', 'red', 0, 1],
  ['IMP-00002', 'Tanque de tinta', 'Epson', 'L3250', 'EP-L3250-77', null, 'Oficina de Sistemas', 'wifi', 1, 0],
  ['IMP-00003', 'Multifuncional', 'Brother', 'MFC-L2750DW', null, '192.168.10.40', 'Recepción', 'red', 0, 1],
];

// [codigo, marca, modelo, serie|null, imei_1, color, sistema operativo, almacenamiento, ram, telefono|null, operador|null]
const celulares = [
  ['CEL-00001', 'Samsung', 'Galaxy A54', 'SM-A54-1290', '490154203237518', 'Negro', 'Android 14', '128 GB', '8 GB', '55 4000 1001', 'Telcel'],
  ['CEL-00002', 'Samsung', 'Galaxy A55', null, '356938035643809', 'Azul', 'Android 14', '256 GB', '8 GB', null, null],
  ['CEL-00003', 'Apple', 'iPhone 13', 'AP-IP13-5521', '353879234252633', 'Blanco', 'iOS 17', '128 GB', '4 GB', '55 4000 1003', 'AT&T'],
];

// [codigo, tipo, nombre, marca, modelo, serie|null]
const accesorios = [
  ['ACC-00001', 'Monitor', 'Monitor Dell P2422H', 'Dell', 'P2422H', 'CN123456'],
  ['ACC-00002', 'Mouse', 'Mouse Logitech M185', 'Logitech', 'M185', null],
  ['ACC-00003', 'Teclado', 'Teclado Logitech K120', 'Logitech', 'K120', null],
  ['ACC-00004', 'Audífonos', 'Audífonos Jabra Evolve2 40', 'Jabra', 'Evolve2 40', 'JB-40-7781'],
  ['ACC-00005', 'Docking station', 'Dock Lenovo ThinkPad USB-C', 'Lenovo', '40AS0090', 'LN-DOCK-4410'],
  ['ACC-00006', 'Webcam', 'Webcam Logitech C920', 'Logitech', 'C920', null],
  ['ACC-00007', 'Cargador', 'Cargador Dell 65W USB-C', 'Dell', 'LA65NM190', null],
  ['ACC-00008', 'Monitor', 'Monitor LG 24MK430H', 'LG', '24MK430H', 'LG24-8841'],
];

// [colaborador, codigo, asignacion, devolucion|null, condicion, obs]
const asignacionesEquipos = [
  ['E-1001', 'EQ-00001', '2023-01-10 09:00:00', null, null, 'Entrega inicial con cargador.'],
  ['E-1002', 'EQ-00002', '2022-03-01 10:30:00', null, null, null],
  ['E-1003', 'EQ-00003', '2021-06-14 12:00:00', null, null, null],
  ['E-1004', 'EQ-00004', '2022-05-02 09:15:00', null, null, null],
  // Historial: equipos devueltos (EQ-00004 lo tuvo antes E-1009; EQ-00002 lo tuvo E-1010)
  ['E-1009', 'EQ-00004', '2021-04-05 11:00:00', '2022-04-29 16:00:00', 'bueno', 'Devuelta por cambio de equipo.'],
  ['E-1010', 'EQ-00002', '2018-01-15 10:00:00', '2021-12-20 13:00:00', 'regular', 'Batería degradada.'],
];

// IMP-00002 pasó de E-1010 (devuelta) a E-1004 (vigente); IMP-00001 y IMP-00003 no tienen responsable.
const asignacionesImpresoras = [
  ['E-1010', 'IMP-00002', '2019-02-01 10:00:00', '2023-12-15 14:30:00', 'bueno', 'Devolución por baja del colaborador.'],
  ['E-1004', 'IMP-00002', '2024-01-10 09:00:00', null, null, null],
];

// CEL-00003: lo tuvo E-1009 y volvió a almacén; CEL-00002 nunca se ha asignado.
const asignacionesCelulares = [
  ['E-1002', 'CEL-00001', '2022-03-01 10:30:00', null, null, 'Línea corporativa.'],
  ['E-1009', 'CEL-00003', '2021-04-05 11:00:00', '2024-06-28 12:00:00', 'bueno', 'Devolución por baja del colaborador.'],
];

const asignacionesAccesorios = [
  ['E-1001', 'ACC-00001', '2023-01-10 09:00:00', null, null, null],
  ['E-1001', 'ACC-00002', '2023-01-10 09:00:00', null, null, null],
  ['E-1002', 'ACC-00005', '2022-03-01 10:30:00', null, null, null],
  ['E-1003', 'ACC-00003', '2021-06-14 12:00:00', null, null, null],
  ['E-1010', 'ACC-00004', '2020-08-01 10:00:00', '2023-12-15 14:30:00', 'regular', 'Almohadillas desgastadas.'],
];

async function run() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM colaboradores');
  if (total > 0) {
    console.log('Ya existen colaboradores; no se inserto nada.');
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const n of areas) await conn.query('INSERT IGNORE INTO areas (nombre) VALUES (?)', [n]);
    for (const n of cargos) await conn.query('INSERT IGNORE INTO cargos (nombre) VALUES (?)', [n]);
    for (const [n, area] of ubicaciones) {
      await conn.query(
        'INSERT IGNORE INTO ubicaciones (nombre, area_id) VALUES (?, (SELECT id FROM areas WHERE nombre = ?))',
        [n, area]
      );
    }

    for (const [emp, nom, pat, mat, area, cargo, alta, baja] of colaboradores) {
      const slug = `${nom.split(' ')[0]}.${pat}`
        .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      await conn.query(
        `INSERT INTO colaboradores
           (id_empleado, nombre, apellido_paterno, apellido_materno, area_id, cargo_id,
            correo_empresarial, telefono_empresarial, correo_personal, telefono_personal,
            fecha_alta, fecha_baja, activo)
         VALUES (?, ?, ?, ?, (SELECT id FROM areas WHERE nombre = ?), (SELECT id FROM cargos WHERE nombre = ?),
                 ?, ?, ?, ?, ?, ?, ?)`,
        [emp, nom, pat, mat, area, cargo,
         `${slug}@empresa.com`, '55 5000 10' + emp.slice(-2), `${slug}@gmail.com`, '55 1234 56' + emp.slice(-2),
         alta, baja, baja ? 0 : 1]
      );
    }

    for (const [cod, tipo, marca, modelo, serie, cpu, ram, disco, so, fisico] of equipos) {
      await conn.query(
        `INSERT INTO equipos (codigo_inventario, tipo_equipo_id, marca, modelo, numero_serie,
                              procesador, ram, disco_duro, sistema_operativo, estado_fisico, fecha_compra)
         VALUES (?, (SELECT id FROM tipos_equipo WHERE nombre = ?), ?, ?, ?, ?, ?, ?, ?, ?, '2022-01-15')`,
        [cod, tipo, marca, modelo, serie, cpu, ram, disco, so, fisico]
      );
    }

    for (const [cod, tipo, nombre, marca, modelo, serie] of accesorios) {
      await conn.query(
        `INSERT INTO accesorios (codigo_inventario, tipo_accesorio_id, nombre, marca, modelo, numero_serie)
         VALUES (?, (SELECT id FROM tipos_accesorio WHERE nombre = ?), ?, ?, ?, ?)`,
        [cod, tipo, nombre, marca, modelo, serie]
      );
    }

    for (const [cod, tipo, marca, modelo, serie, ip, ubicacion, conexion, color, duplex] of impresoras) {
      await conn.query(
        `INSERT INTO impresoras (codigo_inventario, tipo_impresora_id, marca, modelo, numero_serie, ip,
                                 ubicacion_id, tipo_conexion, imprime_color, duplex, fecha_compra)
         VALUES (?, (SELECT id FROM tipos_impresora WHERE nombre = ?), ?, ?, ?, ?,
                 (SELECT id FROM ubicaciones WHERE nombre = ?), ?, ?, ?, '2022-06-01')`,
        [cod, tipo, marca, modelo, serie, ip, ubicacion, conexion, color, duplex]
      );
    }

    for (const [cod, marca, modelo, serie, imei, color, so, almacenamiento, ram, telefono, operador] of celulares) {
      await conn.query(
        `INSERT INTO celulares (codigo_inventario, marca, modelo, numero_serie, imei_1, color, sistema_operativo,
                                almacenamiento, ram, numero_telefono, operador, fecha_compra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2023-03-01')`,
        [cod, marca, modelo, serie, imei, color, so, almacenamiento, ram, telefono, operador]
      );
    }

    for (const [emp, cod, asig, dev, cond, obs] of asignacionesEquipos) {
      await conn.query(
        `INSERT INTO asignaciones_equipos
           (colaborador_id, equipo_id, fecha_asignacion, fecha_devolucion, condicion_devolucion,
            observaciones_asignacion)
         VALUES ((SELECT id FROM colaboradores WHERE id_empleado = ?),
                 (SELECT id FROM equipos WHERE codigo_inventario = ?), ?, ?, ?, ?)`,
        [emp, cod, asig, dev, cond, obs]
      );
    }

    for (const [emp, cod, asig, dev, cond, obs] of asignacionesAccesorios) {
      await conn.query(
        `INSERT INTO asignaciones_accesorios
           (colaborador_id, accesorio_id, fecha_asignacion, fecha_devolucion, condicion_devolucion,
            observaciones_asignacion)
         VALUES ((SELECT id FROM colaboradores WHERE id_empleado = ?),
                 (SELECT id FROM accesorios WHERE codigo_inventario = ?), ?, ?, ?, ?)`,
        [emp, cod, asig, dev, cond, obs]
      );
    }

    for (const [table, fk, itemTable, list] of [
      ['asignaciones_impresoras', 'impresora_id', 'impresoras', asignacionesImpresoras],
      ['asignaciones_celulares', 'celular_id', 'celulares', asignacionesCelulares],
    ]) {
      for (const [emp, cod, asig, dev, cond, obs] of list) {
        await conn.query(
          `INSERT INTO ${table}
             (colaborador_id, ${fk}, fecha_asignacion, fecha_devolucion, condicion_devolucion,
              observaciones_asignacion)
           VALUES ((SELECT id FROM colaboradores WHERE id_empleado = ?),
                   (SELECT id FROM ${itemTable} WHERE codigo_inventario = ?), ?, ?, ?, ?)`,
          [emp, cod, asig, dev, cond, obs]
        );
      }
    }

    // El estado de cada item refleja si tiene una asignacion vigente.
    for (const [table, asig, fk] of [
      ['equipos', 'asignaciones_equipos', 'equipo_id'],
      ['accesorios', 'asignaciones_accesorios', 'accesorio_id'],
      ['impresoras', 'asignaciones_impresoras', 'impresora_id'],
      ['celulares', 'asignaciones_celulares', 'celular_id'],
    ]) {
      await conn.query(
        `UPDATE ${table} t SET estado =
           IF(EXISTS (SELECT 1 FROM ${asig} a WHERE a.${fk} = t.id AND a.fecha_devolucion IS NULL),
              'asignado', 'disponible')`
      );
    }
    // Un equipo y un accesorio de ejemplo fuera de circulacion.
    await conn.query("UPDATE equipos SET estado = 'mantenimiento' WHERE codigo_inventario = 'EQ-00005'");
    await conn.query("UPDATE impresoras SET estado = 'mantenimiento' WHERE codigo_inventario = 'IMP-00003'");
    await conn.query(
      "UPDATE accesorios SET estado = 'baja', fecha_baja = '2024-03-01' WHERE codigo_inventario = 'ACC-00008'"
    );

    await conn.commit();
    console.log(
      `Datos de demostracion insertados: ${colaboradores.length} colaboradores, ` +
        `${equipos.length} equipos, ${accesorios.length} accesorios, ${impresoras.length} impresoras, ` +
        `${celulares.length} celulares, ` +
        `${asignacionesEquipos.length + asignacionesAccesorios.length + asignacionesImpresoras.length + asignacionesCelulares.length} asignaciones.`
    );
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error al insertar datos de demostracion:', err.message);
    process.exit(1);
  });
