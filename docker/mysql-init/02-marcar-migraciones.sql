-- controlequipos.sql ya incluye la columna equipos.password_cifrado (migración 011),
-- pero no la registra en schema_migrations. Sin esto, el backend intentaría
-- aplicarla otra vez al arrancar y fallaría con "Duplicate column name".
INSERT IGNORE INTO schema_migrations (name) VALUES ('011_equipos_password.sql');
