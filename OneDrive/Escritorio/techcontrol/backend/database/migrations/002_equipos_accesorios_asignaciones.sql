-- ============================================================================
-- Migracion 002: Equipos, Accesorios y Asignaciones
--
-- Parte de lo que ya existe en `techcontrol` (migracion 001) y es ADITIVA:
--   * No se borra ninguna tabla ni dato.
--   * Los unicos DELETE son 3 filas del catalogo `tipos_equipo` (Monitor,
--     Teclado, Mouse) y solo si ningun equipo las usa (pasan a ser accesorios).
--   * Los cambios de nombre (RENAME) conservan los datos.
--
--   colaboradores ─< asignaciones_equipos     >─ equipos     >─ tipos_equipo
--        └────────< asignaciones_accesorios   >─ accesorios  >─ tipos_accesorio
--                   (ambas: asignado_por / recibido_por -> users)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Catalogos de tipos
-- ---------------------------------------------------------------------------
-- Monitor/Teclado/Mouse dejan de ser "equipos": ahora son accesorios.
DELETE FROM tipos_equipo
 WHERE nombre IN ('Monitor', 'Teclado', 'Mouse')
   AND NOT EXISTS (SELECT 1 FROM equipos e WHERE e.tipo_equipo_id = tipos_equipo.id);

INSERT IGNORE INTO tipos_equipo (nombre) VALUES ('All-in-One'), ('Tablet'), ('Servidor');

CREATE TABLE IF NOT EXISTS tipos_accesorio (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  CONSTRAINT uq_tipos_accesorio_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_accesorio (nombre) VALUES
  ('Mouse'), ('Teclado'), ('Monitor'), ('Audífonos'), ('Webcam'),
  ('Docking station'), ('Cargador'), ('Adaptador'), ('Cable'), ('Otro');

-- ---------------------------------------------------------------------------
-- 2. EQUIPOS
--    id                = identificador interno (autoincremental, nunca cambia)
--    codigo_inventario = codigo visible / etiqueta fisica (EQ-00025, o el que
--                        ya tenga pegado el equipo, p. ej. EQUIPO-001)
--    estado            = un solo campo; reemplaza a `activo` y `estadoActivo`
--    idColaborador     = NO existe: la relacion vive en asignaciones_equipos
-- ---------------------------------------------------------------------------
ALTER TABLE equipos RENAME INDEX uq_equipos_inventario TO uq_equipos_codigo;
ALTER TABLE equipos CHANGE numero_inventario codigo_inventario VARCHAR(60) NOT NULL;

ALTER TABLE equipos
  MODIFY estado ENUM('disponible','asignado','mantenimiento','reparacion','baja','perdido')
    NOT NULL DEFAULT 'disponible',
  ADD COLUMN procesador             VARCHAR(120) NULL AFTER numero_serie,
  ADD COLUMN ram                    VARCHAR(60)  NULL AFTER procesador,
  ADD COLUMN disco_duro             VARCHAR(120) NULL AFTER ram,
  ADD COLUMN tarjeta_madre          VARCHAR(120) NULL AFTER disco_duro,
  ADD COLUMN tarjeta_grafica        VARCHAR(120) NULL AFTER tarjeta_madre,
  ADD COLUMN sistema_operativo      VARCHAR(80)  NULL AFTER tarjeta_grafica,
  ADD COLUMN mac_address            VARCHAR(17)  NULL AFTER sistema_operativo,  -- AA:BB:CC:DD:EE:FF
  ADD COLUMN hostname               VARCHAR(63)  NULL AFTER mac_address,
  ADD COLUMN componentes_adicionales JSON        NULL AFTER hostname,
  ADD COLUMN estado_fisico          ENUM('excelente','bueno','regular','malo') NULL AFTER estado,
  ADD COLUMN observaciones          TEXT         NULL AFTER estado_fisico,      -- antes: detallesIncidentes
  ADD COLUMN fecha_compra           DATE         NULL,
  ADD COLUMN garantia_vence         DATE         NULL,                          -- permite alertas de vencimiento
  ADD COLUMN garantia_detalle       VARCHAR(120) NULL,                          -- texto libre del proveedor
  ADD COLUMN imagen                 VARCHAR(255) NULL,
  ADD COLUMN fecha_baja             DATE         NULL,
  -- La serie puede repetirse como NULL (equipo sin serie capturada) pero no como valor.
  DROP INDEX idx_equipos_serie,
  ADD CONSTRAINT uq_equipos_serie UNIQUE (numero_serie),
  ADD INDEX idx_equipos_hostname (hostname),
  ADD INDEX idx_equipos_mac (mac_address);

-- Nota: el campo legado `activo` (varchar) y `contrasenaEquipo` NO se crean:
-- `activo`/`estadoActivo` los reemplaza `estado`, y las contrasenas de equipos
-- no se guardan en la base de datos.

-- ---------------------------------------------------------------------------
-- 3. ASIGNACIONES DE EQUIPOS (la tabla `asignaciones` de la migracion 001)
--    Se renombra para ser simetrica con asignaciones_accesorios.
--    `estado` es una columna GENERADA: no se puede desincronizar de
--    fecha_devolucion (activa <=> fecha_devolucion IS NULL).
-- ---------------------------------------------------------------------------
RENAME TABLE asignaciones TO asignaciones_equipos;

ALTER TABLE asignaciones_equipos
  ADD COLUMN estado VARCHAR(10)
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, 'activa', 'devuelta')) STORED AFTER fecha_devolucion,
  ADD INDEX idx_asig_equipos_estado (estado),
  ADD INDEX idx_asig_equipos_historial (equipo_id, fecha_asignacion);

