/** @type {import('tailwindcss').Config} */

// slate/white/brand se redefinen como variables CSS (ver src/index.css) para que
// TODA la app responda al tema claro/oscuro y al color de acento SIN tocar cada
// archivo: cada clase (bg-white, text-slate-800, bg-brand-900...) ya usada en
// los componentes sigue funcionando igual, solo que ahora el valor final lo
// decide la variable activa (:root, .dark, [data-acento]).
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;
const escala = (prefix) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, withVar(`--color-${prefix}-${n}`)]));

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: withVar('--color-white'),
        slate: escala('slate'),
        brand: {
          900: withVar('--color-brand-900'),
          800: withVar('--color-brand-800'),
          700: withVar('--color-brand-700'),
          500: withVar('--color-brand-500'),
          400: withVar('--color-brand-400'),
        },
        // Texto/bordes SIEMPRE blancos sobre superficies que ya son oscuras a
        // proposito (sidebar, botones primarios) y que NO cambian con el tema:
        // usar esto en vez de `white` ahi evita que el modo oscuro los apague.
        oncolor: 'rgb(255 255 255 / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
