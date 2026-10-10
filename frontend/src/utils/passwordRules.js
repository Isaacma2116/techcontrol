/** Reglas de contraseña (las mismas que valida el backend en utils/password.js). */
export const MIN_PASSWORD_LENGTH = 10;

export function passwordChecks(password, { username = '', email = '' } = {}) {
  const local = (email || '').split('@')[0].toLowerCase();
  const lower = password.toLowerCase();
  const personal = [username.toLowerCase(), local].filter((v) => v.length >= 3);
  return [
    { id: 'len', label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { id: 'upper', label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Una minúscula', ok: /[a-z]/.test(password) },
    { id: 'digit', label: 'Un número', ok: /\d/.test(password) },
    { id: 'personal', label: 'Sin tu usuario ni tu correo', ok: password.length > 0 && !personal.some((p) => lower.includes(p)) },
  ];
}
