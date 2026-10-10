-- ============================================================================
-- 010 - CONFIGURACION (fase 2): apariencia, notificaciones, seguridad, datos
--
--   users                     + preferencias_ui (tema/densidad/acento), two_factor_enabled
--   user_sessions             + reautenticado_en (paso adicional para datos sensibles)
--   configuracion_empresa     + requiere_reautenticacion_sensible (politica GLOBAL)
--   notificacion_preferencias  usuario_id x categoria -> canal_sistema / canal_correo
--
--   * "Requerir reautenticacion para datos sensibles" (Wi-Fi, etc.) es una POLITICA
--     DE LA EMPRESA (configuracion_empresa), no una preferencia personal: si fuera
--     por usuario, cualquiera podria desactivarsela a si mismo. La decide un admin
--     para todos, igual que el resto de "Organizacion" en Configuracion.
--   * two_factor_enabled deja la columna lista (Autenticacion de dos pasos): todavia
--     no hay flujo TOTP/QR (fuera de alcance de esta fase); la UI lo muestra
--     como "Proximamente" hasta que exista.
--   * notificacion_preferencias por defecto es "todo activado en el sistema, nada
--     por correo" (no hay proveedor de correo configurado aun): una fila ausente
--     se interpreta como canal_sistema=1 (ver notificacionModel.notificarRoles).
--
--   Migracion ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

ALTER TABLE users
  ADD COLUMN preferencias_ui   JSON NULL,
  ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE user_sessions
  ADD COLUMN reautenticado_en DATETIME NULL;

ALTER TABLE configuracion_empresa
  ADD COLUMN requiere_reautenticacion_sensible TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS notificacion_preferencias (
  usuario_id     INT UNSIGNED NOT NULL,
  categoria      ENUM('inventario','mantenimientos','garantias','licencias','redes') NOT NULL,
  canal_sistema  TINYINT(1) NOT NULL DEFAULT 1,
  canal_correo   TINYINT(1) NOT NULL DEFAULT 0,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (usuario_id, categoria),
  CONSTRAINT fk_notifpref_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
