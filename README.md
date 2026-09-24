# TechControl

Sistema web para la gestión integral de activos de TI, colaboradores, software, licencias y mantenimiento.

## 📋 Descripción

**TechControl** es una plataforma web diseñada para centralizar y facilitar la administración de los recursos tecnológicos de una empresa.

El sistema permite llevar el control de equipos de cómputo, colaboradores, software, licencias y mantenimientos, además de proporcionar herramientas de auditoría, reportes y visualización de información mediante un dashboard.

## 🚀 Funcionalidades

* 🔐 Autenticación y control de acceso
* 👥 Gestión de colaboradores
* 💻 Inventario de equipos de TI
* 👤 Asignación de equipos a colaboradores
* 🧩 Gestión de software
* 📄 Administración de licencias
* 🔧 Mantenimiento preventivo y correctivo
* 📅 Calendario de mantenimientos
* 📋 Historial de mantenimiento de equipos
* 📊 Dashboard con información general
* 📈 Generación y consulta de reportes
* 📝 Registro de auditoría de acciones
* ⚙️ Configuración del sistema
* 👮 Gestión de usuarios y roles

## 🛠️ Tecnologías utilizadas

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express
* JWT
* bcrypt

### Base de datos

* MySQL

## 🏗️ Arquitectura

El proyecto utiliza una arquitectura cliente-servidor:

```text
┌──────────────────────┐
│      Frontend        │
│ React + TypeScript   │
│       Vite           │
└──────────┬───────────┘
           │
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│       Backend        │
│   Node.js + Express  │
└──────────┬───────────┘
           │
           │ SQL
           ▼
┌──────────────────────┐
│       MySQL          │
│      Database        │
└──────────────────────┘
```

## 📁 Estructura del proyecto

```text
techcontrol/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── docs/
│   └── screenshots/
│
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Instalación

### Requisitos

Antes de comenzar, necesitas tener instalado:

* Node.js
* npm
* MySQL
* Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/techcontrol.git
cd techcontrol
```

### 2. Configurar la base de datos

Crea una base de datos en MySQL:

```sql
CREATE DATABASE techcontrol;
```

Después ejecuta el script de estructura de la base de datos incluido en el proyecto.

### 3. Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=techcontrol
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

JWT_SECRET=tu_secreto

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=tu_contraseña
```

> ⚠️ No compartas ni subas el archivo `.env` al repositorio.

### 4. Ejecutar el Backend

```bash
npm run dev
```

El servidor estará disponible en:

```text
http://localhost:4000
```

### 5. Configurar el Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Configura las variables de entorno necesarias y ejecuta:

```bash
npm run dev
```

El frontend estará disponible normalmente en:

```text
http://localhost:5173
```

## 🔑 Roles del sistema

TechControl utiliza diferentes niveles de acceso para controlar las funciones disponibles para cada usuario.

| Rol                      | Descripción                        |
| ------------------------ | ---------------------------------- |
| Administrador            | Acceso completo al sistema         |
| Supervisor               | Gestión y supervisión de recursos  |
| Inspector                | Consulta y revisión de información |
| Técnico de mantenimiento | Gestión de mantenimientos          |
| Consulta                 | Acceso principalmente de lectura   |

## 📊 Módulos principales

### Dashboard

Permite visualizar información general del estado de los recursos tecnológicos de la empresa.

### Equipos

Permite registrar, consultar, actualizar y controlar los equipos tecnológicos, así como conocer su responsable y estado.

### Colaboradores

Centraliza la información de los empleados y permite relacionarlos con los equipos asignados.

### Software y licencias

Permite administrar el software utilizado por la empresa y controlar las licencias disponibles, asignadas y utilizadas.

### Mantenimiento

Permite programar y registrar mantenimientos preventivos y correctivos, incluyendo una descripción de las actividades realizadas y componentes reemplazados.

### Auditoría

Registra acciones importantes realizadas dentro del sistema para facilitar el seguimiento y control de cambios.

### Reportes

Permite consultar información del inventario y obtener datos útiles para la administración de los recursos tecnológicos.

## 🧪 Pruebas

El sistema fue sometido a pruebas funcionales para verificar:

* Inicio y cierre de sesión.
* Control de acceso según el rol.
* CRUD de colaboradores.
* CRUD de equipos.
* Asignación de equipos.
* Gestión de software y licencias.
* Registro y seguimiento de mantenimientos.
* Funcionamiento del calendario.
* Registro de auditoría.
* Validación de formularios.
* Manejo de errores.
* Persistencia de información en MySQL.

## 📸 Capturas de pantalla

### Login

![Login](docs/screenshots/login.png)

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Equipos

![Equipos](docs/screenshots/equipos.png)

### Mantenimiento

![Mantenimiento](docs/screenshots/mantenimiento.png)

### Licencias

![Licencias](docs/screenshots/licencias.png)

## 🔒 Seguridad

El proyecto implementa diferentes mecanismos para proteger la información y controlar el acceso al sistema, incluyendo:

* Autenticación mediante JWT.
* Contraseñas protegidas mediante hashing.
* Control de acceso basado en roles.
* Variables de entorno para información sensible.
* Validación de datos.
* Restricción de acceso a determinadas funcionalidades.

## 📌 Estado del proyecto

**Proyecto finalizado — versión inicial.**

Actualmente se encuentra preparado como proyecto de demostración y portafolio.

## 👨‍💻 Autor

**José Isaac Macías Delgado**

Desarrollador de Software / TI

GitHub: https://github.com/Isaacma2116


