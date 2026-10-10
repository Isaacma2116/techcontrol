-- ============================================================================
-- Migracion 005: Configuracion (fase 1) - perfil de usuario, sesiones y datos de documentos
--
-- ADITIVA: solo agrega columnas NULLables / con valor por defecto, una tabla nueva e
-- indices. No borra ni modifica datos existentes.
--
--   users                  + nombres, apellidos, telefono, cargo, foto (perfil)
--                          + password_changed_at, must_change_password (seguridad)
--                          + desactivado_en, desactivado_por (baja de cuenta; fase 2)
--   user_sessions          sesiones de inicio de sesion (listar / cerrar otras)
--   configuracion_empresa  + descripcion, formato_fecha, encabezado_documento
--   audit_logs             + indices para consultar por usuario y por accion
--
--   * `users.name` se CONSERVA como nombre visible (lo usan las asignaciones, las cartas,
--     etc.); el codigo lo recalcula a partir de nombres + apellidos.
--   * Los usuarios nunca se borran fisicamente: hay 15 claves foraneas hacia `users`
--     (asignaciones, cartas, auditoria...) y borrar perderia "quien hizo que".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perfil y seguridad de la cuenta
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN nombres             VARCHAR(100) NULL AFTER name,
  ADD COLUMN apellidos           VARCHAR(100) NULL AFTER nombres,
  ADD COLUMN telefono            VARCHAR(25)  NULL,
  ADD COLUMN cargo               VARCHAR(100) NULL,
  ADD COLUMN foto                VARCHAR(255) NULL,          -- nombre de archivo en uploads/usuarios
  ADD COLUMN password_changed_at DATETIME     NULL,
  ADD COLUMN must_change_password TINYINT(1)  NOT NULL DEFAULT 0,
  ADD COLUMN desactivado_en      DATETIME     NULL,
  ADD COLUMN desactivado_por     INT UNSIGNED NULL,
  ADD CONSTRAINT fk_users_desactivado_por FOREIGN KEY (desactivado_por) REFERENCES users(id) ON DELETE SET NULL;

-- Las cuentas existentes conservan su nombre completo como "nombres".
UPDATE users SET nombres = name WHERE nombres IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Sesiones. Cada inicio de sesion crea una fila; el JWT lleva su id (jti) y el
--    middleware `protect` exige que siga vigente (no revocada ni vencida).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id           CHAR(36) NOT NULL PRIMARY KEY,               -- UUID = jti del token
  user_id      INT UNSIGNED NOT NULL,
  user_agent   VARCHAR(255) NULL,
  ip           VARCHAR(45)  NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME NOT NULL,
  revoked_at   DATETIME NULL,

  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sessions_user (user_id, revoked_at),
  INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. Datos de la empresa para documentos
--    (el responsable de TI ya existe como entrega_nombre / entrega_cargo)
-- ---------------------------------------------------------------------------
ALTER TABLE configuracion_empresa
  ADD COLUMN descripcion          VARCHAR(500) NULL,
  ADD COLUMN formato_fecha        ENUM('larga','corta') NOT NULL DEFAULT 'larga',
  ADD COLUMN encabezado_documento VARCHAR(255) NULL;

-- ---------------------------------------------------------------------------
-- 4. Auditoria: consultas por usuario y por accion
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs
  ADD INDEX idx_audit_user (user_id, created_at),
  ADD INDEX idx_audit_action (action);
