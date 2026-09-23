-- ============================================================================
-- Migracion 004: Cartas responsivas y configuracion de la empresa
--
-- ADITIVA e IDEMPOTENTE (CREATE ... IF NOT EXISTS / INSERT IGNORE). No modifica ni
-- borra ninguna tabla o dato existente; las asignaciones (002/003) quedan intactas.
--
--   configuracion_empresa (1 fila)
--
--   colaboradores ─< cartas_responsivas ─< cartas_responsivas_items >── asignaciones_{equipos|accesorios|impresoras|celulares}
--                            └─< cartas_responsivas_documentos          (el recurso se obtiene a traves de la asignacion)
--
--   * La carta apunta a la ASIGNACION (no al recurso): asi conserva a quien se lo
--     entrego y cuando, aunque despues el recurso pase a otro colaborador.
--   * Una carta puede cubrir varios recursos del mismo colaborador (plantilla "general").
--   * Los archivos NO se guardan en la base: solo su nombre (aleatorio), tipo,
--     tamano y sha256. Viven en backend/storage/ y se sirven solo por endpoints.
--   * El historial de cada carta se guarda en `audit_logs` (entity = 'carta_responsiva').
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Datos de la empresa (una sola fila, id = 1). Una instalacion = una empresa.
--    Los textos NULL usan el texto por defecto del sistema (editable en Configuracion).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id                TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL DEFAULT 'Mi empresa',
  rfc               VARCHAR(20)  NULL,
  direccion         VARCHAR(255) NULL,
  telefono          VARCHAR(25)  NULL,
  correo            VARCHAR(190) NULL,
  sitio_web         VARCHAR(190) NULL,
  logo              VARCHAR(100) NULL,               -- nombre de archivo en storage/empresa
  pie_documento     VARCHAR(255) NULL,
  entrega_nombre    VARCHAR(150) NULL,               -- quien normalmente entrega los recursos
  entrega_cargo     VARCHAR(150) NULL,
  folio_prefijo     VARCHAR(10)  NOT NULL DEFAULT 'CR',
  texto_declaracion TEXT NULL,
  texto_condiciones TEXT NULL,
  updated_by        INT UNSIGNED NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_configuracion_empresa_unica CHECK (id = 1),
  CONSTRAINT fk_configuracion_empresa_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO configuracion_empresa (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- 2. Cartas responsivas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cartas_responsivas (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio                     VARCHAR(30)  NOT NULL,             -- CR-2026-000001
  anio                      SMALLINT UNSIGNED NOT NULL,
  consecutivo               INT UNSIGNED NOT NULL,             -- reinicia cada anio
  colaborador_id            INT UNSIGNED NOT NULL,
  plantilla                 ENUM('equipo','celular','impresora','accesorio','general') NOT NULL,
  estado                    ENUM('borrador','generada','pendiente_firma','firmada','cancelada')
                            NOT NULL DEFAULT 'borrador',
  fecha_entrega             DATE NOT NULL,
  fecha_devolucion_esperada DATE NULL,
  observaciones             TEXT NULL,
  condiciones_especiales    TEXT NULL,
  entrega_nombre            VARCHAR(150) NULL,
  entrega_cargo             VARCHAR(150) NULL,
  -- Se congelan al generar el PDF: un documento firmado no debe cambiar si despues
  -- se corrige un dato del colaborador, de la empresa o del recurso.
  colaborador_snapshot      JSON NULL,
  empresa_snapshot          JSON NULL,
  fecha_firma               DATE NULL,
  generada_en               DATETIME NULL,
  generada_por              INT UNSIGNED NULL,
  cancelada_en              DATETIME NULL,
  cancelada_por             INT UNSIGNED NULL,
  motivo_cancelacion        VARCHAR(500) NULL,
  creado_por                INT UNSIGNED NULL,
  actualizado_por           INT UNSIGNED NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_cartas_folio UNIQUE (folio),
  CONSTRAINT uq_cartas_anio_consecutivo UNIQUE (anio, consecutivo),
  CONSTRAINT fk_cartas_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_creado_por      FOREIGN KEY (creado_por)      REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cartas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cartas_generada_por    FOREIGN KEY (generada_por)    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cartas_cancelada_por   FOREIGN KEY (cancelada_por)   REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_cartas_fechas CHECK (fecha_devolucion_esperada IS NULL OR fecha_devolucion_esperada >= fecha_entrega),
  INDEX idx_cartas_estado (estado),
  INDEX idx_cartas_colaborador (colaborador_id),
  INDEX idx_cartas_fecha_entrega (fecha_entrega)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. Recursos que cubre cada carta: exactamente UNA asignacion por fila.
--    Cuatro claves foraneas reales (una por tipo de recurso) en vez de una relacion
--    "polimorfica" sin integridad. Un recurso nuevo = una columna + una entrada de config.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cartas_responsivas_items (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carta_id                INT UNSIGNED NOT NULL,
  tipo_recurso            ENUM('EQUIPO','ACCESORIO','IMPRESORA','CELULAR') NOT NULL,
  asignacion_equipo_id    INT UNSIGNED NULL,
  asignacion_accesorio_id INT UNSIGNED NULL,
  asignacion_impresora_id INT UNSIGNED NULL,
  asignacion_celular_id   INT UNSIGNED NULL,
  snapshot                JSON NULL,                  -- datos del recurso al generar el PDF
  activo                  TINYINT(1) NOT NULL DEFAULT 1,   -- 0 al cancelar la carta: libera la asignacion
  orden                   SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  -- Una asignacion solo puede estar en UNA carta no cancelada.
  asignacion_clave VARCHAR(30)
    GENERATED ALWAYS AS (
      IF(activo = 1,
         CONCAT(tipo_recurso, ':',
                COALESCE(asignacion_equipo_id, asignacion_accesorio_id, asignacion_impresora_id, asignacion_celular_id)),
         NULL)
    ) STORED,

  CONSTRAINT uq_cartas_items_asignacion UNIQUE (asignacion_clave),
  CONSTRAINT fk_cartas_items_carta       FOREIGN KEY (carta_id)                REFERENCES cartas_responsivas(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_items_asig_equipo FOREIGN KEY (asignacion_equipo_id)    REFERENCES asignaciones_equipos(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_items_asig_acc    FOREIGN KEY (asignacion_accesorio_id) REFERENCES asignaciones_accesorios(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_items_asig_imp    FOREIGN KEY (asignacion_impresora_id) REFERENCES asignaciones_impresoras(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_items_asig_cel    FOREIGN KEY (asignacion_celular_id)   REFERENCES asignaciones_celulares(id)   ON DELETE RESTRICT,
  CONSTRAINT chk_cartas_items_una_asignacion CHECK (
    (asignacion_equipo_id IS NOT NULL) + (asignacion_accesorio_id IS NOT NULL) +
    (asignacion_impresora_id IS NOT NULL) + (asignacion_celular_id IS NOT NULL) = 1
  ),
  INDEX idx_cartas_items_carta (carta_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 4. Documentos (PDF generado, carta firmada escaneada...) con versiones.
--    Reemplazar un documento crea una version nueva; la anterior queda (vigente = 0).
--    `tipo` ya reserva las firmas por separado para una futura firma digital.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cartas_responsivas_documentos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carta_id        INT UNSIGNED NOT NULL,
  tipo            ENUM('generado','firmado','firma_colaborador','firma_entrega') NOT NULL,
  version         INT UNSIGNED NOT NULL DEFAULT 1,
  vigente         TINYINT(1) NOT NULL DEFAULT 1,
  archivo         VARCHAR(100) NOT NULL,              -- nombre aleatorio en storage/cartas (nunca la ruta)
  nombre_original VARCHAR(255) NULL,
  mime            VARCHAR(100) NOT NULL,
  tamano          INT UNSIGNED NOT NULL,
  sha256          CHAR(64) NOT NULL,
  subido_por      INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Un solo documento vigente por carta y tipo.
  vigente_clave VARCHAR(40)
    GENERATED ALWAYS AS (IF(vigente = 1, CONCAT(carta_id, ':', tipo), NULL)) STORED,

  CONSTRAINT uq_cartas_docs_vigente UNIQUE (vigente_clave),
  CONSTRAINT uq_cartas_docs_version UNIQUE (carta_id, tipo, version),
  CONSTRAINT uq_cartas_docs_archivo UNIQUE (archivo),
  CONSTRAINT fk_cartas_docs_carta      FOREIGN KEY (carta_id)   REFERENCES cartas_responsivas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cartas_docs_subido_por FOREIGN KEY (subido_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
