# Especificación de Requisitos - GestioCambios

Este documento detalla la especificación de requisitos de software (SRS) para el sistema de control de cambios de configuración **GestioCambios**, divididos en funcionales (comportamiento) y no funcionales (calidad y restricciones técnicas).

---

## 📋 1. Requisitos Funcionales (RF)

| ID | Nombre | Descripción |
| :--- | :--- | :--- |
| **RF-01** | Autenticación y Sesión | El sistema debe permitir el inicio de sesión mediante correo y contraseña (cifrada), manteniendo el perfil en sesión. |
| **RF-02** | Control de Acceso por Roles (RBAC) | Restringir o habilitar las vistas y acciones según 7 roles: *Solicitante, Director, Gestor de Configuración, Líder Técnico, CCB, Desarrollador, y Tester*. |
| **RF-03** | Registro de Solicitud de Cambio | Permite registrar nuevos tickets con ID correlativo automático (`TK-SC00X`), título, descripción, justificación, tipo e impacto inicial. |
| **RF-04** | Ciclo de Vida del Ticket | Controla de forma estricta las transiciones de estados del ticket de cambio según las reglas de la máquina de estados. |
| **RF-05** | Asignación de Recursos Técnicos | Habilita al Líder Técnico y Gestor para asignar un Desarrollador y un Tester específico a cada solicitud de cambio aprobada. |
| **RF-06** | Registro de Evidencias Git | Permite al Desarrollador asociar el nombre de la rama de Git, URL del Pull/Merge Request y comentarios técnicos de la solución. |
| **RF-07** | Control de Calidad (QA / UAT) | Habilita al Tester para registrar evidencias de pruebas (Aprobado/Rechazado, número de tests ejecutados, fallidos y notas). |
| **RF-08** | Auditoría y Trazabilidad SCM | Registra automáticamente un historial secuencial de cada transición indicando: estado anterior, estado nuevo, fecha/hora, usuario y comentario. |
| **RF-09** | Bandeja de Tareas Dinámica | Muestra en el Dashboard una lista personalizada de los tickets que requieren acción inmediata según el rol del usuario autenticado. |
| **RF-10** | Filtros Avanzados por Servidor | Permite consultar y buscar tickets en el servidor aplicando filtros por estado, prioridad, tipo y coincidencia de texto (ID, título, descripción). |

---

## ⚙️ 2. Requisitos No Funcionales (RNF)

| ID | Atributo de Calidad | Especificación Técnica |
| :--- | :--- | :--- |
| **RNF-01** | Seguridad en Claves | Las contraseñas en base de datos deben cifrarse mediante el algoritmo hash unidireccional **Bcrypt**. |
| **RNF-02** | Escalabilidad y Concurrencia | Uso de **Connection Pooling** (Pool de conexiones) para optimizar el acceso a MySQL y soportar múltiples usuarios sin cuellos de botella. |
| **RNF-03** | Mantenibilidad | Arquitectura desacoplada en 3 capas: Controladores (Express), Servicios (Reglas y transiciones) y Modelos de Datos (SQL encapsulado). |
| **RNF-04** | Portabilidad y Despliegue | Ejecución sobre entorno Node.js v18+ y compatibilidad con servidores de bases de datos relacionales estándar MySQL 5.7+ o MariaDB. |
| **RNF-05** | Usabilidad e Interfaz (UI/UX) | Interfaz moderna (Modo Oscuro premium), totalmente responsiva, con micro-animaciones CSS y notificaciones flotantes tipo toast para feedback. |
| **RNF-06** | Robustez y Tolerancia a Fallos | Captura y manejo de excepciones mediante middlewares específicos de Express para evitar caídas del servicio y mostrar pantallas amigables de error (404/500). |
| **RNF-07** | Interoperabilidad | Exposición de endpoints REST API autenticados para permitir consultas de tickets en formato JSON desde sistemas externos. |
