# Especificacion de Requisitos - GestioCambios

Este documento detalla la especificacion de requisitos de software (SRS) para el sistema de control de cambios de configuracion GestioCambios, organizados en requisitos funcionales y requisitos no funcionales, utilizando las columnas requeridas: ID, Requerimiento, Descripcion, Modulo y Prioridad.

---

## 1. Requisitos Funcionales (RF)

| ID | Requerimiento | Descripcion | Modulo | Prioridad |
| :--- | :--- | :--- | :--- | :--- |
| RF-01 | Autenticacion y Sesion | El sistema debe permitir el inicio de sesion seguro mediante correo y contrasena, manteniendo la sesion activa del usuario. | Seguridad | Alta |
| RF-02 | Control de Acceso por Roles (RBAC) | Habilitar o restringir el acceso a modulos y la ejecucion de acciones segun los 8 roles del sistema (Administrador, Solicitante, Director, Lider Tecnico, CCB, Gestor, Desarrollador, Tester). | Seguridad | Alta |
| RF-03 | Registro de Solicitudes | Permitir al Solicitante registrar nuevos tickets de cambio con ID correlativo automatico, ingresando titulo, descripcion, justificacion, tipo de cambio e impacto inicial. | Gestion de Cambios | Alta |
| RF-04 | Flujo y Maquina de Estados | Regular estrictamente la transicion de estados del ticket de cambio segun el rol del usuario autenticado, respetando la matriz de transiciones del negocio. | Gestion de Cambios | Alta |
| RF-05 | Asignacion de Recursos | Permitir al Gestor de Configuracion asignar un Desarrollador y un Tester responsables a cada solicitud de cambio que haya sido aprobada. | Gestion de Cambios | Alta |
| RF-06 | Registro de Evidencias Git | Habilitar al Desarrollador Asignado para asociar el nombre de la rama Git, la URL del Pull/Merge Request y comentarios de la solucion al ticket en desarrollo. | Gestion de Cambios | Media |
| RF-07 | Registro de Pruebas QA | Permitir al Tester registrar el total de pruebas ejecutadas, pruebas fallidas, notas tecnicas de calidad y adjuntar observaciones del control de calidad. | Control de Calidad | Alta |
| RF-08 | Validacion UAT | Permitir al Solicitante verificar el cambio en ambiente de aceptacion de usuario y dar su conformidad (Listo para Integracion) o retornar a desarrollo. | Control de Calidad | Alta |
| RF-09 | Auditoria de Transiciones | Registrar de forma automatica y permanente cada cambio de estado indicando: estado previo, nuevo estado, fecha y hora exacta, nombre del usuario, rol y comentario justificativo. | Auditoria | Alta |
| RF-10 | Bandeja de Tareas Dinamica | Mostrar en el dashboard una bandeja de entrada filtrada con los tickets de cambio que requieren la accion o aprobacion del usuario segun su rol. | Dashboard | Media |
| RF-11 | Consultas y Filtros Avanzados | Permitir la busqueda e identificacion de tickets aplicando filtros combinados por estado, prioridad, tipo y campos de texto (titulo, descripcion). | Dashboard | Media |
| RF-12 | Registro de Proyectos | Habilitar al Administrador para crear, editar y archivar proyectos especificando nombre, descripcion, fechas y estado. | Administracion | Alta |
| RF-13 | Configuracion de Equipo y Clientes | Permitir al Administrador asociar usuarios a proyectos especificando su rol interno de trabajo y registrar los clientes autorizados a solicitar cambios. | Administracion | Alta |
| RF-14 | Creacion y Edicion de Actividades | Permitir al Administrador registrar actividades en el cronograma del proyecto asociadas a fases metodologicas y entregables (ECMs). | Administracion | Alta |
| RF-15 | Gestion de Metodologias SCM | Permitir al Administrador definir y estructurar metodologias de trabajo compuestas por Etapas, Fases y Elementos de Configuracion (ECMs). | Administracion | Alta |
| RF-16 | Registro de Usuarios Globales | Habilitar al Administrador para crear, actualizar y dar de baja cuentas de usuario del sistema (nombre, correo, contrasena cifrada y rol global). | Administracion | Alta |

---

## 2. Requisitos No Funcionales (RNF)

| ID | Requerimiento | Descripcion | Modulo | Prioridad |
| :--- | :--- | :--- | :--- | :--- |
| RNF-01 | Cifrado de Contrasenas | El sistema debe almacenar las claves de usuario cifradas en la base de datos utilizando el algoritmo hash Bcrypt. | Seguridad | Alta |
| RNF-02 | Pool de Conexiones a Base de Datos | La conexion con MariaDB/MySQL debe optimizarse mediante connection pooling para soportar accesos concurrentes de forma eficiente. | Base de Datos | Alta |
| RNF-03 | Arquitectura Desacoplada MVC | La aplicacion debe seguir el patron de diseno Model-View-Controller para independizar la interfaz, logica de rutas y acceso a base de datos. | Arquitectura | Alta |
| RNF-04 | Compatibilidad del Servidor | El sistema debe ser compatible para ejecucion sobre Node.js v18+ y bases de datos relacionales estándar MySQL 5.7+ o MariaDB 10.3+. | Servidor | Alta |
| RNF-05 | Interfaz Web Adaptable (Responsiva) | La interfaz de usuario debe adaptarse de manera fluida a resoluciones de pantallas moviles, tablets y ordenadores mediante estilos CSS responsivos. | Interfaz de Usuario | Media |
| RNF-06 | Tolerancia a Fallos y Excepciones | El servidor debe implementar middlewares de manejo de errores en Express para capturar excepciones en runtime y evitar caidas inesperadas de la aplicacion. | Servidor | Alta |
| RNF-07 | Rendimiento en Consultas | Las consultas de tickets, listados e historiales deben retornar en un tiempo maximo de 2 segundos en condiciones de carga estandar. | Sistema | Media |
