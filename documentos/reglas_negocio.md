# Reglas de Negocio - GestioCambios

Este documento detalla las reglas de negocio (RN) que gobiernan las politicas, restricciones y el comportamiento operacional del sistema GestioCambios, estructuradas de acuerdo con la tabla especificada.

---

## Tabla 3: Cuadro de Reglas de Negocio. Fuente de origen: Propia

| ID | Nombre de la regla de negocio | Descripcion | Autoridad | Use Case | Proceso Actual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RN-01 | Transicion de Estados Restringida por Rol | Un ticket de cambio solo puede transicionar a ciertos estados destino especificos segun el rol del usuario autenticado en el proyecto. | Gestor de Configuracion / Director | UC_Estado (Cambiar Estado del Ticket) | No existia validacion de estados; cualquier persona informaba cualquier estado por correo o chat de forma informal. |
| RN-02 | Aprobacion Obligatoria antes del Desarrollo | Ninguna solicitud de cambio puede ser asignada ni pasar al estado de desarrollo si no cuenta previamente con la aprobacion formal del Director o del CCB. | Director / Comite de Control (CCB) | UC_Decidir (Aprobar o Rechazar Solicitud) | Los desarrolladores modificaban el codigo inmediatamente al recibir una peticion del cliente, sin esperar la autorizacion formal. |
| RN-03 | Asignacion Obligatoria de Personal Tecnico | Para iniciar la etapa de desarrollo de un ticket, este debe tener asignado obligatoriamente un Desarrollador Asignado y un Equipo QA / Tester. | Gestor de Configuracion | UC_AsignarTicket (Asignar Desarrollador y Tester) | Las tareas se asignaban de forma verbal, a menudo sin asignar formalmente un tester para validar el cambio. |
| RN-04 | Registro de Evidencias Git Obligatorio | Para enviar un ticket de la fase de desarrollo a la fase de pruebas QA, el desarrollador debe registrar el nombre de la rama Git y la URL del Pull/Merge Request. | Gestor de Configuracion | UC_Git (Registrar Evidencias Git) | No se asociaba la rama de codigo al requerimiento, realizando integraciones sin verificar el origen del cambio. |
| RN-05 | Aprobacion de Pruebas QA y Conformidad UAT | Un ticket solo puede ser integrado a la rama principal (main) y liberado si cuenta con las pruebas QA aprobadas por el Tester y la aceptacion del Solicitante. | Equipo QA / Tester y Solicitante | UC_QA (Registrar Pruebas QA) y UC_UAT (Validar en UAT) | El codigo se subia directamente a produccion sin ejecutar pruebas formales y sin contar con la conformidad escrita del cliente. |
| RN-06 | Inmutabilidad de Metodologia en Ejecucion | No se permite cambiar la metodologia de trabajo (RUP/Scrum) de un proyecto si el cronograma ya cuenta con actividades registradas. | Administrador | UC_MngProy (Gestionar Proyectos) | Se alteraba la estructura y fases del proyecto a mitad del ciclo en archivos Excel, perdiendo la consistencia del avance. |
| RN-07 | Rol Efectivo por Proyecto | Los privilegios y permisos de transicion de un usuario sobre un ticket se evaluan segun el rol especifico asignado al usuario dentro de ese proyecto. | Administrador | UC_MngTeam (Configurar Equipo y Clientes) | No habia delimitacion formal de roles por proyecto, asumiendo que los tecnicos podian actuar en cualquier fase de forma libre. |
