-- ============================================================================
-- 009 - NOTIFICACIONES
--
--   users ──< notificaciones
--
--   * Cada fila es la notificacion de UN usuario concreto (nunca "de un rol"):
--     cuando algo aplica a varios usuarios (p. ej. "3 licencias por vencer" es
--     para todo el personal), se genera UNA fila por usuario activo elegible
--     (fan-out en el INSERT, via `INSERT IGNORE ... SELECT ... FROM users`).
--     `rol_destinatario` queda como dato informativo de para que rol se genero;
--     el destinatario real de esa fila es `usuario_id`.
--   * `clave_dedup` + el UNIQUE (usuario_id, clave_dedup) es lo que evita
--     duplicados: generar la misma alerta dos veces (p. ej. cada vez que se
--     abre el panel) no inserta una segunda fila, solo la primera vez cuenta.
--     Ver backend/models/notificacionModel.js para como se arma esa clave.
--   * `entidad_id` sigue el mismo patron que `audit_logs.entity_id` (texto,
--     no FK: el registro puede ser de varias tablas distintas). `enlace` ya
--     viene resuelto (ruta del frontend) para no duplicar esa logica ahi.
--   * Nada se borra fisicamente (mismo criterio que el resto del sistema):
--     "leida" es un flag, no un DELETE.
--
--   Migracion ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT UNSIGNED NOT NULL,
  tipo             VARCHAR(40)  NOT NULL,
  titulo           VARCHAR(150) NOT NULL,
  mensaje          VARCHAR(500) NOT NULL,
  prioridad        ENUM('critica','advertencia','info') NOT NULL DEFAULT 'info',
  modulo           VARCHAR(40)  NULL,               -- 'equipos' | 'mantenimientos' | 'licencias' | 'redes' ...
  entidad_id       VARCHAR(40)  NULL,                -- id del registro relacionado (texto, como audit_logs.entity_id)
  enlace           VARCHAR(255) NULL,                -- ruta del frontend ya resuelta (a donde lleva la notificacion)
  rol_destinatario ENUM('admin','technician','viewer') NULL,  -- informativo: para que rol se genero
  clave_dedup      VARCHAR(191) NOT NULL,             -- identifica la alerta de origen (evita duplicados)
  leida            TINYINT(1)   NOT NULL DEFAULT 0,
  fecha_leida      DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_notif_dedup UNIQUE (usuario_id, clave_dedup),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_usuario_leida (usuario_id, leida, created_at),
  INDEX idx_notif_usuario_created (usuario_id, created_at)
) ENGINE=InnoDB;
