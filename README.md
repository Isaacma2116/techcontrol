# TechControl — Etapa 1

Sistema de gestión de activos de TI. Esta primera etapa incluye:
login, autenticación con JWT + cookies HttpOnly, protección de rutas
(frontend y backend), layout con sidebar/header, dashboard con datos
reales calculados en el momento, sistema básico de roles y logout.

## Estructura

```
techcontrol/
  backend/     API en Express + MySQL
  frontend/    App en React + Vite + Tailwind
```

## 1. Base de datos

```bash
mysql -u root -p < backend/database/schema.sql
```

Para bases ya creadas (o para agregar el modulo de Colaboradores) aplica las
migraciones pendientes; es seguro correrlo varias veces:

```bash
cd backend && npm run migrate
```

## 2. Backend

```bash
cd backend
cp .env.example .env      # y edita las credenciales de tu MySQL y el JWT_SECRET
npm install
npm run seed               # crea el usuario administrador inicial
npm run dev                 # http://localhost:4000
```

El usuario y contraseña del administrador inicial se definen en las
variables `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` de tu `.env`
antes de correr `npm run seed`. Cámbiala después del primer login.

## 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Login: correo o usuario + "Recordarme"

- El login acepta correo **o** nombre de usuario en el mismo campo
  (`identifier`); el backend busca por ambos con una sola consulta.
- "Recordarme" guarda solo el correo/usuario en `localStorage` (nunca
  la contraseña) y extiende la sesión de 8 horas a 30 días
  (`JWT_REMEMBER_EXPIRES_IN`). Sin marcar, la cookie es de sesión y
  se borra al cerrar el navegador.
- La contraseña se puede guardar de forma segura con el gestor nativo
  del navegador gracias a `autocomplete="username"` / `"current-password"`
  — es el lugar correcto para eso, no el `localStorage`.

## Notas de seguridad implementadas

- Contraseñas con `bcryptjs` (12 rounds), nunca en texto plano.
- JWT en cookie **HttpOnly + SameSite=Strict** (no en localStorage).
- Autenticación y autorización validadas siempre en el backend
  (`middleware/authMiddleware.js`, `middleware/roleMiddleware.js`).
- `helmet`, CORS restringido a `FRONTEND_URL`, rate limiting en
  `/api/auth/login`, validación de datos con `express-validator`.
- Manejo de errores centralizado; sin stack traces en producción.
- `.env` fuera de git (`.gitignore`); solo se versiona `.env.example`.
- Tabla `audit_logs` ya preparada para la futura sección de auditoría.

## Módulo de Colaboradores

Ruta `/colaboradores` (solo roles `admin` y `technician`, en frontend y backend).

- **Listado** con tarjetas de resumen, búsqueda (nombre, apellidos, ID de
  empleado, correo empresarial) y filtros (área, cargo, estado, con/sin
  equipo). Todo se resuelve en SQL con paginación; los filtros viven en la URL.
- **Perfil** `/colaboradores/:id` con datos completos, equipos asignados
  actualmente e historial de asignaciones.
- **Alta/edición** en ventana modal, con fotografía (JPG/PNG/WEBP, máx. 2 MB,
  guardada en `backend/uploads/`, servida solo con sesión).
- Los colaboradores **no se eliminan**: se dan de baja (`activo`, `fecha_baja`),
  para conservar el historial. No se puede dar de baja a quien aún tiene equipos,
  accesorios, impresoras o celulares.

## Inventario: Equipos, Accesorios, Impresoras, Celulares y Asignaciones

Rutas `/equipos`, `/accesorios`, `/impresoras` y `/celulares` (con detalle en `/:id`).
Cualquier usuario con sesión consulta; solo `admin` y `technician` crean, editan,
asignan y devuelven (el backend lo exige aunque se oculten los botones).
`/monitores` redirige a Accesorios filtrado por Monitor.

Modelo de datos (migraciones `001`, `002` y `003` en `backend/database/migrations/`):

```
areas ─┐
cargos ┴─< colaboradores >──< asignaciones_equipos     >── equipos     >── tipos_equipo
                       ├───< asignaciones_accesorios   >── accesorios  >── tipos_accesorio
                       ├───< asignaciones_impresoras   >── impresoras  >── tipos_impresora
                       │                                       └── ubicaciones >── areas
                       └───< asignaciones_celulares    >── celulares
                             (todas: asignado_por / recibido_por -> users)
```

- **Ningún elemento guarda a su responsable** (ni `id_colaborador` en la tabla). Cada
  entrega es una fila de `asignaciones_*` (`fecha_devolucion NULL` = vigente); devolver
  cierra la fila y reasignar crea otra, así el historial nunca se pierde. Un índice
  único garantiza un solo responsable vigente por elemento, incluso con peticiones
  simultáneas.
- `id` es interno; `codigo_inventario` (EQ-00025 / ACC-00025 / IMP-00025 / CEL-00015,
  o la etiqueta que ya tenga el equipo) es el código visible. Si no se captura se
  genera solo.
- **Impresoras** (`impresoras`): además del responsable (opcional), tienen una
  **ubicación física** (`ubicacion_id` → `ubicaciones`, que puede pertenecer a un área).
  Una impresora puede estar en "Contabilidad" y no tener colaborador (estado
  `disponible`). No hay tabla `departamentos`: eso ya es `areas`.
