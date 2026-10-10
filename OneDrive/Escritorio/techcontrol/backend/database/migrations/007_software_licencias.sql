-- ============================================================================
-- 007 - SOFTWARE Y LICENCIAS (fase 1: catalogo, licencias y asignaciones)
--
--   proveedores ──┬──< software >── categorias_software
--                 │       │
--                 └──< licencias >── modelos_licencia
--                          │
--                          └──< asignaciones_licencias >── colaboradores
--                                          └──────────────── equipos
--                 licencias.renovacion_de_id ──> licencias (historial de renovaciones)
--
--   * `software` es el PROGRAMA (AutoCAD); `licencias` es cada CONTRATO/COMPRA
--     de ese programa (puede haber varias licencias del mismo software, con
--     distinta cantidad de puestos y vigencia).
--   * Lo que se ALMACENA es `cantidad_total`; "utilizadas" y "disponibles" se
--     CALCULAN a partir de `asignaciones_licencias` (igual que en el resto del
--     inventario: el responsable actual nunca se guarda, se deriva de la
--     asignacion vigente). La vista `v_licencias_uso` hace ese calculo una vez.
--   * `asignaciones_licencias` puede apuntar a un colaborador, a un equipo o a
--     ambos (segun el modelo de licencia); nunca se borra: liberar es poner
--     `fecha_liberacion`, lo que permite reasignar la licencia despues y deja
--     el historial completo (incluidas las licencias que se mueven de equipo).
--   * `modelos_licencia` es un catalogo CON COMPORTAMIENTO (no un ENUM fijo):
--     agregar un modelo nuevo es una fila, no una migracion. `ambito` dice que
--     pide la asignacion (colaborador, equipo o ambos); `temporalidad` dice si
--     el vencimiento aplica.
--   * Nada se borra fisicamente: los estados (`activo`/`descontinuado`,
--     `activa`/`suspendida`/`cancelada`) reemplazan al DELETE.
--
--   Fuera de esta migracion (fases siguientes, no se crean tablas vacias hoy):
--   instalaciones_software, documentos_licencias, licencias_claves,
--   credenciales_software.
--
--   Migracion ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROVEEDORES (fabricante y/o distribuidor; una licencia puede usar el
--    mismo proveedor para ambos roles, o dos proveedores distintos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(150) NOT NULL,
  rfc              VARCHAR(20)  NULL,
  contacto_nombre  VARCHAR(150) NULL,
  telefono         VARCHAR(25)  NULL,
  correo           VARCHAR(190) NULL,
  sitio_web        VARCHAR(190) NULL,
  notas            TEXT NULL,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_proveedores_nombre UNIQUE (nombre),
  INDEX idx_proveedores_activo (activo)
) ENGINE=InnoDB;

INSERT IGNORE INTO proveedores (nombre) VALUES
  ('Microsoft'), ('Adobe'), ('Autodesk'), ('Google');

