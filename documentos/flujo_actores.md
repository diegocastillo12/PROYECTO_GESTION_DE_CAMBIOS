# Diagrama de Flujo de Actores - GestioCambios

Este diagrama muestra la sucesion completa de actores y sus responsabilidades en el ciclo de vida de una Solicitud de Cambio (Ticket SCM), desde la preparacion del proyecto hasta la liberacion final.

---

## Diagrama en PlantUML

```plantuml
@startuml GestioCambios_Flujo_Actores

' CONFIGURACION VISUAL SIN COLORES PERSONALIZADOS
skinparam defaultFontName Arial
skinparam defaultFontSize 12

' CARRILES POR ACTOR (Swimlanes)

|Administrador|
start
:Inicio del Sistema:
Crea el Proyecto en la plataforma
con nombre, descripcion y fechas;
note right
  Ruta: /admin/proyectos/nuevo
  Solo el Administrador puede
  crear y configurar proyectos.
end note

:Asigna la Metodologia SCM
al proyecto;
note right
  La metodologia define el arbol de
  entregables (Etapas > Fases > ECM)
  que regiran el cronograma.
end note

:Registra el Equipo del Proyecto
asignando un rol especifico
a cada integrante;
note right
  Roles disponibles:
  Lider Tecnico, Desarrollador Asignado,
  Equipo QA / Tester, Gestor de Configuracion,
  Director, CCB (Comite de Control).
end note

:Registra los Clientes y Solicitantes
asignados al proyecto;

:Construye el Cronograma
Crea actividades por fase metodologica
con fechas, responsable y porcentaje inicial;
note right
  Ruta: /admin/proyectos/:id/config
  El Administrador define las actividades
  para cada fase y las asigna a los miembros del equipo.
  Cada actividad puede vincularse a un entregable (ECM).
end note

|Solicitante|
:Crea una Solicitud de Cambio
Rellena: titulo, descripcion,
justificacion tecnica, tipo e impacto;
note right
  El ticket nace en estado:
  [Solicitado]
  ID correlativo: TK-SC001, TK-SC002...
end note

|Director|
:Recibe el ticket en su bandeja
Evalua la viabilidad e importancia;

:Mueve el ticket a
[En Analisis];
note right
  Solo el Director, Lider Tecnico o
  Gestor pueden iniciar el analisis.
end note

|Lider Tecnico|
:Realiza el Analisis de Impacto
Estima las horas hombre necesarias,
define nivel de impacto y version del cambio,
y vincula los ECMs afectados;

:Mueve el ticket a
[Pendiente de Aprobacion];

|Director|
if (¿Quien evalua la aprobacion?) then (Director)
  :Revisa el analisis de impacto;
  if (¿Aprueba el cambio?) then (si)
    :Mueve el ticket a
    [Aprobado];
  else (no)
    :Mueve el ticket a
    [Rechazado] o [Descartado];
    stop
  endif
else (Comite de Control - CCB)
  |Comite de Control (CCB)|
  :Revisa el analisis de impacto;
  if (¿Aprueba el cambio?) then (si)
    :Mueve el ticket a
    [Aprobado];
  else (no)
    :Mueve el ticket a
    [Rechazado];
    stop
  endif
endif

|Gestor de Configuracion|
:Asigna recursos humanos
Selecciona el Desarrollador Asignado
y el Equipo QA / Tester responsable;

:Mueve el ticket a
[En Desarrollo];

|Desarrollador Asignado|
:Implementa el cambio
Trabaja en una rama Git dedicada,
registra rama, Pull/Merge Request
y comentarios de la solucion;

:Reporta avance en el cronograma
Actualiza el porcentaje de avance de la actividad;

:Mueve el ticket a
[En Pruebas QA];

|Equipo QA / Tester|
:Ejecuta el Plan de Pruebas
Registra total de pruebas, pruebas fallidas
y adjunta observaciones tecnicas;

if (¿Pruebas QA superadas?) then (si)
  :Mueve el ticket a
  [En Pruebas UAT];

  |Solicitante|
  :Valida el resultado final
  Verifica que el cambio cumpla
  con lo solicitado;

  if (¿Acepta el resultado?) then (si)
    |Equipo QA / Tester|
    :Mueve el ticket a
    [Listo para Integracion];

    |Gestor de Configuracion|
    :Integra el cambio al repositorio
    Fusiona la rama Git a main/master,
    despliega y registra el tag de version;

    :Mueve el ticket a
    [Liberado];
    stop

  else (no)
    |Equipo QA / Tester|
    :Mueve el ticket a
    [En Desarrollo] para corregir;
  endif

else (no)
  :Mueve el ticket a
  [En Desarrollo] para corregir fallas;
endif

@enduml
```

---

## Descripcion de los Actores

| Actor | Rol en Sistema | Acciones en el Flujo |
| :--- | :--- | :--- |
| Administrador | Administrador (Global) | Registra el proyecto, equipo, metodologia, construye el cronograma inicial y monitorea notificaciones de la plataforma. |
| Solicitante | Solicitante (Proyecto) | Crea la solicitud de cambio al inicio del flujo y valida el resultado final en pruebas de aceptacion de usuario (UAT). |
| Director | Director (Proyecto) | Evalua viabilidad (de Solicitado a En Analisis), y aprueba, rechaza o descarta el ticket (de Pendiente de Aprobacion a Aprobado/Rechazado/Descartado). |
| Lider Tecnico | Lider Tecnico (Proyecto) | Realiza el analisis de impacto tecnico (estimacion de horas, impacto, version y ECMs), y puede mover de En Desarrollo a En Pruebas QA, y de QA/UAT a Listo para Integracion. |
| Comite de Control (CCB) | CCB (Proyecto) | Evalua de manera colegiada las solicitudes de cambio en la fase de aprobacion formal (de Pendiente de Aprobacion a Aprobado/Rechazado). |
| Gestor de Configuracion | Gestor de Configuracion (Proyecto) | Asigna desarrollador y tester al ticket aprobado, abre la fase de desarrollo, y realiza la integracion, despliegue y liberacion final del cambio. |
| Desarrollador Asignado | Desarrollador (Proyecto) | Desarrolla la solucion, registra la rama Git y Pull/Merge Request, actualiza el avance de la actividad y envia a pruebas. |
| Equipo QA / Tester | Tester (Proyecto) | Disena y ejecuta pruebas de control de calidad, aprueba o rechaza el control de calidad interno, y gestiona el paso del ticket a UAT o su retorno a desarrollo en caso de fallos. |

---

## Estados del Ticket y Transiciones

```
[Solicitado]
    |-- En Analisis                      (Director / Lider Tecnico / Gestor)
            |-- Pendiente de Aprobacion  (Lider Tecnico / Gestor)
                    |-- Rechazado        (Director / CCB)
                    |-- Descartado       (Director)
                    |-- Aprobado         (Director / CCB)
                              |-- En Desarrollo       (Gestor / Desarrollador)
                                        |-- En Pruebas QA     (Desarrollador / Lider Tecnico)
                                                  |-- En Pruebas UAT  (Tester / Lider Tecnico)
                                                  |-- Listo para Integracion (Tester / Lider Tecnico)
                                                            |-- Liberado  (Gestor)
```

Cada transicion queda registrada en el historial de estados de la base de datos, indicando el usuario responsable, fecha/hora, estado previo, estado posterior y el comentario justificativo correspondiente.