- **Celulares** (`celulares`): sin catálogo de tipos; IMEI 1/2 únicos y validados
  (15 dígitos + dígito verificador), número de línea, operador y fecha de renovación.
  Pueden existir sin colaborador.
- **No se guardan PIN ni contraseñas** de celulares, correos ni equipos: usa un MDM
  (Intune, Android Enterprise, Apple Business Manager) o un gestor de contraseñas.
  Si algún día hiciera falta una bóveda, debe ser una tabla aparte con cifrado en la
  aplicación, acceso solo `admin` y auditoría de cada consulta.
- Los tipos "Celular" e "Impresora" ya no existen en `tipos_equipo` (la migración `003`
  los quita si ningún equipo los usaba).
- Estados: `disponible`, `asignado`, `mantenimiento`, `reparacion`, `baja`, `perdido`.
  "Asignado" solo cambia al asignar/devolver; un elemento asignado debe devolverse
  antes de pasar a mantenimiento, reparación, baja o pérdida (al devolver se elige
  el estado posterior).
- Los accesorios pueden no tener número de serie (`NULL`); el código ACC-xxxxx los
  identifica. Los equipos y accesorios no se eliminan: se dan de baja.
- **Las contraseñas de equipos no se guardan** en el sistema (usa un gestor de
  contraseñas o LAPS).
- `v_asignaciones_vigentes` reúne equipos, accesorios, impresoras y celulares que tiene
  hoy un colaborador (`GET /api/colaboradores/:id/vigentes`): es el insumo de la carta
  responsiva.

API (`/api`): `GET|POST /equipos`, `GET /equipos/stats`, `GET|PUT /equipos/:id`,
`PATCH /equipos/:id/estado`, `GET /equipos/:id/historial`, `POST|DELETE /equipos/:id/imagen`
(igual bajo `/accesorios`, `/impresoras` y `/celulares`; todos con `GET /:kind/marcas`,
y `/impresoras` acepta además `?ubicacion_id=`);
`POST /asignaciones/{equipos|accesorios|impresoras|celulares}` y
`POST /asignaciones/{equipos|accesorios|impresoras|celulares}/:id/devolver`;
`GET /colaboradores/:id/{equipos|accesorios|impresoras|celulares|historial|vigentes}`;
`GET|POST /catalogos/{areas|cargos|tipos-equipo|tipos-accesorio|tipos-impresora|ubicaciones}`.

Datos de ejemplo opcionales (solo si aún no hay colaboradores): `npm run seed:demo`.

## Cartas responsivas y configuración de la empresa

Ruta `/cartas-responsivas` (roles `admin` y `technician`); la empresa y los documentos se configuran en `/configuracion` (solo `admin`, ver la sección siguiente).

- **Flujo:** borrador → PDF generado → pendiente de firma (automático en la primera descarga)
  → firmada (se sube el escaneo). Se puede cancelar; nunca se borra nada.
- **Una carta cubre uno o varios recursos** de un mismo colaborador (equipos, celulares,
  impresoras, accesorios y monitores). Los datos se leen de la base; no se capturan a mano.
  Solo se eligen recursos **ya asignados** (si falta, se asigna desde la misma pantalla).
- **La carta apunta a la asignación**, no al recurso: si el equipo pasa a otra persona, la carta
  anterior sigue ligada a la asignación anterior y la nueva asignación puede tener su propia carta.
- Al generar el PDF se **congelan** los datos del colaborador, la empresa y los recursos: un
  documento firmado no cambia si después se corrige un dato. Para corregir, se cancela y se crea otra.
- **Documentos**: viven en `backend/storage/` (fuera de `uploads/`, nunca se sirve como estático;
  respáldalo junto con la base). En la base solo se guarda el nombre aleatorio, tipo, tamaño y
  `sha256`. Solo se descargan por endpoints con sesión y rol, y cada descarga queda en el historial.
  Se aceptan PDF/JPG/PNG de hasta 10 MB, validando la firma real del archivo.
- **Versiones**: reemplazar una carta firmada (solo `admin`) crea una versión nueva; la anterior se conserva.
- **Historial** de cada carta en `audit_logs` (`entity = 'carta_responsiva'`).
- **Configuración > Empresa / Documentos**: nombre, logo (PNG/JPG, máx. 2 MB), RFC,
  dirección, contacto, pie de página, quien entrega, prefijo del folio y textos de la declaración
  y las condiciones. Una instalación = una empresa. **Revisa con el área legal** los textos por defecto.
- PDF con `pdfmake` (Node puro, sin navegador); una sola plantilla base para todos los tipos.

Permisos: ver/crear/generar/descargar/subir firmada/cancelar (no firmada) → `admin` y `technician`;
reemplazar o cancelar una firmada, abrir versiones anteriores y configurar la empresa → solo `admin`.
`viewer` no tiene acceso (las cartas contienen datos personales).

API (`/api`): `GET|POST /cartas-responsivas`, `GET /cartas-responsivas/stats`,
`GET|PUT /cartas-responsivas/:id`, `GET /:id/preview`, `POST /:id/generar`, `GET /:id/pdf[?descargar=1]`,
`POST|GET /:id/firmada`, `GET /:id/documentos/:docId`, `POST /:id/cancelar`, `GET /:id/historial`;
`GET|PUT /empresa`, `POST|DELETE|GET /empresa/logo`.

