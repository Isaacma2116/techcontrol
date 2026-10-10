-- ============================================================================
-- 006 - MANTENIMIENTOS (preventivos y correctivos) con calendario
--
--   colaboradores ... (sin relacion directa: el mantenimiento es de la UNIDAD)
--
--   mantenimientos >── equipos | accesorios | impresoras | celulares
--        │                (una sola FK real por fila, como cartas_responsivas_items)
--        ├──< mantenimientos_componentes   (RAM, disco, bateria... que se cambiaron)
--        └── reprogramado_de >── mantenimientos   (historial de cambios de fecha)
--
--   * Se agenda por DIA (fecha_programada) con hora opcional: el calendario del
--     modulo es mensual y los mantenimientos rara vez tienen hora exacta.
--   * `motivo` = lo que se va a hacer (al agendar).
--     `trabajo_realizado` = lo que SE HIZO ese dia (al cerrarlo).
--   * "Vencido" NO se guarda: es estado 'programado' con fecha anterior a hoy
--     (mismo criterio que el resto del sistema: lo derivado se calcula).
--   * Reprogramar NO pierde la fecha anterior: se cierra la cita como
--     'reprogramado' y la nueva apunta a ella con `reprogramado_de`.
--   * NO cambia el estado del inventario (un equipo puede estar asignado y en
--     mantenimiento a la vez). El estado se sigue cambiando a mano donde ya existe.
--   * Nada se borra: cancelar es estado = 'cancelado' + motivo.
--
--   Migracion ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Vista de unidades del inventario (las cuatro tablas en una sola forma)
--    Sirve para resolver "que unidad es" en una sola consulta, sin cuatro
--    LEFT JOIN repetidos en cada listado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_recursos_inventario AS
  SELECT 'EQUIPO' AS tipo_recurso, e.id AS item_id, e.codigo_inventario,
         TRIM(CONCAT_WS(' ', e.marca, e.modelo)) AS titulo, t.nombre AS tipo, e.estado
    FROM equipos e
    JOIN tipos_equipo t ON t.id = e.tipo_equipo_id
  UNION ALL
  SELECT 'ACCESORIO', a.id, a.codigo_inventario,
         a.nombre, t.nombre, a.estado
    FROM accesorios a
    JOIN tipos_accesorio t ON t.id = a.tipo_accesorio_id
  UNION ALL
  SELECT 'IMPRESORA', p.id, p.codigo_inventario,
         TRIM(CONCAT_WS(' ', p.marca, p.modelo)), t.nombre, p.estado
    FROM impresoras p
    JOIN tipos_impresora t ON t.id = p.tipo_impresora_id
  UNION ALL
  SELECT 'CELULAR', c.id, c.codigo_inventario,
         TRIM(CONCAT_WS(' ', c.marca, c.modelo)), 'Celular', c.estado
    FROM celulares c;

