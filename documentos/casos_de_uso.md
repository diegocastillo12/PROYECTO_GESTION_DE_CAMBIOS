# Diagrama de Casos de Uso - GestioCambios

El diagrama de Casos de Uso define los limites del sistema y detalla las interacciones entre los usuarios (actores) y las funcionalidades que provee el aplicativo de gestion de cambios.

---

## 1. Diagrama en PlantUML

```plantuml
@startuml GestioCambios_CasosDeUso

' CONFIGURACION VISUAL SIN COLORES PERSONALIZADOS
skinparam defaultFontName Arial
skinparam defaultFontSize 12
left to right direction

' DEFINICION DE ACTORES
actor "Usuario General" as User
actor "Administrador" as Admin
actor "Solicitante" as Sol
actor "Director" as Dir
actor "Comite de Control (CCB)" as CCB
actor "Gestor de Configuracion" as Gest
actor "Lider Tecnico" as LT
actor "Desarrollador Asignado" as Dev
actor "Equipo QA / Tester" as Test

' JERARQUIA DE ACTORES (Herencia de permisos comunes)
User <|-- Admin
User <|-- Sol
User <|-- Dir
User <|-- CCB
User <|-- Gest
User <|-- LT
User <|-- Dev
User <|-- Test

' LIMITE DEL SISTEMA
rectangle "Sistema de Gestion de Cambios (GestioCambios)" {
    ' Casos de uso comunes
    usecase "Iniciar Sesion" as UC_Login
    usecase "Visualizar Dashboard" as UC_Dash
    usecase "Consultar Tickets" as UC_Listar
    usecase "Visualizar Detalle de Ticket" as UC_Detalle

    ' Casos de uso del Administrador
    usecase "Gestionar Usuarios (CRUD)" as UC_MngUsers
    usecase "Gestionar Metodologias (CRUD)" as UC_MngMetod
    usecase "Gestionar Proyectos (CRUD)" as UC_MngProy
    usecase "Configurar Equipo y Clientes" as UC_MngTeam
    usecase "Construir Cronograma (CRUD Actividades)" as UC_MngCrono

    ' Casos de uso del flujo de cambios SCM
    usecase "Registrar Solicitud de Cambio" as UC_Crear
    usecase "Realizar Analisis de Impacto" as UC_Analisis
    usecase "Aprobar o Rechazar Solicitud" as UC_Decidir
    usecase "Asignar Desarrollador y Tester" as UC_AsignarTicket
    usecase "Registrar Evidencias Git (Rama y PR)" as UC_Git
    usecase "Registrar Pruebas QA" as UC_QA
    usecase "Validar en ambiente UAT" as UC_UAT
    usecase "Integrar y Liberar Cambio" as UC_Liberar
    usecase "Actualizar Avance de Actividad" as UC_Avance
}

' CONEXIONES DEL ACTOR BASE (Acciones comunes)
User --> UC_Login
User --> UC_Dash
User --> UC_Listar
User --> UC_Detalle

' CONEXIONES DEL ADMINISTRADOR
Admin --> UC_MngUsers
Admin --> UC_MngMetod
Admin --> UC_MngProy
Admin --> UC_MngTeam
Admin --> UC_MngCrono

' CONEXIONES DEL SOLICITANTE
Sol --> UC_Crear
Sol --> UC_UAT

' CONEXIONES DEL DIRECTOR
Dir --> UC_Decidir

' CONEXIONES DEL COMITE DE CONTROL (CCB)
CCB --> UC_Decidir

' CONEXIONES DEL LIDER TECNICO
LT --> UC_Analisis

' CONEXIONES DEL GESTOR DE CONFIGURACION
Gest --> UC_AsignarTicket
Gest --> UC_Liberar

' CONEXIONES DEL DESARROLLADOR ASIGNADO
Dev --> UC_Git
Dev --> UC_Avance

' CONEXIONES DEL EQUIPO QA / TESTER
Test --> UC_QA

@enduml
```

---

## 2. Descripcion de Actores y Casos de Uso

### Actores del Sistema
* **Usuario General:** Actor base que unifica las operaciones de visualizacion, consulta y autenticacion disponibles para todos los perfiles de la aplicacion.
* **Administrador:** Rol global encargado de la gestion inicial de usuarios, definicion de metodologias de trabajo, creacion de proyectos y diseno del cronograma base.
* **Solicitante:** Cliente o usuario que reporta una necesidad de cambio e inicia el ticket SCM. Ademas, valida el resultado en la etapa de pruebas de usuario (UAT).
* **Director:** Autoridad encargada de habilitar el analisis de la solicitud y de aprobar, rechazar o descartar el ticket.
* **Lider Tecnico:** Encargado del analisis de impacto tecnico, estimaciones de esfuerzo, versionado de software e identificacion de elementos de configuracion afectados.
* **Comite de Control (CCB):** Ente encargado de la aprobacion formal y colegiada de las solicitudes de cambio.
* **Gestor de Configuracion:** Rol operativo que asigna al desarrollador y al tester, habilita la fase de construccion, e integra y despliega las versiones finales al liberar el ticket.
* **Desarrollador Asignado:** Tecnico encargado de realizar los cambios, reportar su avance de tareas y registrar evidencias de repositorios Git.
* **Equipo QA / Tester:** Responsable del control de calidad del software mediante pruebas unitarias/funcionales y el pase del ticket a la fase UAT.

### Casos de Uso Principales
* **Gestionar Usuarios, Metodologias y Proyectos:** Operaciones de administracion global reservadas para estructurar la informacion inicial del sistema.
* **Construir Cronograma:** Creacion de actividades vinculadas a fases metodologicas y entregables.
* **Registrar Solicitud de Cambio:** Creacion de la peticion SCM ingresando descripcion, justificacion, tipo e impacto estimado.
* **Realizar Analisis de Impacto:** Estimacion tecnica de horas-hombre y version de afectacion.
* **Aprobar o Rechazar Solicitud:** Autorizacion o desestimacion del cambio por parte del Director o del CCB.
* **Asignar Desarrollador y Tester:** Delegacion de tareas operativas una vez aprobado el cambio.
* **Registrar Evidencias Git:** Vinculacion de ramas de codigo y Pull Requests.
* **Registrar Pruebas QA:** Ejecucion de controles de calidad.
* **Validar en UAT:** Aceptacion final de la modificacion por el Solicitante.
* **Integrar y Liberar Cambio:** Fusion en rama principal (main), despliegue de version y marcado como liberado.