## Configuración (fase 1)

Ruta `/configuracion`, con menú por secciones (pestañas con desplazamiento en móvil).

| Grupo | Sección | Quién | Estado |
|---|---|---|---|
| Mi cuenta | Mi perfil | todos | listo |
| Mi cuenta | Seguridad (contraseña + sesiones) | todos | listo |
| Mi cuenta | Apariencia, Notificaciones, Privacidad y datos, Términos y condiciones | todos | próximamente |
| Organización | Empresa, Documentos | `admin` | listo |
| Organización | Usuarios y permisos | `admin` | listo |
| — | Zona peligrosa (eliminar mi cuenta) | todos | próximamente |

- **Mi perfil**: nombre(s), apellidos, teléfono, cargo, correo y foto. Cambiar el correo exige la contraseña
  actual. El usuario, el rol y el estado solo los cambia un administrador. `users.name` sigue siendo el nombre
  para mostrar (se recompone con nombres + apellidos).
- **Contraseñas**: mínimo 10 caracteres con mayúscula, minúscula y número, sin contener el usuario ni el correo
  (`backend/utils/password.js`). Se guardan con bcrypt (12 rondas). Al cambiarla se cierran las demás sesiones.
- **Sesiones**: cada inicio de sesión crea una fila en `user_sessions` y el JWT lleva su identificador (`jti`).
  `protect` exige que la sesión exista, no esté revocada ni vencida, por lo que "cerrar sesión", "cerrar otras
  sesiones" y el cambio de contraseña tienen efecto inmediato. **Al desplegar, todos deben iniciar sesión una vez.**
- **Límites**: el login cuenta solo los intentos fallidos (10 por IP / 15 min); cambiar contraseña o correo cuenta
  solo los intentos con la contraseña actual incorrecta (10 por usuario / 15 min).
- **Permisos**: mapa en `backend/utils/permisos.js` (`requirePermission`); `/api/auth/me` devuelve `permissions`
  y el frontend los usa solo para mostrar u ocultar opciones (el backend valida siempre).
- **Documentos**: encabezado, pie, formato de fecha (larga/corta), prefijo del folio, responsable de TI y textos
  de la carta responsiva. Son borradores: **revísalos con el área legal**.
- **Usuarios y permisos** (`admin`): alta, edición y cambio de rol de usuarios del sistema; tabla de permisos por
  rol de solo lectura (misma fuente que valida el backend, `utils/permisos.js`).
  - Los usuarios **nunca se borran físicamente** (hay historial que apunta a ellos): se activan/desactivan
    (`active`). Desactivar cierra de inmediato todas sus sesiones (`user_sessions`).
  - **Restablecer contraseña**: genera una temporal aleatoria que se muestra una sola vez (no se guarda ni se
    audita en texto plano) y marca `must_change_password = 1`; también cierra sus sesiones activas. El frontend
    (`ProtectedRoute`) redirige a Configuración > Seguridad hasta que la cambie; el flag se limpia solo al
    cambiarla (`PUT /perfil/password`).
  - **Protección contra quedarse sin administradores**: nadie puede desactivarse ni cambiarse el rol a sí mismo,
    y ninguna acción puede dejar el sistema con 0 administradores activos (`userModel.countActiveAdmins`).
  - No se agregó migración: las columnas necesarias (`active`, `must_change_password`, …) ya existían desde
    `005_configuracion_cuenta_sesiones.sql`.
- Migración `005_configuracion_cuenta_sesiones.sql` (aditiva): columnas nuevas en `users` y
  `configuracion_empresa`, tabla `user_sessions` e índices en `audit_logs`. Las acciones se registran en `audit_logs`.

