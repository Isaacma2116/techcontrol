// Genera un color HEX distinto según el id
export function getDefaultColorForEquipo(id: number): string {
  const palette = [
    "#FFB300", "#803E75", "#FF6800", "#A6BDD7", "#C10020", "#CEA262",
    "#817066", "#007D34", "#F6768E", "#00538A", "#FF7A5C", "#53377A",
    "#FF8E00", "#B32851", "#F4C800", "#7F180D", "#93AA00", "#593315",
    "#F13A13", "#232C16"
  ];
  return palette[id % palette.length];
}