-- ---------------------------------------------------------------------------
-- 2. CATEGORIAS DE SOFTWARE (catalogo simple, mismo patron que tipos_equipo:
--    lo consulta cualquier usuario, lo crea admin/tecnico via /api/catalogos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_software (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  CONSTRAINT uq_categorias_software_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO categorias_software (nombre) VALUES
  ('Ofimática'), ('Diseño gráfico'), ('Ingeniería y CAD'), ('Desarrollo'),
  ('Seguridad'), ('Comunicación y colaboración'), ('Sistema operativo'),
  ('Utilerías'), ('Otro');

-- ---------------------------------------------------------------------------
-- 3. MODELOS DE LICENCIA (catalogo CON COMPORTAMIENTO; ver cabecera).
--    codigo se usa en el codigo/validaciones; nombre es lo que se muestra.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos_licencia (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo                  VARCHAR(30) NOT NULL,
  nombre                  VARCHAR(80) NOT NULL,
  -- Que pide la asignacion: 'usuario' (colaborador), 'dispositivo' (equipo), 'ambos' (uno, otro o los dos).
  ambito                  ENUM('usuario','dispositivo','ambos') NOT NULL DEFAULT 'ambos',
  -- Si el vencimiento aplica ('perpetua' lo oculta y lo fuerza a NULL).
  temporalidad            ENUM('perpetua','suscripcion') NOT NULL DEFAULT 'suscripcion',
  -- Si mover la licencia a otro equipo/usuario exige liberarla primero (informativo hoy).
  requiere_desactivacion  TINYINT(1) NOT NULL DEFAULT 0,
  activo                  TINYINT(1) NOT NULL DEFAULT 1,
  orden                   SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  CONSTRAINT uq_modelos_licencia_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

INSERT IGNORE INTO modelos_licencia (codigo, nombre, ambito, temporalidad, requiere_desactivacion, orden) VALUES
  ('perpetua',            'Perpetua',              'ambos',       'perpetua',    0, 10),
  ('suscripcion_mensual', 'Suscripción mensual',   'ambos',       'suscripcion', 0, 20),
  ('suscripcion_anual',   'Suscripción anual',     'ambos',       'suscripcion', 0, 30),
  ('por_usuario',         'Por usuario',           'usuario',     'suscripcion', 0, 40),
  ('por_dispositivo',     'Por dispositivo',       'dispositivo', 'suscripcion', 1, 50),
  ('volumen',             'Por volumen',           'ambos',       'suscripcion', 0, 60),
  ('concurrente',         'Concurrente',           'usuario',     'suscripcion', 0, 70),
  ('por_activacion',      'Por activación',        'dispositivo', 'suscripcion', 1, 80),
  ('otro',                'Otro',                  'ambos',       'suscripcion', 0, 90);

-- ---------------------------------------------------------------------------
-- 4. SOFTWARE (el programa; NO una licencia especifica)
--    "requiere_licencia" en 0 = software gratuito/open source/freeware: se
--    puede registrar e instalar sin que el sistema pida una licencia.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS software (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  fabricante_id       INT UNSIGNED NULL,
  categoria_id        INT UNSIGNED NULL,
  tipo                ENUM('comercial','gratuito','open_source','freeware','interno','otro') NOT NULL DEFAULT 'comercial',
  version_referencia  VARCHAR(40)  NULL,       -- version tipica/actual; cada instalacion puede tener la suya (fase 2)
  requiere_licencia   TINYINT(1) NOT NULL DEFAULT 1,
  requiere_activacion TINYINT(1) NOT NULL DEFAULT 0,
  sitio_web           VARCHAR(190) NULL,
  descripcion         VARCHAR(500) NULL,
  observaciones       TEXT NULL,
  estado              ENUM('activo','descontinuado','no_permitido') NOT NULL DEFAULT 'activo',
  creado_por          INT UNSIGNED NULL,
  actualizado_por     INT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Mismo nombre y mismo fabricante no se repite (fabricante_id puede ser NULL:
  -- una columna GENERADA evita que dos filas con NULL "no choquen" en el UNIQUE).
  clave_unica VARCHAR(191)
    GENERATED ALWAYS AS (CONCAT(LOWER(nombre), ':', COALESCE(fabricante_id, 0))) STORED,

  CONSTRAINT uq_software_clave UNIQUE (clave_unica),
  CONSTRAINT fk_software_fabricante FOREIGN KEY (fabricante_id)   REFERENCES proveedores(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_software_categoria  FOREIGN KEY (categoria_id)    REFERENCES categorias_software(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_software_creado_por FOREIGN KEY (creado_por)      REFERENCES users(id)                ON DELETE SET NULL,
  CONSTRAINT fk_software_actualizado FOREIGN KEY (actualizado_por) REFERENCES users(id)               ON DELETE SET NULL,

  INDEX idx_software_nombre (nombre),
  INDEX idx_software_categoria (categoria_id),
  INDEX idx_software_estado (estado),
  INDEX idx_software_requiere_licencia (requiere_licencia)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 5. LICENCIAS (un contrato/compra de un software; un software puede tener
--    varias licencias con distinta cantidad de puestos y vigencia)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licencias (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo                 VARCHAR(30) NOT NULL,          -- LIC-00001
  software_id            INT UNSIGNED NOT NULL,
  proveedor_id           INT UNSIGNED NULL,
  modelo_id              INT UNSIGNED NOT NULL,
  cantidad_total         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  activaciones_maximas   SMALLINT UNSIGNED NULL,        -- limite adicional (p. ej. licencias por activacion)
  transferible           TINYINT(1) NOT NULL DEFAULT 1,
  fecha_compra           DATE NULL,
  fecha_inicio           DATE NULL,
  fecha_vencimiento      DATE NULL,                     -- NULL en perpetuas
  periodicidad           ENUM('unica','mensual','anual','bianual','otro') NOT NULL DEFAULT 'unica',
  renovacion_automatica  TINYINT(1) NOT NULL DEFAULT 0,
  costo                  DECIMAL(12,2) UNSIGNED NULL,
  moneda                 CHAR(3) NOT NULL DEFAULT 'MXN',
  numero_contrato        VARCHAR(80) NULL,
  numero_factura         VARCHAR(80) NULL,
  renovacion_de_id       INT UNSIGNED NULL,             -- licencia anterior, si esta es su renovacion
  estado                 ENUM('activa','suspendida','cancelada') NOT NULL DEFAULT 'activa',
  observaciones          TEXT NULL,
  creado_por             INT UNSIGNED NULL,
  actualizado_por        INT UNSIGNED NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_licencias_codigo UNIQUE (codigo),
  CONSTRAINT fk_licencias_software    FOREIGN KEY (software_id)      REFERENCES software(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_licencias_proveedor   FOREIGN KEY (proveedor_id)     REFERENCES proveedores(id)       ON DELETE RESTRICT,
  CONSTRAINT fk_licencias_modelo      FOREIGN KEY (modelo_id)        REFERENCES modelos_licencia(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_licencias_renovacion  FOREIGN KEY (renovacion_de_id) REFERENCES licencias(id)         ON DELETE SET NULL,
  CONSTRAINT fk_licencias_creado_por  FOREIGN KEY (creado_por)       REFERENCES users(id)             ON DELETE SET NULL,
  CONSTRAINT fk_licencias_actualizado FOREIGN KEY (actualizado_por)  REFERENCES users(id)             ON DELETE SET NULL,

  CONSTRAINT chk_licencias_fechas    CHECK (fecha_inicio IS NULL OR fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_inicio),
  CONSTRAINT chk_licencias_cantidad  CHECK (cantidad_total >= 1),

  INDEX idx_licencias_software (software_id),
  INDEX idx_licencias_vencimiento (fecha_vencimiento, estado),
  INDEX idx_licencias_estado (estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 6. ASIGNACIONES DE LICENCIAS (quien/que usa cada puesto; historial completo,
--    incluidas las licencias que se mueven de un equipo a otro)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones_licencias (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  licencia_id               INT UNSIGNED NOT NULL,
  colaborador_id            INT UNSIGNED NULL,
  equipo_id                 INT UNSIGNED NULL,
  fecha_asignacion          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_liberacion          DATETIME NULL,
  estado VARCHAR(10)
    GENERATED ALWAYS AS (IF(fecha_liberacion IS NULL, 'activa', 'liberada')) STORED,
  identificador_activacion  VARCHAR(150) NULL,           -- correo/equipo donde quedo activada (licencias por activacion)
  observaciones_asignacion  TEXT NULL,
  observaciones_liberacion  TEXT NULL,
  asignado_por              INT UNSIGNED NULL,
  liberado_por              INT UNSIGNED NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Mientras esta vigente: la misma licencia no se asigna dos veces al mismo
  -- colaborador ni al mismo equipo (mismo truco que asignaciones_equipos).
  vigente_colaborador VARCHAR(40)
    GENERATED ALWAYS AS (IF(fecha_liberacion IS NULL AND colaborador_id IS NOT NULL, CONCAT(licencia_id, ':C:', colaborador_id), NULL)) STORED,
  vigente_equipo VARCHAR(40)
    GENERATED ALWAYS AS (IF(fecha_liberacion IS NULL AND equipo_id IS NOT NULL, CONCAT(licencia_id, ':E:', equipo_id), NULL)) STORED,

  CONSTRAINT uq_asig_lic_colaborador UNIQUE (vigente_colaborador),
  CONSTRAINT uq_asig_lic_equipo      UNIQUE (vigente_equipo),
  CONSTRAINT fk_asig_lic_licencia     FOREIGN KEY (licencia_id)     REFERENCES licencias(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_asig_lic_colaborador  FOREIGN KEY (colaborador_id)  REFERENCES colaboradores(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_asig_lic_equipo       FOREIGN KEY (equipo_id)       REFERENCES equipos(id)        ON DELETE RESTRICT,
  CONSTRAINT fk_asig_lic_asignado_por FOREIGN KEY (asignado_por)    REFERENCES users(id)          ON DELETE SET NULL,
  CONSTRAINT fk_asig_lic_liberado_por FOREIGN KEY (liberado_por)    REFERENCES users(id)          ON DELETE SET NULL,
  CONSTRAINT chk_asig_lic_destino CHECK (colaborador_id IS NOT NULL OR equipo_id IS NOT NULL),

  INDEX idx_asig_lic_licencia (licencia_id, fecha_liberacion),
  INDEX idx_asig_lic_colaborador (colaborador_id, fecha_liberacion),
  INDEX idx_asig_lic_equipo (equipo_id, fecha_liberacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 7. Vista: puestos usados/disponibles y estado efectivo de cada licencia.
--    "utilizadas"/"disponibles" NUNCA se guardan: se calculan aqui a partir de
--    las asignaciones vigentes, igual que el resto del inventario.
--    El corte de "por_vencer" es amplio (90 dias) a proposito: los umbrales
--    finos (90/60/30/7) para las alertas se aplican en la aplicacion sobre
--    `dias_para_vencer`, no aqui.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_licencias_uso AS
  SELECT
    l.id AS licencia_id,
    l.cantidad_total,
    COALESCE(u.utilizadas, 0) AS utilizadas,
    l.cantidad_total - COALESCE(u.utilizadas, 0) AS disponibles,
    DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
    CASE
      WHEN l.estado = 'cancelada' THEN 'cancelada'
      WHEN l.estado = 'suspendida' THEN 'suspendida'
      WHEN l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento < CURDATE() THEN 'vencida'
      WHEN (l.cantidad_total - COALESCE(u.utilizadas, 0)) <= 0 THEN 'agotada'
      WHEN l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento <= CURDATE() + INTERVAL 90 DAY THEN 'por_vencer'
      ELSE 'activa'
    END AS estado_efectivo
  FROM licencias l
  LEFT JOIN (
    SELECT licencia_id, COUNT(*) AS utilizadas
      FROM asignaciones_licencias
     WHERE fecha_liberacion IS NULL
     GROUP BY licencia_id
  ) u ON u.licencia_id = l.id;