-- ---------------------------------------------------------------------------
-- 2. MANTENIMIENTOS
--    folio = MNT-2026-000001 (visible); anio + consecutivo lo generan.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantenimientos (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio              VARCHAR(30) NOT NULL,
  anio               SMALLINT UNSIGNED NOT NULL,
  consecutivo        INT UNSIGNED NOT NULL,

  tipo               ENUM('preventivo','correctivo') NOT NULL,
  tipo_recurso       ENUM('EQUIPO','ACCESORIO','IMPRESORA','CELULAR') NOT NULL,
  equipo_id          INT UNSIGNED NULL,
  accesorio_id       INT UNSIGNED NULL,
  impresora_id       INT UNSIGNED NULL,
  celular_id         INT UNSIGNED NULL,

  estado             ENUM('programado','en_proceso','realizado','reprogramado','cancelado')
                       NOT NULL DEFAULT 'programado',
  prioridad          ENUM('alta','media','baja') NOT NULL DEFAULT 'media',

  fecha_programada   DATE NOT NULL,
  hora_programada    TIME NULL,
  motivo             TEXT NULL,                      -- que se va a hacer
  fecha_realizado    DATE NULL,
  trabajo_realizado  TEXT NULL,                      -- que se hizo ese dia
  costo              DECIMAL(10,2) UNSIGNED NULL,
  proveedor          VARCHAR(150) NULL,              -- si lo hizo un tercero
  responsable_id     INT UNSIGNED NULL,              -- usuario del sistema que lo atiende
  reprogramado_de    INT UNSIGNED NULL,
  motivo_cancelacion VARCHAR(255) NULL,
  observaciones      TEXT NULL,

  creado_por         INT UNSIGNED NULL,
  actualizado_por    INT UNSIGNED NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Id de la unidad sin importar su tipo: simplifica los JOIN y permite indexarlo.
  recurso_id INT UNSIGNED
    GENERATED ALWAYS AS (COALESCE(equipo_id, accesorio_id, impresora_id, celular_id)) STORED,

  CONSTRAINT uq_mant_folio       UNIQUE (folio),
  CONSTRAINT uq_mant_consecutivo UNIQUE (anio, consecutivo),

  CONSTRAINT fk_mant_equipo      FOREIGN KEY (equipo_id)       REFERENCES equipos(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_mant_accesorio   FOREIGN KEY (accesorio_id)    REFERENCES accesorios(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_mant_impresora   FOREIGN KEY (impresora_id)    REFERENCES impresoras(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_mant_celular     FOREIGN KEY (celular_id)      REFERENCES celulares(id)       ON DELETE RESTRICT,
  CONSTRAINT fk_mant_responsable FOREIGN KEY (responsable_id)  REFERENCES users(id)           ON DELETE SET NULL,
  CONSTRAINT fk_mant_reprog      FOREIGN KEY (reprogramado_de) REFERENCES mantenimientos(id)  ON DELETE SET NULL,
  CONSTRAINT fk_mant_creado_por  FOREIGN KEY (creado_por)      REFERENCES users(id)           ON DELETE SET NULL,
  CONSTRAINT fk_mant_actualizado FOREIGN KEY (actualizado_por) REFERENCES users(id)           ON DELETE SET NULL,

  -- Exactamente UNA unidad por mantenimiento.
  CONSTRAINT chk_mant_una_unidad CHECK (
    (equipo_id IS NOT NULL) + (accesorio_id IS NOT NULL) +
    (impresora_id IS NOT NULL) + (celular_id IS NOT NULL) = 1
  ),
  -- Un mantenimiento realizado siempre dice cuando y que se hizo.
  CONSTRAINT chk_mant_realizado CHECK (
    estado <> 'realizado' OR (fecha_realizado IS NOT NULL AND trabajo_realizado IS NOT NULL)
  ),

  INDEX idx_mant_calendario (fecha_programada, estado),
  INDEX idx_mant_estado (estado, fecha_programada),
  INDEX idx_mant_unidad (tipo_recurso, recurso_id, fecha_programada),
  INDEX idx_mant_tipo (tipo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. COMPONENTES CAMBIADOS EN EL MANTENIMIENTO
--    Complementan a `trabajo_realizado` (que es el texto de lo que se hizo):
--    aqui queda cada pieza por separado para poder consultarla despues
--    ("a que equipos les cambiamos RAM este anio").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantenimientos_componentes (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mantenimiento_id INT UNSIGNED NOT NULL,
  accion           ENUM('instalado','reemplazado','retirado','actualizado','limpiado','revisado') NOT NULL,
  componente       VARCHAR(100) NOT NULL,            -- RAM, disco duro, bateria, teclado...
  detalle          VARCHAR(255) NULL,                -- "8 GB DDR4 -> 16 GB DDR4"
  numero_serie     VARCHAR(120) NULL,
  costo            DECIMAL(10,2) UNSIGNED NULL,
  orden            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_mant_comp_mantenimiento FOREIGN KEY (mantenimiento_id)
    REFERENCES mantenimientos(id) ON DELETE CASCADE,
  INDEX idx_mant_comp_mantenimiento (mantenimiento_id, orden),
  INDEX idx_mant_comp_componente (componente)
) ENGINE=InnoDB;
