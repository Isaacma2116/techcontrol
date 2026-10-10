import StatCard from './StatCard.jsx';

// Clases completas (no interpoladas) para que Tailwind las detecte.
const COLS = { 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

/**
 * Fila de tarjetas de estadisticas.
 * Movil: una sola fila con desplazamiento lateral (swipe).
 * Desde sm: cuadricula (2 columnas; 4 o 5 en escritorio segun `cols`).
 * `cards` = props de <StatCard /> (label, value, icon, tone, onClick, active).
 */
export default function StatCardRow({ cards, cols = 4 }) {
  return (
    <div
      className={`-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:py-0 ${COLS[cols]}`}
    >
      {cards.map((card) => (
        <div key={card.label} className="flex w-[72%] shrink-0 snap-start sm:w-auto [&>*]:w-full">
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
}
