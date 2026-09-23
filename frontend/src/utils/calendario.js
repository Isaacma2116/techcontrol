/**
 * Utilidades de calendario mensual. Todo en hora LOCAL: las fechas se arman con
 * new Date(anio, mes, dia) y se formatean a mano, nunca con toISOString() (que
 * usa UTC y puede mostrar un dia antes).
 */

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Mayuscula solo en la primera letra ("septiembre de 2026" -> "Septiembre de 2026"). */
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' local. */
export const fechaISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM' del mes de una fecha (o del mes actual). */
export const mesISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** 'YYYY-MM' -> { anio, mes } (mes 0-11). Si no es valido, el mes actual. */
export function parseMes(valor) {
  const m = /^(\d{4})-(\d{2})$/.exec(valor || '');
  if (!m) { const hoy = new Date(); return { anio: hoy.getFullYear(), mes: hoy.getMonth() }; }
  const mes = Number(m[2]) - 1;
  if (mes < 0 || mes > 11) { const hoy = new Date(); return { anio: hoy.getFullYear(), mes: hoy.getMonth() }; }
  return { anio: Number(m[1]), mes };
}

/** Suma meses a 'YYYY-MM'. */
export function sumarMeses(valor, delta) {
  const { anio, mes } = parseMes(valor);
  return mesISO(new Date(anio, mes + delta, 1));
}

/** "Septiembre de 2026" */
export function nombreMes(valor) {
  const { anio, mes } = parseMes(valor);
  return capitalizar(new Date(anio, mes, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }));
}

/** "Sábado, 21 de septiembre" */
export function fechaLarga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return capitalizar(
    new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  );
}

/** Primer y ultimo dia del mes, en 'YYYY-MM-DD' (para pedirle el rango al backend). */
export function rangoMes(valor) {
  const { anio, mes } = parseMes(valor);
  return { desde: fechaISO(new Date(anio, mes, 1)), hasta: fechaISO(new Date(anio, mes + 1, 0)) };
}

/**
 * Celdas de la cuadricula del mes (semanas de lunes a domingo, incluyendo los
 * dias de relleno del mes anterior y siguiente).
 *   -> [{ iso, dia, esDelMes, esHoy }]
 */
export function diasDelMes(valor) {
  const { anio, mes } = parseMes(valor);
  const primero = new Date(anio, mes, 1);
  const offset = (primero.getDay() + 6) % 7; // lunes = 0
  const total = new Date(anio, mes + 1, 0).getDate();
  const semanas = Math.ceil((offset + total) / 7);
  const hoy = fechaISO(new Date());

  return Array.from({ length: semanas * 7 }, (_, i) => {
    const d = new Date(anio, mes, 1 - offset + i);
    const iso = fechaISO(d);
    return { iso, dia: d.getDate(), esDelMes: d.getMonth() === mes, esHoy: iso === hoy };
  });
}

/** Agrupa una lista por su fecha: { 'YYYY-MM-DD': [items] }. */
export function agruparPorFecha(items, campo = 'fecha_programada') {
  return items.reduce((acc, item) => {
    const key = item[campo];
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}
