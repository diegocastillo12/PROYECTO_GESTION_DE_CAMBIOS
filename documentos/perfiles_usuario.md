# Perfiles de Usuario - GestioCambios

Este documento define los perfiles de usuario y roles operacionales del sistema GestioCambios, detallando sus responsabilidades, ambitos de accion y permisos clave dentro de la plataforma.

---

## Tabla de Perfiles de Usuario

| ID | Perfil | Descripcion | Ambito | Acciones y Permisos Clave |
| :--- | :--- | :--- | :--- | :--- |
| PER-01 | Administrador | Responsable global de la administracion y configuracion del sistema. | Global | Gestion de usuarios globales (CRUD), creacion y edicion de proyectos, diseno y mantenimiento de metodologias (Etapas, Fases, ECMs) y construccion del cronograma de actividades inicial del proyecto. |
| PER-02 | Solicitante | Cliente o usuario que interactua con el software para solicitar correcciones o nuevas caracteristicas. | Proyecto | Registro de nuevas solicitudes de cambio (Tickets), visualizacion del avance de sus solicitudes y ejecucion de la prueba de aceptacion de usuario (UAT) para dar conformidad final. |
| PER-03 | Director | Responsable de la gestion estrategica de los proyectos y aprobacion de solicitudes. | Proyecto | Evaluacion inicial de solicitudes (cambio a En Analisis), aprobacion formal, rechazo o descarte de tickets pendientes de aprobacion, y visualizacion de informes de avance y rankings. |
| PER-04 | Lider Tecnico | Ingeniero o analista responsable del analisis de viabilidad tecnica de los cambios. | Proyecto | Registro del analisis de impacto de las solicitudes (estimacion de horas, impacto, version y ECMs), promocion del ticket a Pendiente de Aprobacion y monitoreo de las actividades del cronograma. |
| PER-05 | Comite de Control (CCB) | Organo colegiado que participa en la toma de decisiones para cambios de impacto mayor. | Proyecto | Evaluacion de viabilidad en conjunto con el Director y ejecucion de la transicion de aprobacion o rechazo formal en la bandeja de tickets pendientes. |
| PER-06 | Gestor de Configuracion | Operador responsable de la integridad de los elementos de configuracion y el control de versiones. | Proyecto | Asignacion de Desarrolladores y Testers a los tickets aprobados, apertura del estado En Desarrollo, y ejecucion de la integracion (Merge de ramas Git) y liberacion final (cambio a Liberado). |
| PER-07 | Desarrollador Asignado | Programador encargado de construir o modificar el codigo fuente y los entregables correspondientes. | Proyecto | Modificacion del codigo fuente local, registro de evidencias en el ticket (nombre de la rama Git y URL de Pull/Merge Request), actualizacion del porcentaje de avance en el cronograma y cambio de estado a En Pruebas QA. |
| PER-08 | Equipo QA / Tester | Especialista en aseguramiento de calidad encargado de verificar que los cambios cumplan con los criterios de aceptacion. | Proyecto | Diseno y ejecucion de pruebas, registro de resultados de pruebas (conteo de tests aprobados/fallidos y observaciones), aprobacion para pase a UAT o retorno del ticket a En Desarrollo ante deteccion de fallos. |