-- ---------------------------------------------------------------------------
-- 4. ACCESORIOS (periféricos y consumibles individuales)
--    * numero_serie puede ser NULL (Mouse M185) -> por eso existe el codigo
--      interno ACC-00001, que SIEMPRE identifica la pieza.
--    * Sin columna `activo`: "dado de baja" es estado = 'baja' (+ fecha_baja).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accesorios (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_inventario VARCHAR(60)  NOT NULL,
  tipo_accesorio_id INT UNSIGNED NOT NULL,
  nombre            VARCHAR(150) NOT NULL,          -- "Mouse Logitech M185"
  marca             VARCHAR(80)  NULL,
  modelo            VARCHAR(120) NULL,
  numero_serie      VARCHAR(120) NULL,
  estado            ENUM('disponible','asignado','mantenimiento','reparacion','baja','perdido')
                    NOT NULL DEFAULT 'disponible',
  fecha_compra      DATE NULL,
  garantia_vence    DATE NULL,
  observaciones     TEXT NULL,
  imagen            VARCHAR(255) NULL,
  fecha_baja        DATE NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_accesorios_codigo UNIQUE (codigo_inventario),
  CONSTRAINT uq_accesorios_serie  UNIQUE (numero_serie),
  CONSTRAINT fk_accesorios_tipo FOREIGN KEY (tipo_accesorio_id) REFERENCES tipos_accesorio(id) ON DELETE RESTRICT,
  INDEX idx_accesorios_estado (estado),
  INDEX idx_accesorios_marca (marca)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 5. ASIGNACIONES DE ACCESORIOS (misma forma que las de equipos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones_accesorios (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  accesorio_id             INT UNSIGNED NOT NULL,
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

  -- Un accesorio tiene como maximo UN responsable vigente (mismo truco que equipos).
  accesorio_vigente_id INT UNSIGNED
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, accesorio_id, NULL)) STORED,

  CONSTRAINT uq_asig_accesorios_vigente UNIQUE (accesorio_vigente_id),
  CONSTRAINT fk_asig_accesorios_accesorio   FOREIGN KEY (accesorio_id)   REFERENCES accesorios(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_asig_accesorios_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asig_accesorios_asignado_por FOREIGN KEY (asignado_por)  REFERENCES users(id)        ON DELETE SET NULL,
  CONSTRAINT fk_asig_accesorios_recibido_por FOREIGN KEY (recibido_por)  REFERENCES users(id)        ON DELETE SET NULL,
  CONSTRAINT chk_asig_accesorios_fechas CHECK (fecha_devolucion IS NULL OR fecha_devolucion >= fecha_asignacion),
  INDEX idx_asig_accesorios_colaborador (colaborador_id, fecha_devolucion),
  INDEX idx_asig_accesorios_historial (accesorio_id, fecha_asignacion),
  INDEX idx_asig_accesorios_estado (estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 6. Vista para cartas responsivas: todo lo que un colaborador tiene HOY
--    (equipos + accesorios en una sola consulta).
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
   WHERE a.fecha_devolucion IS NULL;
