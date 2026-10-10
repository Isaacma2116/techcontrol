/**
 * Formatea fechas para mostrar. Acepta:
 *  - 'YYYY-MM-DD' (columnas DATE): se arma como fecha LOCAL para que
 *    new Date('2024-03-05') (que es UTC) no la muestre un dia antes.
 *  - ISO datetime (columnas DATETIME): se convierte a la hora local.
 */
export function formatDate(value) {
  if (!value) return '—';

  let date;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Fecha de hoy como 'YYYY-MM-DD' en hora local (para <input type="date">). */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getInitials(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => p.trim()[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Fecha y hora local (DATETIME del servidor -> "21 sep 2026, 14:30"). */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
