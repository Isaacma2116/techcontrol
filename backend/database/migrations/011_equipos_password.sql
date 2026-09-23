-- ============================================================================
-- 011 - Contraseña del equipo
--
--   equipos + password_cifrado (credencial de acceso al equipo: usuario/Windows,
--   BIOS, disco... lo que el técnico necesite recordar). Mismo tratamiento que
--   la contraseña Wi-Fi de redes (migración 008): se guarda CIFRADA
--   (AES-256-GCM, utils/cripto.js), nunca en texto plano ni en listados o el
--   detalle normal. Revelarla exige el permiso 'equipos.ver_contrasenas'
--   (nuevo, solo admin) y queda registrada en audit_logs.
--
--   Nota: la migración 002 dejó explícito que "las contraseñas de equipos no
--   se guardan en la base de datos". Esta migración revierte esa decisión,
--   pero ahora con el mismo cifrado + permiso + auditoría que ya protege la
--   contraseña Wi-Fi, no en texto plano como se planteó entonces.
--
--   Migración ADITIVA: no altera ni borra nada de lo que ya existe.
-- ============================================================================

ALTER TABLE equipos
  ADD COLUMN password_cifrado VARBINARY(512) NULL AFTER garantia_detalle;
