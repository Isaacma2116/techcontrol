/**
 * Términos y condiciones de uso de TechControl (el sistema interno, no un
 * contrato de custodia de equipo — eso ya lo cubren las cartas responsivas).
 * Texto GENÉRICO de referencia: NO es un documento legal definitivo, debe
 * revisarlo el área legal de la empresa antes de considerarse vigente
 * (mismo criterio que los textos por defecto de cartas responsivas).
 */

const VERSION = '1.0';
const ACTUALIZADO_EL = '2026-09-23'; // se actualiza a mano cuando cambie el texto

const SECCIONES = [
  {
    titulo: '1. Objeto',
    texto: 'TechControl es un sistema interno para administrar el inventario de equipos, accesorios, licencias, '
      + 'mantenimientos y redes de la empresa. El acceso se otorga únicamente a personal autorizado para fines '
      + 'laborales relacionados con la gestión de activos de tecnología de la información.',
  },
  {
    titulo: '2. Cuentas de usuario',
    texto: 'Cada persona usuaria es responsable de la confidencialidad de sus credenciales y de la actividad '
      + 'realizada con su cuenta. Las contraseñas nunca deben compartirse. Cualquier sospecha de acceso no '
      + 'autorizado debe reportarse de inmediato al área de TI.',
  },
  {
    titulo: '3. Uso de la información',
    texto: 'La información registrada en el sistema (equipos, colaboradores, licencias, redes y sus contraseñas, '
      + 'mantenimientos) es confidencial y de uso exclusivamente laboral. No debe extraerse, compartirse ni '
      + 'utilizarse fuera de las funciones autorizadas del puesto de quien la consulta.',
  },
  {
    titulo: '4. Registro de actividad',
    texto: 'Las acciones relevantes realizadas dentro del sistema (creación, modificación, asignación, consulta '
      + 'de información sensible, entre otras) quedan registradas con fines de trazabilidad y seguridad, conforme '
      + 'al módulo de Auditoría.',
  },
  {
    titulo: '5. Responsabilidad sobre los activos',
    texto: 'La asignación de un equipo, accesorio u otro recurso a un colaborador implica su responsabilidad '
      + 'sobre el cuidado del mismo, en los términos que se detallan en la carta responsiva correspondiente a '
      + 'cada entrega.',
  },
  {
    titulo: '6. Modificaciones',
    texto: 'Estos términos pueden actualizarse. La fecha de la versión vigente se muestra en esta misma página.',
  },
];

module.exports = { VERSION, ACTUALIZADO_EL, SECCIONES };
