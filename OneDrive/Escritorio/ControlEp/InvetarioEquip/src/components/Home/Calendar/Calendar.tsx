import { useState, useEffect, useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { FiSearch, FiPlus, FiInfo } from "react-icons/fi";
import clsx from "clsx";
import AgendarMantenimientoForm from "./AgendarMantenimientoForm";
import EquipoColorForm from "./EquipoColorForm";
import { getDefaultColorForEquipo } from "./colorUtils";
import VerMantenimientoProgramado from "./VerMantenimientoProgramado";
import TutorialModal from "./TutorialModal";

// Tipos base
type Equipo = {
  id: number;
  marca: string;
  modelo: string;
  tipo: string;
  estado: "activo" | "inactivo" | "en_reparacion" | "dado_de_baja";
  foto_equipo?: string;
  color?: string;
  icono?: string;
};

type Personalizacion = {
  equipo_id: number;
  color: string | null;
  icono?: string | null;
};

type Mantenimiento = {
  id: number;
  equipo_id: number;
  tipo_mantenimiento: "preventivo" | "correctivo";
  fecha_programada: string;
  prioridad: "alta" | "media" | "baja";
  descripcion: string;
  estado: "pendiente" | "realizado" | "reprogramado" | "no_realizado";
  fecha_creacion: string;
  fecha_reprogramada?: string | null;
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Mantenimiento;
};

const localizer = momentLocalizer(moment);

const estadoColor = {
  pendiente: "bg-orange-400 border-orange-600 text-black",
  realizado: "bg-black border-black text-white",
  reprogramado: "bg-white border-gray-400 text-black",
  no_realizado: "bg-white border-gray-400 text-black",
};

interface CalendarProps {
  sidebarOpen: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Calendar({ sidebarOpen }: CalendarProps) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [personalizaciones, setPersonalizaciones] = useState<Personalizacion[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    tipo: "",
    prioridad: "",
    estado: "",
    equipo: "",
  });
  const [searchEquipo, setSearchEquipo] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [equipoParaAgendar, setEquipoParaAgendar] = useState<Equipo | null>(null);
  const [equipoEditColorId, setEquipoEditColorId] = useState<number | null>(null);
  const [mantenimientoParaVer, setMantenimientoParaVer] = useState<Mantenimiento | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== "undefined") {
      return !window.localStorage.getItem("tutorialSeen");
    }
    return true;
  });

  // Fetch equipos, personalizaciones y mantenimientos de la API
  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${BASE_URL}/api/equipos`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/equipos-personalizacion`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/mantenimientos`).then((r) => r.json()),
    ])
      .then(([equiposData, personalizData, mantData]) => {
        setEquipos(Array.isArray(equiposData) ? equiposData : equiposData.data || []);
        setPersonalizaciones(Array.isArray(personalizData) ? personalizData : personalizData.data || []);
        setMantenimientos(Array.isArray(mantData) ? mantData : mantData.data || []);
      })
      .catch(() => {
        setError("Error cargando datos del servidor.");
        setEquipos([]);
        setPersonalizaciones([]);
        setMantenimientos([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cuando el usuario cierra el tutorial, lo marcamos en localStorage
  const handleCloseTutorial = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tutorialSeen", "true");
    }
    setShowTutorial(false);
  };

  // Filtros de búsqueda de equipos
  const equiposFiltrados = useMemo(() => {
    if (!searchEquipo.trim()) return equipos;
    return equipos.filter(
      eq =>
        `${eq.marca} ${eq.modelo}`.toLowerCase().includes(searchEquipo.toLowerCase()) ||
        eq.tipo.toLowerCase().includes(searchEquipo.toLowerCase())
    );
  }, [searchEquipo, equipos]);

  // Filtros para mantenimientos
  const eventosFiltrados = useMemo(() => {
    return mantenimientos
      .filter((m) =>
        (!filtros.tipo || m.tipo_mantenimiento === filtros.tipo) &&
        (!filtros.prioridad || m.prioridad === filtros.prioridad) &&
        (!filtros.estado || m.estado === filtros.estado) &&
        (!filtros.equipo || m.equipo_id === Number(filtros.equipo))
      )
      .map((m) => ({
        id: m.id,
        title: equipos.find(eq => eq.id === m.equipo_id)
          ? `${equipos.find(eq => eq.id === m.equipo_id)!.marca} ${equipos.find(eq => eq.id === m.equipo_id)!.modelo} (${m.tipo_mantenimiento})`
          : `Equipo #${m.equipo_id} (${m.tipo_mantenimiento})`,
        start: new Date(m.fecha_reprogramada || m.fecha_programada),
        end: moment(m.fecha_reprogramada || m.fecha_programada).add(2, "hours").toDate(),
        resource: m,
      }));
  }, [mantenimientos, filtros, equipos]);

  // Drag & Drop básico
  const handleDropFromEquipos = ({ start, equipo }: { start: Date; equipo: Equipo }) => {
    setEquipoParaAgendar(equipo);
    setShowManualModal(true);
  };

  // Clic en evento: abre el detalle del mantenimiento programado
  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource) {
      setMantenimientoParaVer(event.resource);
    }
  };

  // Clic en celda vacía
  const handleSelectSlot = () => {
    setEquipoParaAgendar(null);
    setShowManualModal(true);
  };

  // Busca la personalización de un equipo
  const getPersonalizacion = (equipoId: number) => {
    return personalizaciones.find((p) => p.equipo_id === equipoId);
  };

  // Personalización de color en el calendario
  const eventPropGetter = (event: CalendarEvent) => {
    if (!event.resource) return {};

    // Busca el color personalizado para el equipo de este evento
    const personaliz = getPersonalizacion(event.resource.equipo_id);

    if (personaliz?.color) {
      // Si hay color personalizado, úsalo
      return {
        style: {
          backgroundColor: personaliz.color,
          color: "#fff",
          fontWeight: 600,
          opacity: 0.95,
          borderRadius: "0.375rem",
          border: "2px solid " + personaliz.color,
          padding: "0.25rem 0.5rem"
        }
      };
    }

    // Si no hay color personalizado, usa el color por estado
    const colorClass = estadoColor[event.resource.estado];
    return {
      className: `${colorClass} border-2 rounded-md px-2 py-1`,
      style: {
        fontWeight: 600,
        opacity: 0.95,
      },
    };
  };

  // Actualiza la lista de mantenimientos cuando se reprograma uno
  const handleReprogramado = (nuevo: Mantenimiento) => {
    setMantenimientos((prev) =>
      prev.map(m =>
        m.id === nuevo.id
          ? { ...m, ...nuevo }
          : m
      )
    );
    setMantenimientoParaVer(null); // Cierra modal
  };

  return (
    <div className="flex h-full">
      {/* Panel lateral de equipos */}
      <aside
        className={clsx(
          "bg-white border-r border-gray-200 p-4 w-80 flex-shrink-0 flex flex-col gap-4 transition-all duration-300",
          { "hidden": !sidebarOpen }
        )}
      >
        <h2 className="text-lg font-bold mb-2">Equipos</h2>
        {/* Barra de búsqueda */}
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipo..."
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchEquipo}
            onChange={e => setSearchEquipo(e.target.value)}
          />
        </div>
        {/* Listado con scroll */}
        <ul className="space-y-2 overflow-y-auto flex-1 pr-1" style={{ maxHeight: "calc(100vh - 190px)" }}>
          {loading && <li className="text-gray-400 text-center py-4">Cargando...</li>}
          {error && <li className="text-red-500 text-center py-4">{error}</li>}
          {!loading && !error && equiposFiltrados.length === 0 && (
            <li className="text-gray-400 text-center py-8">No hay equipos</li>
          )}
          {equiposFiltrados.map((equipo) => {
            const personaliz = getPersonalizacion(equipo.id);
            const color = personaliz?.color || getDefaultColorForEquipo(equipo.id);

            return (
              <li
                key={equipo.id}
                className="relative flex items-center p-2 bg-gray-100 rounded hover:bg-blue-50 group shadow-sm"
              >
                <div className="flex items-center gap-2 flex-1 cursor-move" draggable
                  onDragStart={e => e.dataTransfer.setData("equipo-id", equipo.id.toString())}
                  title="Arrastra para agendar"
                >
                  {/* Círculo color, ahora clickeable y despliega el form */}
                  <span
                    className="inline-block w-5 h-5 rounded-full border border-gray-400 cursor-pointer"
                    style={{ background: color }}
                    onClick={e => {
                      e.stopPropagation();
                      setEquipoEditColorId(equipo.id);
                    }}
                  />
                  <div>
                    <div className="font-semibold truncate">{equipo.marca} {equipo.modelo}</div>
                    <div className="text-xs text-gray-500 truncate">{equipo.tipo}</div>
                  </div>
                </div>
                <button
                  className="ml-2 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs font-semibold transition"
                  onClick={() => {
                    setEquipoParaAgendar(equipo);
                    setShowManualModal(true);
                  }}
                  title="Agendar mantenimiento"
                >
                  <FiPlus className="w-4 h-4" /> Agendar
                </button>
                {/* Formulario de color para este equipo, solo si está activo */}
                {equipoEditColorId === equipo.id && (
                  <EquipoColorForm
                    equipoId={equipo.id}
                    colorActual={personaliz?.color || getDefaultColorForEquipo(equipo.id)}
                    onSave={async (newColor) => {
                      await fetch(`${BASE_URL}/api/equipos-personalizacion`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ equipo_id: equipo.id, color: newColor, icono: null })
                      });
                      fetchData();
                    }}
                    onClose={() => setEquipoEditColorId(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
        {/* Botón para visualizar las instrucciones del tutorial */}
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-black flex items-center gap-2 mt-2 transition"
          onClick={() => setShowTutorial(true)}
        >
          <FiInfo className="w-5 h-5" /> Ver instrucciones
        </button>
      </aside>

      {/* Calendario principal */}
      <main className="flex-1 flex flex-col p-4 bg-gray-50">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select
            className="border rounded px-2 py-1"
            value={filtros.tipo}
            onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
          >
            <option value="">Tipo</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={filtros.prioridad}
            onChange={(e) => setFiltros((f) => ({ ...f, prioridad: e.target.value }))}
          >
            <option value="">Prioridad</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="realizado">Realizado</option>
            <option value="reprogramado">Reprogramado</option>
            <option value="no_realizado">No realizado</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={filtros.equipo}
            onChange={(e) => setFiltros((f) => ({ ...f, equipo: e.target.value }))}
          >
            <option value="">Equipo</option>
            {equipos.map((e) => (
              <option key={e.id} value={e.id}>{e.marca} {e.modelo}</option>
            ))}
          </select>
        </div>

        {/* Calendario */}
        <div
          className="bg-white rounded shadow p-2 flex-1 min-h-[500px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const equipoId = e.dataTransfer.getData("equipo-id");
            if (equipoId) {
              const equipo = equipos.find(eq => eq.id === Number(equipoId));
              if (equipo) handleDropFromEquipos({ start: new Date(), equipo });
            }
          }}
        >
          <BigCalendar
            localizer={localizer}
            events={eventosFiltrados}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month", "week", "day"]}
            defaultView="month"
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventPropGetter}
            popup
            messages={{
              next: "Sig.",
              previous: "Ant.",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              showMore: total => `+${total} más`
            }}
          />
        </div>
      </main>

      {/* Modal para agendar */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowManualModal(false)}
            >
              ×
            </button>
            <div className="font-bold text-lg mb-4">Agendar mantenimiento</div>
            <AgendarMantenimientoForm
              equipo={equipoParaAgendar}
              onCancel={() => setShowManualModal(false)}
              onSuccess={() => {
                setShowManualModal(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal para ver detalle de mantenimiento programado */}
      {mantenimientoParaVer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <VerMantenimientoProgramado
            mantenimiento={mantenimientoParaVer}
            onClose={() => setMantenimientoParaVer(null)}
            onReprogramado={handleReprogramado}
          />
        </div>
      )}

      {/* Tutorial de uso */}
      <TutorialModal open={showTutorial} onClose={handleCloseTutorial} />
    </div>
  );
}