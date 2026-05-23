# 🚀 GestioCambios G04 - Sistema SCM (Software Configuration Management)

Este proyecto es un **Sistema de Gestión de la Configuración del Software (SCM)** diseñado para controlar, rastrear y aprobar los cambios en el ciclo de vida del desarrollo de software mediante un flujo de trabajo estructurado basado en roles.

---

## 🛠️ Tecnologías y Lenguajes Utilizados

El proyecto está construido bajo una arquitectura Monolítica (MVC clásico) renderizada desde el servidor:

- **Backend / Servidor:** [Node.js](https://nodejs.org/) con el framework [Express.js](https://expressjs.com/).
- **Motor de Vistas:** [EJS (Embedded JavaScript templates)](https://ejs.co/), usado para generar el HTML dinámicamente inyectando datos desde el backend.
- **Base de Datos:** MySQL / MariaDB. Se interactúa mediante la librería `mysql2/promise` para ejecutar consultas asíncronas de manera nativa.
- **Frontend / Estilos:** CSS Plano (`styles.css`) fuertemente inspirado en los design tokens de **Tailwind CSS** y componentes de **shadcn/ui** (Dark mode) para una interfaz limpia y moderna sin dependencias frontend pesadas. JavaScript vainilla para interacciones básicas de la UI (como el sidebar).

---

## 📂 Estructura Raíz del Proyecto

```text
GestioCambios/
├── .env                  # Variables de entorno (Credenciales de BD Filess.io o Local)
├── bd.sql                # Script SQL completo: tablas, relaciones y datos de prueba.
├── package.json          # Dependencias (express, ejs, mysql2, dotenv, etc) e info del proyecto.
├── server.js             # Punto de entrada de la app: Configura Express, EJS, y arranca el server local (Puerto 3000).
│
├── config/
│   └── db.js             # Crea el Pool de conexión a MySQL, y exporta helpers y constantes (ROLES, ESTADOS).
│
├── controllers/          # Lógica de Negocio
│   ├── authController.js # Maneja el Login/Logout y sesiones de usuario.
│   └── changeController.js # CRUD de tickets, lógica del dashboard y MÁQUINA DE TRANSICIONES de estados.
│
├── routes/               # Enrutadores de Express
│   ├── apiRoutes.js      # Rutas que procesan datos (POST/PUT para crear tickets, cambiar estados).
│   └── webRoutes.js      # Rutas que renderizan las pantallas (GET para ver Dashboard, Login, tickets).
│
├── views/                # Pantallas en formato .EJS
│   ├── dashboard.ejs     # Panel principal.
│   ├── login.ejs         # Pantalla de acceso.
│   ├── nuevo-ticket.ejs  # Formulario de creación de Solicitudes de Cambio.
│   ├── tickets.ejs       # Tabla listado de todos los tickets.
│   ├── ticket-detail.ejs # Vista detallada (Línea de tiempo, botones de transición de estado).
│   └── partials/         # Componentes reusables (head.ejs, sidebar.ejs, footer.ejs).
│
└── public/               # Archivos estáticos públicos
    ├── css/styles.css    # Hoja de estilos principal (Diseño Dark Premium).
    └── js/sidebar.js     # Lógica visual del menú lateral.
```

---

## 🔄 Flujo del Sistema (Workflow SCM) y Roles

El ciclo de vida de una **Solicitud de Cambio (Ticket)** sigue un flujo de estados estricto. Un ticket solo puede avanzar o retroceder dependiendo del **rol** del usuario que ha iniciado sesión.

### Pasos del Flujo:

1. **📝 Solicitado**: Un **Solicitante** (ej. un docente o cliente) encuentra un bug o requiere una mejora y crea el ticket.
2. **🔍 En Análisis**: El **Director** o **Gestor de Configuración** toma la solicitud recién creada, evalúa si es viable a nivel de negocio y pasa el ticket a Análisis para que el equipo lo revise.
3. **⏳ Pendiente de Aprobación**: El **Líder Técnico** (tras estimar horas e impacto) lo envía a este estado para pedir autorización oficial.
4. **✅ Aprobado / ❌ Rechazado**: El **Director** o el **Comité de Control de Cambios (CCB)** deciden oficialmente si el cambio se implementa o se rechaza.
5. **💻 En Desarrollo**: Si es Aprobado, el ticket pasa al **Desarrollador Asignado**, quien trabajará en el código.
6. **🧪 En Pruebas QA**: Al terminar, el desarrollador lo envía a este estado. El **Tester (Equipo de Calidad)** verifica que los cambios funcionen.
7. **👥 En Pruebas UAT**: (Opcional) Pruebas de aceptación con el usuario final.
8. **🔗 Listo para Integración**: QA da luz verde para hacer el despliegue.
9. **🚀 Liberado**: El Gestor o Líder Técnico cierra el ticket porque los cambios ya están en Producción.

### Credenciales de prueba (Contraseña para todos: `123`)
Para probar los "turnos" del flujo, debes iniciar sesión con estos usuarios en orden:
- `docente@upt.pe` -> Solicitante (Crea el ticket).
- `director@upt.pe` -> Director (Aprueba viabilidad inicial).
- `sergio@upt.pe` / `diego@upt.pe` -> Gestores / Líder (Analizan).
- `ccb@upt.pe` -> Comité CCB (Aprueba el cambio para desarrollo).

---

## 🗄️ Base de Datos Explicada

El sistema utiliza una base de datos relacional robusta con Integridad Referencial. 

Las tablas principales son:

- `usuarios` y `roles`: Gestión de acceso.
- `solicitudes_cambio`: Tabla principal. Guarda la información del SCM (Descripción, Justificación, Horas estimadas, Tipo de Cambio, Impacto, y el **estado** actual).
- `historial_estados`: Funciona como la tabla de **Auditoría**. Cada vez que un usuario presiona un botón para avanzar o rechazar un ticket, se graba aquí un registro (Quién lo hizo, en qué momento, desde qué estado anterior y hacia cuál nuevo). Esto permite pintar la **Línea de Tiempo** en la UI.
- `ecs_afectados` & `evidencias_git`: Tablas secundarias de trazabilidad técnica (archivos tocados o URLs de Pull Requests en GitHub).

### Conexión Remota / Configuración
El proyecto se conecta a la BD mediante **Variables de Entorno**. 
Actualmente está configurado para apuntar a un clúster de base de datos en la nube (`filess.io`).

Para levantarlo necesitas un archivo `.env` en la raíz (ya creado):
```env
DB_HOST=""
DB_PORT=""
DB_USER=""
DB_PASSWORD=""
DB_NAME=""
```

> **⚠️ Importante para despliegue:** La base de datos externa en Filess.io necesita las tablas para funcionar. Se debe copiar todo el contenido del archivo `bd.sql` local y pegarlo/ejecutarlo en el panel PHPMyAdmin o de queries de Filess.io para volcar la estructura inicial y los usuarios.

---

## 🏃‍♂️ Cómo arrancar el proyecto

1. Realizar un `npm install` para obtener las librerías (`express`, `ejs`, `mysql2`, `dotenv`).
2. Configurar o verificar las credenciales en el archivo `.env`.
3. Validar en `filess.io` que el script `bd.sql` ha sido ejecutado.
4. Escribir en la consola: `npm start`.
5. Visitar en el navegador: `https://gestion-de-cambios.onrender.com`.
