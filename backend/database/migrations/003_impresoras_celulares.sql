-- ============================================================================
-- Migracion 003: Impresoras, Celulares y Ubicaciones
--
-- Sigue el mismo patron que Equipos y Accesorios (migracion 002) y es ADITIVA e
-- IDEMPOTENTE (CREATE ... IF NOT EXISTS / INSERT IGNORE): si falla a medias se
-- puede volver a correr. No se toca ninguna tabla ni dato existente; los unicos
-- DELETE son las filas 'Celular' e 'Impresora' del catalogo `tipos_equipo` y solo
-- si ningun equipo las usa (pasan a tener su propia tabla).
--
--   colaboradores ─< asignaciones_impresoras >─ impresoras >─ tipos_impresora
--        │                                          └─ ubicaciones >─ areas
--        └────────< asignaciones_celulares   >─ celulares
--
--   * La impresora / el celular NUNCA guardan a su responsable: cada entrega es
--     una fila de asignaciones_* (fecha_devolucion NULL = vigente).
--   * `id` es interno; `codigo_inventario` (IMP-00025 / CEL-00015) es el visible.
--   * Sin columna `activo`: "de baja" es estado = 'baja' (+ fecha_baja).
--   * Sin contrasenas ni PIN: el inventario no las guarda (usa MDM / un gestor
--     de contrasenas).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Catalogos: tipos de impresora y ubicaciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_impresora (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  CONSTRAINT uq_tipos_impresora_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_impresora (nombre) VALUES
  ('Láser'), ('Inyección de tinta'), ('Tanque de tinta'), ('Matricial'),
  ('Térmica'), ('Multifuncional'), ('Plotter'), ('Otro');

-- Lugar fisico (Oficina piso 2, Bodega, Contabilidad...). Puede pertenecer a un
-- area (departamento); no se crea una tabla `departamentos`: eso ya es `areas`.
CREATE TABLE IF NOT EXISTS ubicaciones (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  area_id    INT UNSIGNED NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_ubicaciones_nombre UNIQUE (nombre),
  CONSTRAINT fk_ubicaciones_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT,
  INDEX idx_ubicaciones_area (area_id)
) ENGINE=InnoDB;

-- Celular e Impresora dejan de ser tipos de "equipo": ahora tienen su tabla.
DELETE FROM tipos_equipo
 WHERE nombre IN ('Celular', 'Impresora')
   AND NOT EXISTS (SELECT 1 FROM equipos e WHERE e.tipo_equipo_id = tipos_equipo.id);

-- ---------------------------------------------------------------------------
-- 2. IMPRESORAS
--    ubicacion_id = donde esta fisicamente (independiente de quien la tiene a su
--    cargo). El area se deduce de ubicaciones.area_id: no se duplica aqui.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS impresoras (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_inventario    VARCHAR(60)  NOT NULL,
  tipo_impresora_id    INT UNSIGNED NOT NULL,
  marca                VARCHAR(80)  NULL,
  modelo               VARCHAR(120) NULL,
  numero_serie         VARCHAR(120) NULL,
  ip                   VARCHAR(45)  NULL,             -- IPv4 o IPv6
  mac_address          VARCHAR(17)  NULL,             -- AA:BB:CC:DD:EE:FF
  hostname             VARCHAR(63)  NULL,
  ubicacion_id         INT UNSIGNED NULL,
  estado               ENUM('disponible','asignado','mantenimiento','reparacion','baja','perdido')
                       NOT NULL DEFAULT 'disponible',
  tipo_conexion        ENUM('usb','red','wifi') NULL,
  imprime_color        TINYINT(1) NOT NULL DEFAULT 0,
  duplex               TINYINT(1) NOT NULL DEFAULT 0,
  contador_impresiones INT UNSIGNED NULL,             -- lectura manual
  fecha_compra         DATE NULL,
  garantia_vence       DATE NULL,
  garantia_detalle     VARCHAR(120) NULL,
  imagen               VARCHAR(255) NULL,
  observaciones        TEXT NULL,
  fecha_baja           DATE NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_impresoras_codigo UNIQUE (codigo_inventario),
  CONSTRAINT uq_impresoras_serie  UNIQUE (numero_serie),
  CONSTRAINT fk_impresoras_tipo      FOREIGN KEY (tipo_impresora_id) REFERENCES tipos_impresora(id) ON DELETE RESTRICT,
  CONSTRAINT fk_impresoras_ubicacion FOREIGN KEY (ubicacion_id)      REFERENCES ubicaciones(id)     ON DELETE RESTRICT,
  INDEX idx_impresoras_estado (estado),
  INDEX idx_impresoras_marca (marca),
  INDEX idx_impresoras_ubicacion (ubicacion_id),
  INDEX idx_impresoras_ip (ip),
  INDEX idx_impresoras_mac (mac_address)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asignaciones_impresoras (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  impresora_id             INT UNSIGNED NOT NULL,
  colaborador_id           INT UNSIGNED NOT NULL,
  fecha_asignacion         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion         DATETIME NULL,
  estado VARCHAR(10)
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, 'activa', 'devuelta')) STORED,
  asignado_por             INT UNSIGNED NULL,
  recibido_por             INT UNSIGNED NULL,
  observaciones_asignacion TEXT NULL,
  observaciones_devolucion TEXT NULL,
  condicion_devolucion     ENUM('bueno','regular','danado','perdido') NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Una impresora tiene como maximo UN responsable vigente.
  impresora_vigente_id INT UNSIGNED
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, impresora_id, NULL)) STORED,

  CONSTRAINT uq_asig_impresoras_vigente UNIQUE (impresora_vigente_id),
  CONSTRAINT fk_asig_impresoras_impresora    FOREIGN KEY (impresora_id)   REFERENCES impresoras(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_asig_impresoras_colaborador  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asig_impresoras_asignado_por FOREIGN KEY (asignado_por)   REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT fk_asig_impresoras_recibido_por FOREIGN KEY (recibido_por)   REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT chk_asig_impresoras_fechas CHECK (fecha_devolucion IS NULL OR fecha_devolucion >= fecha_asignacion),
  INDEX idx_asig_impresoras_colaborador (colaborador_id, fecha_devolucion),
  INDEX idx_asig_impresoras_historial (impresora_id, fecha_asignacion),
  INDEX idx_asig_impresoras_estado (estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. CELULARES
--    Reemplaza a la tabla anterior (idmovil, Contrasena_o_Pin, idColaborador...):
--      Contrasena_o_Pin / contrasenaDelCorreo -> NO se guardan
--      idColaborador                          -> asignaciones_celulares
--      RenovacionDelEquipo                    -> fecha_renovacion
--      ComponentesDelCelular                  -> componentes_adicionales (JSON)
--      CorreoAsociado                         -> correo_asociado (identificador)
--    numero_telefono / operador describen la linea (SIM) instalada.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS celulares (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_inventario       VARCHAR(60)  NOT NULL,
  marca                   VARCHAR(80)  NULL,
  modelo                  VARCHAR(120) NULL,
  numero_serie            VARCHAR(120) NULL,
  imei_1                  VARCHAR(15)  NULL,
  imei_2                  VARCHAR(15)  NULL,
  color                   VARCHAR(40)  NULL,
  sistema_operativo       VARCHAR(80)  NULL,
  almacenamiento          VARCHAR(60)  NULL,
  ram                     VARCHAR(60)  NULL,
  numero_telefono         VARCHAR(25)  NULL,
  operador                VARCHAR(60)  NULL,
  correo_asociado         VARCHAR(190) NULL,
  componentes_adicionales JSON         NULL,
  estado                  ENUM('disponible','asignado','mantenimiento','reparacion','baja','perdido')
                          NOT NULL DEFAULT 'disponible',
  fecha_compra            DATE NULL,
  fecha_renovacion        DATE NULL,
  garantia_vence          DATE NULL,
  garantia_detalle        VARCHAR(120) NULL,
  imagen                  VARCHAR(255) NULL,
  observaciones           TEXT NULL,
  fecha_baja              DATE NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_celulares_codigo UNIQUE (codigo_inventario),
  CONSTRAINT uq_celulares_serie  UNIQUE (numero_serie),
  CONSTRAINT uq_celulares_imei_1 UNIQUE (imei_1),
  CONSTRAINT uq_celulares_imei_2 UNIQUE (imei_2),
  INDEX idx_celulares_estado (estado),
  INDEX idx_celulares_marca (marca),
  INDEX idx_celulares_telefono (numero_telefono)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asignaciones_celulares (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  celular_id               INT UNSIGNED NOT NULL,
  colaborador_id           INT UNSIGNED NOT NULL,
  fecha_asignacion         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion         DATETIME NULL,
  estado VARCHAR(10)
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, 'activa', 'devuelta')) STORED,
  asignado_por             INT UNSIGNED NULL,
  recibido_por             INT UNSIGNED NULL,
  observaciones_asignacion TEXT NULL,
  observaciones_devolucion TEXT NULL,
  condicion_devolucion     ENUM('bueno','regular','danado','perdido') NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Un celular tiene como maximo UN responsable vigente.
  celular_vigente_id INT UNSIGNED
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, celular_id, NULL)) STORED,

  CONSTRAINT uq_asig_celulares_vigente UNIQUE (celular_vigente_id),
  CONSTRAINT fk_asig_celulares_celular      FOREIGN KEY (celular_id)     REFERENCES celulares(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_asig_celulares_colaborador  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asig_celulares_asignado_por FOREIGN KEY (asignado_por)   REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT fk_asig_celulares_recibido_por FOREIGN KEY (recibido_por)   REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT chk_asig_celulares_fechas CHECK (fecha_devolucion IS NULL OR fecha_devolucion >= fecha_asignacion),
  INDEX idx_asig_celulares_colaborador (colaborador_id, fecha_devolucion),
  INDEX idx_asig_celulares_historial (celular_id, fecha_asignacion),
  INDEX idx_asig_celulares_estado (estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 4. Vista para cartas responsivas: ahora tambien impresoras y celulares.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_asignaciones_vigentes AS
  SELECT a.colaborador_id, 'EQUIPO' AS categoria, a.id AS asignacion_id, e.id AS item_id,
         e.codigo_inventario, t.nombre AS tipo,
         TRIM(CONCAT_WS(' ', e.marca, e.modelo)) AS descripcion,
         e.numero_serie, a.fecha_asignacion
    FROM asignaciones_equipos a
    JOIN equipos e      ON e.id = a.equipo_id
    JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
   WHERE a.fecha_devolucion IS NULL
  UNION ALL
  SELECT a.colaborador_id, 'ACCESORIO', a.id, x.id,
         x.codigo_inventario, t.nombre,
         x.nombre,
         x.numero_serie, a.fecha_asignacion
    FROM asignaciones_accesorios a
    JOIN accesorios x        ON x.id = a.accesorio_id
    JOIN tipos_accesorio t   ON t.id = x.tipo_accesorio_id
   WHERE a.fecha_devolucion IS NULL
  UNION ALL
  SELECT a.colaborador_id, 'IMPRESORA', a.id, p.id,
         p.codigo_inventario, t.nombre,
         TRIM(CONCAT_WS(' ', p.marca, p.modelo)),
         p.numero_serie, a.fecha_asignacion
    FROM asignaciones_impresoras a
    JOIN impresoras p        ON p.id = a.impresora_id
    JOIN tipos_impresora t   ON t.id = p.tipo_impresora_id
   WHERE a.fecha_devolucion IS NULL
  UNION ALL
  SELECT a.colaborador_id, 'CELULAR', a.id, c.id,
         c.codigo_inventario, 'Celular',
         TRIM(CONCAT_WS(' ', c.marca, c.modelo)),
         c.numero_serie, a.fecha_asignacion
    FROM asignaciones_celulares a
    JOIN celulares c         ON c.id = a.celular_id
   WHERE a.fecha_devolucion IS NULL;
