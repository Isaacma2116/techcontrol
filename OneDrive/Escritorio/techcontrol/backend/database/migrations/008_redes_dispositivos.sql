-- ============================================================================
-- 008 - REDES Y DISPOSITIVOS DE RED (fase 1: catalogo, dispositivos y
-- la relacion logica dispositivo<->red que prepara la topologia futura)
--
--   ubicaciones ──┬──< redes >── areas (departamento)
--                 │      │
--                 │      └──< dispositivos_red_redes >──┐
--                 └──< dispositivos_red >────────────────┘
--                          │        │
--                    proveedores  vlan_admin_id ──> redes (solo tipo 'vlan')
--
--   * `redes` y `dispositivos_red` son entidades INDEPENDIENTES (un dispositivo
--     no "pertenece" a una sola red): la relacion real vive en
--     `dispositivos_red_redes`, una tabla M:N pura. Esa tabla, por si sola, ya
--     responde "que dispositivos usa esta red" y "que redes usa este dispositivo",
--     que es la base logica para la vista de topologia (fase futura: aqui solo
--     se prepara la relacion, no un editor grafico).
--   * Reutiliza `ubicaciones`, `areas` y `proveedores` (ya existen): no se
--     duplica ningun catalogo.
--   * `responsable_id` apunta a `users` (personal de TI que administra la red
--     o el dispositivo), no a `colaboradores`: un dispositivo de red no se le
--     "asigna" a un colaborador como un equipo, lo administra TI.
--   * La contrasena Wi-Fi se guarda CIFRADA (AES-256-GCM, utils/cripto.js) en
--     `wifi_password_cifrado`. Nunca se guarda en texto plano ni se expone en
--     los listados; revelarla es una accion aparte con su propio permiso
--     (`redes.ver_contrasenas`) y su registro en `audit_logs`.
--   * Nada se borra fisicamente: "eliminar" (permisos `redes.eliminar` /
--     `dispositivos_red.eliminar`) es el mismo patron que el resto del
--     inventario -> estado inactiva/baja, igual que "dar de baja" un equipo.
--
--   Migracion ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. REDES (Wi-Fi, LAN, VLAN, invitados, servidores...)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS redes (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                 VARCHAR(150) NOT NULL,          -- nombre de la red / SSID
  tipo                   ENUM('wifi','lan','vlan','invitados','servidores','otra') NOT NULL,
  ubicacion_id           INT UNSIGNED NULL,
  area_id                INT UNSIGNED NULL,               -- departamento/area responsable
  vlan_numero            SMALLINT UNSIGNED NULL,          -- VLAN ID (802.1Q), si aplica
  rango_ip               VARCHAR(43) NULL,                -- CIDR, ej. 192.168.10.0/24
  gateway                VARCHAR(45) NULL,
  dns                    VARCHAR(190) NULL,               -- uno o varios, separados por coma
  dhcp_habilitado        TINYINT(1) NOT NULL DEFAULT 0,
  seguridad_wifi         ENUM('wpa2','wpa3','wpa2_enterprise','wep','abierta','otra') NULL,
  wifi_password_cifrado  VARBINARY(512) NULL,             -- AES-256-GCM (utils/cripto.js); NUNCA texto plano
  estado                 ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  responsable_id         INT UNSIGNED NULL,               -- usuario de TI responsable
  descripcion            VARCHAR(500) NULL,
  creado_por             INT UNSIGNED NULL,
  actualizado_por        INT UNSIGNED NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Mismo nombre puede repetirse en otra ubicacion (dos oficinas con "Red Invitados"),
  -- pero no dos veces en la misma (columna GENERADA: NULL no choca en un UNIQUE).
  clave_unica VARCHAR(191)
    GENERATED ALWAYS AS (CONCAT(LOWER(nombre), ':', COALESCE(ubicacion_id, 0))) STORED,

  CONSTRAINT uq_redes_clave UNIQUE (clave_unica),
  CONSTRAINT fk_redes_ubicacion   FOREIGN KEY (ubicacion_id)   REFERENCES ubicaciones(id) ON DELETE RESTRICT,
  CONSTRAINT fk_redes_area        FOREIGN KEY (area_id)        REFERENCES areas(id)       ON DELETE RESTRICT,
  CONSTRAINT fk_redes_responsable FOREIGN KEY (responsable_id) REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT fk_redes_creado_por  FOREIGN KEY (creado_por)     REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT fk_redes_actualizado FOREIGN KEY (actualizado_por) REFERENCES users(id)      ON DELETE SET NULL,

  INDEX idx_redes_tipo (tipo),
  INDEX idx_redes_estado (estado),
  INDEX idx_redes_ubicacion (ubicacion_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 2. DISPOSITIVOS DE RED (routers, switches, access points, firewalls...)
--    codigo = NET-00001 (visible), igual que EQ-/IMP-/LIC-/MNT- en el resto.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos_red (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo             VARCHAR(30) NOT NULL,
  nombre             VARCHAR(150) NOT NULL,           -- nombre o identificador (ej. "Router principal", "SW-01")
  tipo               ENUM('router','switch','access_point','firewall','repetidor','antena',
                           'modem','controlador_wifi','servidor_red','otro') NOT NULL,
  marca              VARCHAR(80)  NULL,
  modelo             VARCHAR(120) NULL,
  numero_serie       VARCHAR(120) NULL,
  mac_address        VARCHAR(17)  NULL,                -- AA:BB:CC:DD:EE:FF
  ip_address         VARCHAR(45)  NULL,                -- IP interna (IPv4 o IPv6)
  ip_publica         VARCHAR(45)  NULL,
  ubicacion_id       INT UNSIGNED NULL,
  rack               VARCHAR(80)  NULL,
  puerto             VARCHAR(40)  NULL,
  vlan_admin_id      INT UNSIGNED NULL,                -- VLAN de administracion del propio dispositivo (una red tipo 'vlan')
  estado             ENUM('activo','inactivo','mantenimiento','baja') NOT NULL DEFAULT 'activo',
  responsable_id     INT UNSIGNED NULL,                -- usuario de TI responsable
  fecha_instalacion  DATE NULL,
  fecha_garantia     DATE NULL,
  proveedor_id       INT UNSIGNED NULL,
  imagen             VARCHAR(255) NULL,                -- nombre de archivo en /uploads/dispositivos-red
  observaciones      TEXT NULL,
  creado_por         INT UNSIGNED NULL,
  actualizado_por    INT UNSIGNED NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_dispred_codigo  UNIQUE (codigo),
  -- La serie/MAC pueden repetirse como NULL (dato no capturado) pero no como valor.
  CONSTRAINT uq_dispred_serie   UNIQUE (numero_serie),
  CONSTRAINT uq_dispred_mac     UNIQUE (mac_address),

  CONSTRAINT fk_dispred_ubicacion    FOREIGN KEY (ubicacion_id)   REFERENCES ubicaciones(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dispred_vlan_admin   FOREIGN KEY (vlan_admin_id)  REFERENCES redes(id)       ON DELETE SET NULL,
  CONSTRAINT fk_dispred_responsable  FOREIGN KEY (responsable_id) REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT fk_dispred_proveedor    FOREIGN KEY (proveedor_id)   REFERENCES proveedores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dispred_creado_por   FOREIGN KEY (creado_por)     REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT fk_dispred_actualizado  FOREIGN KEY (actualizado_por) REFERENCES users(id)      ON DELETE SET NULL,

  INDEX idx_dispred_tipo (tipo),
  INDEX idx_dispred_estado (estado),
  INDEX idx_dispred_ubicacion (ubicacion_id),
  INDEX idx_dispred_mac (mac_address)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. RELACION LOGICA dispositivo <-> red (M:N).
--    Un router "principal" en una sola red, un AP en dos, un switch en varias
--    VLANs: todo es la misma fila repetida. Es la base para la topologia futura.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos_red_redes (
  dispositivo_id INT UNSIGNED NOT NULL,
  red_id         INT UNSIGNED NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_por     INT UNSIGNED NULL,

  PRIMARY KEY (dispositivo_id, red_id),
  CONSTRAINT fk_dispredredes_dispositivo FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_red(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispredredes_red         FOREIGN KEY (red_id)         REFERENCES redes(id)            ON DELETE CASCADE,
  CONSTRAINT fk_dispredredes_creado_por  FOREIGN KEY (creado_por)     REFERENCES users(id)             ON DELETE SET NULL,

  INDEX idx_dispredredes_red (red_id, dispositivo_id)
) ENGINE=InnoDB;
