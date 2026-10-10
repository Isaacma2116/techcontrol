import {
  Laptop, Monitor, Computer, Keyboard, Mouse, Smartphone, Tablet, Server, Printer,
  Headphones, Webcam, Cable, Plug, Usb, Box,
} from 'lucide-react';

const TIPO_ICONS = {
  Laptop, PC: Computer, 'All-in-One': Computer, Servidor: Server, Celular: Smartphone, Tablet, Impresora: Printer,
  Monitor, Teclado: Keyboard, Mouse, 'Audífonos': Headphones, Webcam, 'Docking station': Usb,
  Cargador: Plug, Adaptador: Plug, Cable,
  // Tipos de impresora
  'Láser': Printer, 'Inyección de tinta': Printer, 'Tanque de tinta': Printer, Matricial: Printer,
  'Térmica': Printer, Multifuncional: Printer, Plotter: Printer,
};

/** Nombre del tipo con un icono representativo (Laptop, Mouse, Monitor...). */
export default function TipoItem({ tipo }) {
  const Icon = TIPO_ICONS[tipo] || Box;
  return (
    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
      <Icon size={16} className="shrink-0 text-slate-400" />
      {tipo}
    </span>
  );
}