API (`/api`): `GET|PUT /perfil`, `PUT /perfil/password`, `POST|DELETE /perfil/foto`, `GET /perfil/sesiones`,
`DELETE /perfil/sesiones/otras`, `DELETE /perfil/sesiones/:id`.
`GET /users`, `GET /users/permisos`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id/estado`,
`POST /users/:id/restablecer-password` (los cuatro últimos, solo `admin`).

## Mantenimientos

Ruta `/mantenimientos`. Calendario mensual (vista por defecto) o listado; ambas con
búsqueda y filtros en la URL. Cualquier usuario con sesión puede consultar; `admin` y
`technician` agendan, cierran, reprograman y cancelan.

- **Dos tipos:** preventivo (programado, para evitar fallas) y correctivo (por una falla reportada).
- **Se agenda por unidad:** equipo, accesorio, impresora o celular. Un equipo **asignado**
  también puede llevar mantenimiento; solo se rechazan las unidades dadas de baja.
- **El mantenimiento NO cambia el estado del inventario.** Un equipo puede estar asignado y
  en mantenimiento a la vez; el estado se sigue cambiando a mano en la ficha de la unidad.
- **Lo planeado y lo hecho van aparte:** `motivo` (qué se va a hacer, al agendar) y
  `trabajo_realizado` (qué se hizo ese día, al cerrarlo).
- **Componentes cambiados:** al cerrarlo se puede anotar cada pieza (RAM, disco, batería…)
  con acción (reemplazado, instalado, retirado, actualizado, limpiado, revisado), detalle,
  número de serie y costo. Así se puede consultar después a qué equipos se les cambió qué.
- **Estados:** `programado` → `en_proceso` → `realizado`, más `reprogramado` y `cancelado`.
  **"Vencido" no se guarda**: es un `programado` con fecha anterior a hoy (se calcula, como
  el resto de los datos derivados del sistema).
- **Reprogramar no pierde el historial:** la cita actual queda como `reprogramado` con su
  fecha original y se crea una nueva ligada a ella (`reprogramado_de`).
- **Nada se borra:** cancelar guarda el motivo. La base impide borrar una unidad que tenga
  mantenimientos (`ON DELETE RESTRICT`).
- **Folio** `MNT-2026-000001` por año. Corregir lo realizado de un mantenimiento ya cerrado
  es posible y queda en el historial como `trabajo_corregido`.
- **En la ficha de cada unidad** hay una sección "Mantenimientos" con su historial y el botón
  para agendar uno nuevo.
- Historial completo en `audit_logs` (`entity = 'mantenimiento'`).
- Calendario propio (cuadrícula de Tailwind, **sin dependencias nuevas**): etiquetas de color
  por estado e icono por tipo en escritorio, puntos y panel del día en móvil.

Permisos: `mantenimientos.ver` (todos los roles) · `mantenimientos.programar`,
`mantenimientos.realizar`, `mantenimientos.cancelar` (`admin` y `technician`).

API (`/api`): `GET /mantenimientos` (con `desde`/`hasta` devuelve el mes completo sin paginar;
sin fechas, pagina), `GET /mantenimientos/stats`, `POST /mantenimientos`,
`GET|PUT /mantenimientos/:id`, `POST /:id/iniciar`, `POST /:id/realizar`,
`POST /:id/reprogramar`, `POST /:id/cancelar`, `GET /:id/historial`.
Filtros: `tipo`, `estado` (incluye `vencido`), `prioridad`, `tipo_recurso`, `recurso_id`, `search`.

Migración `006_mantenimientos.sql` (aditiva): tablas `mantenimientos` y
`mantenimientos_componentes`, y la vista `v_recursos_inventario` (las cuatro tablas del
inventario en una sola forma, reutilizable por otros módulos).

## Software y Licencias (fase 1)

Rutas `/software` (cualquier usuario con sesión) y `/licencias` (solo `admin` y `technician`,
porque traen costos y contratos). Diseño deliberadamente NO es "software → licencia → equipo":
un software puede tener **varias** licencias (contratos distintos), y una licencia se asigna a
un colaborador, a un equipo, o a ambos, con historial completo.

- **`software`** es el programa (AutoCAD, Chrome…), no una licencia. `tipo` (comercial, gratuito,
  open_source, freeware, interno, otro) y `requiere_licencia` son independientes: al elegir un
  tipo gratuito se propone `requiere_licencia = false` (se puede cambiar a mano). El software
  gratuito se registra e instala igual, sin obligar a crear una licencia.
- **`licencias`** es cada contrato/compra: cantidad de puestos, vigencia, costo, proveedor. Un
  mismo software puede tener 2+ licencias (p. ej. dos contratos de AutoCAD con distinta cantidad
  de usuarios y distinta vigencia).
- **`modelos_licencia`** es un catálogo **con comportamiento** (no un ENUM fijo), sembrado con 9
  modelos: perpetua, suscripción mensual/anual, por usuario, por dispositivo, por volumen,
  concurrente, por activación, otro. Cada modelo dice su `ambito` (usuario/dispositivo/ambos, lo
  que exige la asignación) y su `temporalidad` (perpetua = sin vencimiento). Es de solo lectura
  desde la API (`GET /api/catalogos/modelos-licencia`); agregar un modelo nuevo es una fila en la
  base, no una migración de código.
- **"Utilizadas" y "disponibles" NUNCA se guardan**: se calculan de `asignaciones_licencias`
  (vista `v_licencias_uso`), igual que el resto del inventario. Solo se guarda `cantidad_total`.
- **Estado guardado** (`activa`/`suspendida`/`cancelada`) vs. **estado mostrado**
  (`estado_efectivo`, agrega `vencida`/`agotada`/`por_vencer`, calculado a partir de la fecha de
  vencimiento y los puestos libres).
- **Asignar / liberar / transferir**: el mismo mecanismo que equipos/accesorios
  (`fecha_liberacion IS NULL` = vigente; nada se borra). Transferir es liberar + asignar en una
  sola transacción, para mover una licencia de un equipo a otro sin perder el historial.
- **Renovar** crea una licencia **nueva** (folio distinto) ligada a la anterior
  (`renovacion_de_id`), heredando software/modelo/proveedor/cantidad; fechas, costo y número de
  contrato/factura se capturan de nuevo (así se conserva el costo histórico de cada periodo).
- **Proveedores**: tabla compartida por fabricante y distribuidor (sembrada con Microsoft, Adobe,
  Autodesk, Google); alta rápida desde el propio formulario de software/licencia.
- **Costos y contratos son admin-only**: un técnico administra software y licencias (crear,
  editar, asignar, liberar, transferir, renovar, suspender) pero **no ve ni puede escribir**
  costo, moneda, número de contrato ni número de factura — esos campos se ocultan en la respuesta
  y, si de todos modos llegan en la petición, el backend los descarta antes de guardar. Cancelar
  una licencia es exclusivo de `admin`.
- Historial completo en `audit_logs` (`entity = 'licencia'` / `'software'` / `'proveedor'`).

Permisos: `software.ver` (todos) · `software.gestionar`, `licencias.ver`, `licencias.gestionar`,
`licencias.asignar` (`admin`/`technician`) · `licencias.cancelar`, `licencias.costos_ver` (solo `admin`).

API (`/api`): `GET|POST /software`, `GET /software/stats`, `GET|PUT /software/:id`,
`PATCH /software/:id/estado`, `GET /software/:id/licencias`, `GET /software/:id/usuarios`;
`GET|POST /licencias`, `GET /licencias/stats`, `GET|PUT /licencias/:id`, `PATCH /licencias/:id/estado`,
`POST /licencias/:id/renovar`, `GET|POST /licencias/:id/asignaciones`,
`POST /licencias/:id/asignaciones/:aid/liberar`, `POST /licencias/:id/asignaciones/:aid/transferir`,
`GET /licencias/:id/historial`; `GET|POST /proveedores`, `GET|PUT /proveedores/:id`,
`PATCH /proveedores/:id/activo`; catálogos nuevos: `categorias-software` (editable),
`modelos-licencia` (solo lectura).

Migración `007_software_licencias.sql` (aditiva): tablas `proveedores`, `categorias_software`,
`modelos_licencia` (+9 filas), `software`, `licencias`, `asignaciones_licencias`, vista
`v_licencias_uso`. No modifica ninguna tabla existente.

**Fuera de esta fase** (deliberadamente, para no sobrecargar la primera entrega): instalaciones de
software (separar "tiene licencia" de "está instalado"), documentos de licencia (facturas,
contratos como archivo), claves/product keys cifradas, y credenciales de cuentas de servicio.
Quedan preparadas en el diseño para fases siguientes sin romper lo ya construido.

## Redes y Dispositivos de Red (fase 1)

Ruta `/redes`, con pestañas **Redes | Dispositivos | Conexiones** (visible solo a `admin` y
`technician`: trae IPs, gateways y MACs, información de infraestructura que `viewer` no ve).

- **`redes`** y **`dispositivos_red`** son entidades independientes: un router no "pertenece" a
  una sola red. La relación real vive en **`dispositivos_red_redes`** (tabla M:N pura) — un
  Access Point puede estar en la red corporativa y en la de invitados a la vez, un switch en
  varias VLANs. Esa tabla, por sí sola, ya responde "qué dispositivos usa esta red" y "qué redes
  usa este dispositivo", que es la base lógica para una futura vista de topología (no incluida
  aún: por ahora la pestaña **Conexiones** la muestra como tabla, no como diagrama).
- **Reutiliza** `ubicaciones`, `areas` y `proveedores` (ya existían): no se duplicó ningún
  catálogo. `responsable` apunta a `users` (personal de TI), no a `colaboradores`: un dispositivo
  de red lo administra TI, no se le "asigna" a alguien como un equipo.
- **Contraseña Wi-Fi cifrada** (AES-256-GCM, `utils/cripto.js`) en vez de hash: a diferencia de
  una contraseña de acceso, esta se necesita recuperar en claro para dársela a alguien. La clave
  de cifrado vive en `NETWORK_SECRET_KEY` (variable de entorno, 32 bytes en base64), nunca en la
  base ni en el código. Nunca sale en los listados ni en el detalle normal: **"Mostrar
  contraseña"** es una acción aparte (permiso `redes.ver_contrasenas`, solo `admin`) que exige
  confirmar la contraseña de tu propia cuenta, se oculta sola a los 30 s, y cada consulta queda
  en `audit_logs` (acción `password_consultada`, sin el valor).
- **"Eliminar" es desactivar** (`redes.eliminar` → estado `inactiva`; `dispositivos_red.eliminar`
  → estado `baja`), igual que "dar de baja" un equipo: nada se borra físicamente. La tabla de
  relación (`dispositivos_red_redes`) sí usa `ON DELETE CASCADE` a propósito (es una tabla de
  unión pura, sin valor propio sin el dispositivo o la red), pero la API nunca borra redes ni
  dispositivos, así que en la práctica no aplica.
- **Folio** `NET-00001` por dispositivo (igual que EQ-/IMP-/LIC-/MNT- en el resto del sistema).
- Historial completo en `audit_logs` (`entity = 'red'` / `'dispositivo_red'`).

Permisos: `redes.ver` (`admin`/`technician`) · `redes.ver_contrasenas` (solo `admin`) ·
`redes.crear`, `redes.editar` (`admin`/`technician`) · `redes.eliminar` (solo `admin`) ·
`dispositivos_red.crear`, `dispositivos_red.editar` (`admin`/`technician`) ·
`dispositivos_red.eliminar` (solo `admin`).

API (`/api`): `GET|POST /redes`, `GET /redes/todas` (sin paginar, para selects), `GET /redes/stats`,
`GET|PUT /redes/:id`, `PATCH /redes/:id/estado`, `POST /redes/:id/password` (revelar),
`GET /redes/:id/dispositivos`, `GET /redes/:id/historial`;
`GET|POST /dispositivos-red`, `GET /dispositivos-red/stats`, `GET /dispositivos-red/conexiones`,
`GET|PUT /dispositivos-red/:id`, `PATCH /dispositivos-red/:id/estado`,
`POST|DELETE /dispositivos-red/:id/imagen`, `GET|POST /dispositivos-red/:id/redes`,
`DELETE /dispositivos-red/:id/redes/:redId`, `GET /dispositivos-red/:id/historial`.

Migración `008_redes_dispositivos.sql` (aditiva): tablas `redes`, `dispositivos_red`,
`dispositivos_red_redes`. No modifica ninguna tabla existente.

**Fuera de esta fase**: editor visual de topología (la relación lógica ya está lista para
construirlo encima), claves/credenciales adicionales por dispositivo, y reportes del módulo.

## Reportes y Análisis

Ruta `/reportes` (solo `admin` y `technician`: cruza colaboradores, licencias y redes,
todos ya restringidos a ese nivel). **Sin migración**: no existe ninguna tabla de
estadísticas — cada tarjeta y cada gráfico se calcula al vuelo con `COUNT`/`SUM`/`GROUP BY`
sobre las tablas que ya existen (equipos, accesorios, impresoras, celulares,
colaboradores, mantenimientos, licencias, redes, dispositivos_red). Nada se duplica.

- **Indicadores:** total de activos y su desglose (asignados/disponibles/en
  mantenimiento/de baja — `reparacion` cuenta como mantenimiento y `perdido` como baja),
  colaboradores, uso de licencias, garantías (vigentes/por vencer a 60 días/vencidas) y
  dispositivos de red.
- **Gráficos** (ver `dataviz` — paleta categórica validada contra CVD, `node
  scripts/validate_palette.js`, y canal de color reservado para severidad):
  distribución de activos por tipo (categórico), por departamento y por ubicación
  (ranking, un solo tono), mantenimientos por periodo con preventivo vs. correctivo
  (barras agrupadas), estado de garantías (colores de severidad + ícono, nunca solo
  color), uso de licencias (medidor, no un pastel) y dispositivos de red por tipo.
  Son SVG/CSS hechos a mano — **no se agregó ninguna librería de gráficas**.
- **"Departamento" de un activo** = área del colaborador que lo tiene asignado hoy (o,
  si no tiene responsable pero sí ubicación física, el área de esa ubicación).
  **"Ubicación"**: en este sistema **solo las impresoras** tienen una ubicación física
  propia (equipos, accesorios y celulares no la tienen) — el reporte lo dice así en
  pantalla en vez de mostrar un dato incompleto sin avisar.
- **Filtros globales** (periodo, departamento, ubicación, tipo de activo, estado) en
  una sola fila que alcanza a todas las tarjetas y gráficos de la página.
- **Exportar a PDF y Excel** con los filtros activos: encabezado con el nombre de la
  empresa, fecha y hora de generación, quién lo generó y los filtros usados. Cada
  exportación queda en `audit_logs` (`entity = 'reporte'`, formato y filtros, sin datos
  sensibles). Un solo "Reporte general" por ahora (resumen + cada desglose); reportes
  por tema (solo mantenimientos, solo garantías...) quedan para una fase futura,
  reutilizando las mismas funciones de agregación.

Dependencia nueva: **`exceljs`** (backend), para generar el archivo `.xlsx` real —
no había ninguna forma de cumplir "descargable en Excel" sin una librería.

Permisos: `reportes.ver`, `reportes.exportar` (ambos `admin`/`technician`).

API (`/api`): `GET /reportes/dashboard`, `GET /reportes/exportar?formato=pdf|excel`
(filtros por query string: `desde`, `hasta`, `departamento_id`, `ubicacion_id`,
`tipo_activo`, `estado`).

## Dashboard

Ruta `/dashboard` (todos los roles; el contenido varía según el rol). Reemplaza al
mock inicial: **todo se calcula al vuelo** con SQL sobre las tablas que ya existen
(reutiliza directamente las agregaciones de `reporteModel` donde coinciden). **Sin
migración.**

- **Tarjetas, estado del inventario, inventario por categoría, garantías y
  licencias**: mismas fuentes que Reportes, más un desglose propio que separa
  Monitores de Accesorios e incluye Redes y dispositivos (Reportes no los cuenta como
  "activo").
- **Alertas y pendientes**: mantenimientos vencidos/próximos (7 días), garantías por
  vencer/vencidas, equipos sin colaborador asignado, licencias por vencer/agotadas,
  dispositivos de red inactivos. Cada una es un enlace al módulo ya filtrado
  (`/equipos?asignacion=sin`, `/mantenimientos?vista=lista&estado=vencido`,
  `/licencias?estado=agotada`, `/redes?tab=dispositivos&estado=inactivo`...). Las de
  licencias/redes no aparecen para `viewer` (no puede abrir esos módulos).
- **Garantías próximas a vencer**: tabla propia (equipos + accesorios + impresoras +
  celulares, y dispositivos de red para `admin`/`technician`) con días restantes;
  "Proveedor" es el texto libre `garantia_detalle` que ya existía (no hay un catálogo
  de proveedor para estos activos, salvo en dispositivos de red). **No existe todavía
  un módulo "Garantías"** (la ruta `/garantias` sigue siendo un placeholder): esta
  sección es autosuficiente y cada fila enlaza al detalle del activo.
- **Actividad reciente**: reutiliza `audit_logs` (ya existía desde la Etapa 1, sin
  tabla nueva). Antes de este dashboard, Equipos/Accesorios/Impresoras/Celulares y
  Colaboradores no dejaban ningún rastro ahí; se agregaron los registros que faltaban
  (alta, edición, asignación, devolución, baja/reactivación) en `inventarioModel.js`,
  `asignacionModel.js` y `colaboradorController.js`. El texto de cada evento lo arma
  el backend a partir de `entity` + `action` (nunca se guarda un texto ya armado).
- **Roles**: `viewer` no ve colaboradores, licencias, ni actividad/garantías de redes
  (mismos permisos que ya exigían esos módulos); `admin`/`technician` ven todo.

API: `GET /api/dashboard`.

## Notificaciones

Campana del header (badge con el número de no leídas + panel desplegable). A
diferencia del Dashboard, **sí hay una tabla nueva** (`notificaciones`,
migración `009_notificaciones.sql`, aditiva): el propio pedido explícitamente
exige poder controlar qué ya se generó y evitar duplicados, algo que no se
puede resolver solo con SQL al vuelo.

- **Una fila = una notificación de UN usuario.** Cuando algo aplica a varios
  roles (p. ej. "licencia por vencer" es para todo el `STAFF`), se generan
  varias filas —una por usuario activo elegible— con un solo
  `INSERT IGNORE ... SELECT ... FROM users` (fan-out en SQL, no un bucle en
  JS). `rol_destinatario` queda como dato informativo (el rol de *ese*
  destinatario); `usuario_id` es quien realmente la recibe y la lee.
- **Sin duplicados nunca:** `UNIQUE (usuario_id, clave_dedup)`. Cada tipo de
  notificación arma su propia clave; volver a generarla (recargar el panel,
  reintentar el sync) es un `INSERT IGNORE` que no hace nada si ya existe.
  El cuidado real está en **qué se usa como clave**:
  - Eventos únicos por naturaleza (alta de un equipo) usan el id del equipo.
  - Eventos que SÍ se repiten sobre el mismo equipo (asignar, devolver) usan
    el id de la asignación (una fila nueva cada vez), no el del equipo —
    si no, la segunda asignación jamás notificaría.
  - Alertas por fecha (garantías/licencias) usan "cubos" no traslapados
    (30 días / 7 días / vencida): cada equipo dispara cada aviso una sola
    vez al cruzar esa ventana, y como los cubos no se superponen, "vence en
    30 días" y "vence en 7 días" son dos notificaciones distintas.
- **Dos formas de generarlas:**
  - **Por evento**, en el momento: alta de equipo, asignación/devolución
    ("equipo sin asignar" cuando vuelve disponible), baja, mantenimiento
    agendado/completado, dispositivo de red marcado inactivo. Viven en los
    mismos modelos que ya auditan esa acción (`inventarioModel.js`,
    `asignacionModel.js`, `mantenimientoModel.js`, `dispositivoRedModel.js`),
    en la misma transacción.
  - **Por fecha**, recalculadas en `notificacionModel.sincronizarAlertas()`:
    garantías y licencias por vencer/vencidas, mantenimientos de hoy,
    próximos (7 días) o vencidos. Se dispara al consultar `/notificaciones`
    o `/notificaciones/no-leidas`, con un throttle en memoria de 60 s para no
    repetir el cálculo en cada sondeo de la campana (la tabla, de por sí, ya
    impide duplicados aunque se llame más seguido).
- **Permisos**: mismo criterio que en Dashboard — equipos/mantenimientos son
  visibles para todos los roles; licencias y dispositivos de red, solo
  `admin`/`technician`. Se resuelve en el momento de generar (solo se
  inserta para los usuarios de los roles elegibles), no filtrando al leer.
- **Cada notificación ya trae su enlace resuelto** (`enlace`, p. ej.
  `/equipos/12`) para ir directo al registro; mantenimientos no tienen una
  ruta de detalle propia todavía, así que enlazan al calendario en ese día
  (`/mantenimientos?dia=YYYY-MM-DD`).
- **Nada se borra**: "leída" es un flag (`leida` + `fecha_leida`), igual que
  el resto del sistema.

API: `GET /api/notificaciones?leida=&page=&limit=`, `GET /api/notificaciones/no-leidas`,
`PATCH /api/notificaciones/:id/leida`, `POST /api/notificaciones/marcar-todas`.

## Configuración (fase 2)

Completa las secciones que en la fase 1 quedaron "próximamente", reorganizadas
en tres grupos — **la separación personal/global es literal, no solo visual**:
`grupo: 'cuenta'` cambia SOLO la cuenta de quien la edita (`/api/perfil/*`);
`grupo: 'organizacion'` cambia algo que ven TODOS (`/api/empresa/*`,
`/api/datos/*`, `/api/colaboradores/importar`) y por eso exige `admin`, igual
que Empresa/Documentos/Usuarios en la fase 1. Migración `010_configuracion_fase2.sql`.

- **Apariencia** (`users.preferencias_ui`, JSON): tema claro/oscuro/automático,
  color de acento y densidad de tablas. Se aplica a **toda la app sin tocar
  cada componente**: `slate`, `white` y `brand` se redefinieron en
  `tailwind.config.js` como variables CSS (`--color-*`, formato "R G B" para
  que `/opacidad` siga funcionando), con los valores de cada tema en
  `index.css` (`:root` / `.dark` / `[data-acento]`). `ThemeContext.jsx` decide
  el tema (incluye "automático" vía `prefers-color-scheme`) y pone la clase
  `.dark` en `<html>`; un script mínimo en `index.html` aplica el tema desde
  `localStorage` antes de que React monte, para no parpadear. Texto/bordes que
  van SIEMPRE en blanco (sidebar, botones primarios — superficies que no
  cambian con el tema) usan el color `oncolor` en vez de `white`, para no
  apagarse en oscuro; por la misma razón, los usos de `text-brand-900` como
  color de texto (no de fondo) pasaron a `text-brand-500`, que sí es legible
  en ambos temas.
- **Notificaciones** (preferencias, tabla `notificacion_preferencias`,
  `usuario_id` × `categoria`): activar/desactivar cada categoría (inventario,
  mantenimientos, garantías, licencias, redes) **dentro del sistema** y **por
  correo**, por separado. El canal de correo se guarda pero todavía no envía
  nada (no hay SMTP configurado en el proyecto); es la misma idea que "2FA:
  se prepara la estructura". Solo se listan las categorías que el rol del
  usuario puede recibir. `notificacionModel.notificarRoles()` ahora hace
  `LEFT JOIN` contra esta tabla antes de insertar: una fila ausente cuenta
  como activada (opt-out, no opt-in).
- **Privacidad y seguridad** (antes "Seguridad"): igual que la fase 1
  (contraseña, sesiones), más una tarjeta de **Autenticación en dos pasos**
  (`users.two_factor_enabled`, columna lista; sin flujo TOTP/QR todavía —
  mismo criterio que el resto del proyecto de "no inventar una función a
  medias": el toggle se muestra pero deshabilitado, "Próximamente").
- **Confirmación adicional para datos sensibles**: **no** es una preferencia
  personal (dejar que cada quien se las desactive sería un hueco de
  seguridad) — es una **política global** que un administrador activa en
  Empresa > Configuración de seguridad
  (`configuracion_empresa.requiere_reautenticacion_sensible`). Con la política
  activa, `middleware/reautenticacion.js#requireReciente()` exige que la
  sesión haya confirmado la contraseña en los últimos 15 minutos
  (`POST /api/perfil/verificar-password`, marca `user_sessions.reautenticado_en`);
  si no, responde `401 { code: 'REAUTH_REQUIRED' }`, que el frontend
  distingue de una sesión inválida (no cierra sesión) y resuelve mostrando
  `VerificarPasswordModal.jsx` (reutilizable). Reemplaza el mecanismo anterior
  de revelar la contraseña Wi-Fi (antes pedía la contraseña en CADA revelada,
  sin poder desactivarse); ahora también protege exportar/importar datos.
- **Datos y respaldos** (admin): **exportar** = un Excel con varias hojas
  (equipos, accesorios, impresoras, celulares, colaboradores, licencias),
  reutilizando `exceljs` como Reportes — es el "respaldo manual" que la
  arquitectura puede ofrecer con seguridad; no hay `mysqldump` ni respaldos
  automáticos (no es seguro invocar el shell del servidor desde una petición
  HTTP en esta arquitectura). **Importar** está acotado a Colaboradores (alta
  masiva desde una plantilla `.xlsx`, fila por fila: una fila con error no
  tumba al resto, y el reporte dice cuál y por qué). El archivo se procesa en
  memoria (`multer.memoryStorage()`), nunca se guarda en disco. Ambas acciones
  respetan la política de reautenticación.
- **Términos y condiciones** / **Acerca del sistema**: contenido de solo
  lectura. Términos es texto genérico de referencia (`backend/utils/terminos.js`,
  igual criterio que los textos por defecto de cartas responsivas: **no es un
  documento legal definitivo**, hay que revisarlo con el área legal) con
  descarga en PDF (`pdfmake`, mismo motor que cartas/reportes). Acerca del
  sistema es 100% estático en el frontend (versión, pila tecnológica): no se
  inventó URL ni contacto de soporte que no existiera.

API: `PUT /api/perfil/preferencias`, `POST /api/perfil/verificar-password`,
`GET|PUT /api/notificaciones/preferencias`, `PATCH /api/empresa/politica-seguridad`,
`GET /api/datos/exportar`, `GET /api/colaboradores/plantilla-importacion`,
`POST /api/colaboradores/importar`, `GET /api/terminos`, `GET /api/terminos/pdf`.

## Siguientes etapas (no incluidas aún)

Módulo "Garantías" (hoy es un widget del Dashboard, no una página propia con
lista/filtros), gestión de ubicaciones y departamentos, códigos QR, y una página de
auditoría real (`/auditoria`) sobre `audit_logs` — ya hay páginas placeholder y rutas
listas para conectarlas.
