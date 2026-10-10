-- TechControl - Esquema inicial de base de datos
-- Etapa 1: solo lo necesario para autenticacion y usuarios.

CREATE DATABASE IF NOT EXISTS techcontrol
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE techcontrol;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  username      VARCHAR(50) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'technician', 'viewer') NOT NULL DEFAULT 'viewer',
  active        TINYINT(1) NOT NULL DEFAULT 1,
  last_login    DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (active);

-- Tabla de auditoria (preparada desde ahora, se llenara cuando existan
-- modulos que generen acciones: equipos, licencias, mantenimientos, etc.)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(150) NOT NULL,
  entity      VARCHAR(100) NULL,
  entity_id   VARCHAR(100) NULL,
  ip_address  VARCHAR(45) NULL,
  details     JSON NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_entity (entity, entity_id)
) ENGINE=InnoDB;
