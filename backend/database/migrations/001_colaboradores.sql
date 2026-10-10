-- Migracion 001: modulo Colaboradores
-- Solo CREA tablas nuevas (IF NOT EXISTS). No modifica ni borra nada existente.
--
--   areas ──┐
--   cargos ─┴─< colaboradores >──< asignaciones >── equipos >── tipos_equipo
--                                      └── users (asignado_por / recibido_por)

-- ---------------------------------------------------------------
-- Catalogos
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_areas_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cargos (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_cargos_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_equipo (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  CONSTRAINT uq_tipos_equipo_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_equipo (nombre) VALUES
  ('Laptop'), ('PC'), ('Monitor'), ('Teclado'), ('Mouse'),
  ('Celular'), ('Impresora'), ('Otro');

-- ---------------------------------------------------------------
-- Colaboradores
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colaboradores (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_empleado          VARCHAR(30)  NOT NULL,
  nombre               VARCHAR(100) NOT NULL,
  apellido_paterno     VARCHAR(100) NOT NULL,
  apellido_materno     VARCHAR(100) NULL,
  area_id              INT UNSIGNED NOT NULL,
  cargo_id             INT UNSIGNED NOT NULL,
  correo_empresarial   VARCHAR(190) NULL,
  telefono_empresarial VARCHAR(25)  NULL,
  correo_personal      VARCHAR(190) NULL,
  telefono_personal    VARCHAR(25)  NULL,
  fotografia           VARCHAR(255) NULL,          -- nombre de archivo en /uploads/colaboradores
  fecha_alta           DATE NOT NULL,
  fecha_baja           DATE NULL,
  activo               TINYINT(1) NOT NULL DEFAULT 1,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- MySQL permite varios NULL en un UNIQUE: el correo es opcional pero no se repite.
  CONSTRAINT uq_colaboradores_id_empleado UNIQUE (id_empleado),
  CONSTRAINT uq_colaboradores_correo_empresarial UNIQUE (correo_empresarial),
  CONSTRAINT fk_colaboradores_area  FOREIGN KEY (area_id)  REFERENCES areas(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_colaboradores_cargo FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE RESTRICT,
  INDEX idx_colaboradores_area (area_id),
  INDEX idx_colaboradores_cargo (cargo_id),
  INDEX idx_colaboradores_activo (activo),
  INDEX idx_colaboradores_nombre (apellido_paterno, nombre)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Equipos (version minima: el modulo de Equipos la ampliara despues)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_equipo_id    INT UNSIGNED NOT NULL,
  marca             VARCHAR(80)  NULL,
  modelo            VARCHAR(120) NULL,
  numero_inventario VARCHAR(60)  NOT NULL,
  numero_serie      VARCHAR(120) NULL,
  estado            ENUM('disponible','asignado','mantenimiento','baja') NOT NULL DEFAULT 'disponible',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_equipos_inventario UNIQUE (numero_inventario),
  CONSTRAINT fk_equipos_tipo FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipo(id) ON DELETE RESTRICT,
  INDEX idx_equipos_estado (estado),
  INDEX idx_equipos_serie (numero_serie)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Asignaciones: Colaborador -> Asignacion -> Equipo
-- Una fila por entrega. fecha_devolucion NULL = asignacion vigente.
-- El historial es simplemente el conjunto de filas del colaborador;
-- nunca se sobrescribe ni se borra (base de las cartas responsivas).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones (
  id                         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  colaborador_id             INT UNSIGNED NOT NULL,
  equipo_id                  INT UNSIGNED NOT NULL,
  fecha_asignacion           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion           DATETIME NULL,
  asignado_por               INT UNSIGNED NULL,       -- users.id que entrego el equipo
  recibido_por               INT UNSIGNED NULL,       -- users.id que recibio la devolucion
  observaciones_asignacion   TEXT NULL,
  observaciones_devolucion   TEXT NULL,
  condicion_devolucion       ENUM('bueno','regular','danado','perdido') NULL,
  created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Garantiza a nivel de BD que un equipo tenga como maximo UNA asignacion vigente:
  -- vale equipo_id mientras no se devuelve y NULL despues (los NULL no chocan en UNIQUE).
  equipo_vigente_id INT UNSIGNED
    GENERATED ALWAYS AS (IF(fecha_devolucion IS NULL, equipo_id, NULL)) STORED,

  CONSTRAINT uq_asignaciones_equipo_vigente UNIQUE (equipo_vigente_id),
  CONSTRAINT fk_asignaciones_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asignaciones_equipo      FOREIGN KEY (equipo_id)      REFERENCES equipos(id)       ON DELETE RESTRICT,
  CONSTRAINT fk_asignaciones_asignado_por FOREIGN KEY (asignado_por)  REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT fk_asignaciones_recibido_por FOREIGN KEY (recibido_por)  REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT chk_asignaciones_fechas CHECK (fecha_devolucion IS NULL OR fecha_devolucion >= fecha_asignacion),
  INDEX idx_asignaciones_colaborador (colaborador_id, fecha_devolucion),
  INDEX idx_asignaciones_equipo (equipo_id)
) ENGINE=InnoDB;
