# Diagrama de Casos de Uso - GestioCambios

El diagrama de Casos de Uso define los límites del sistema y detalla las interacciones entre los usuarios (actores) y las funcionalidades que provee el aplicativo de gestión de configuración.

---

## 🎨 1. Diagrama en PlantUML

```plantuml
@startuml
skinparam ranksep 80
skinparam nodesep 50
left to right direction
skinparam packageStyle rectangle
skinparam backgroundColor #FFFFFF
skinparam actorStyle awesome

skinparam usecase {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    ArrowColor #475569
    ActorBorderColor #475569
    FontSize 12
}

skinparam actor {
    BackgroundColor #F1F5F9
    BorderColor #475569
}

' 1. DEFINICIÓN DE ACTORES
actor "Usuario General" as User

actor "Solicitante" as Sol
actor "Director" as Dir
actor "Comité de Control (CCB)" as CCB
actor "Gestor de Configuración" as Gest
actor "Líder Técnico" as LT
actor "Desarrollador Asignado" as Dev
actor "Equipo QA / Tester" as Test

' 2. JERARQUÍA DE ACTORES (Herencia)
User <|-- Sol
User <|-- Dir
User <|-- CCB
User <|-- Gest
User <|-- LT
User <|-- Dev
User <|-- Test

' 3. LÍMITE DEL SISTEMA
rectangle "Sistema de Gestión de Cambios (GestioCambios)" {
    usecase "Iniciar Sesión" as UC_Login
    usecase "Visualizar Dashboard y Tareas" as UC_Dash
    usecase "Consultar / Filtrar Tickets" as UC_Listar
    usecase "Visualizar Detalle de Ticket" as UC_Detalle

    usecase "Registrar Solicitud de Cambio" as UC_Crear
    usecase "Asignar Desarrollador y Tester" as UC_Asignar
    usecase "Registrar Evidencias Git\n(Rama y Pull Request)" as UC_Git
    usecase "Registrar Pruebas QA / UAT\n(Resultados y Evidencia)" as UC_QA
    usecase "Cambiar Estado del Ticket\n(Transiciones del Flujo)" as UC_Estado
}

' 4. CONEXIONES DEL ACTOR BASE
User --> UC_Login
User --> UC_Dash
User --> UC_Listar
User --> UC_Detalle

' 5. CONEXIONES DE LOS ACTORES ESPECIALIZADOS
Sol --> UC_Crear
Dir --> UC_Crear
Gest --> UC_Crear

Gest --> UC_Asignar
LT --> UC_Asignar

Dev --> UC_Git
Test --> UC_QA

UC_Estado <-- Dir
UC_Estado <-- CCB
UC_Estado <-- Gest
UC_Estado <-- LT
UC_Estado <-- Dev
UC_Estado <-- Test

UC_Git ..> UC_Estado : <<include>>
UC_QA ..> UC_Estado : <<include>>
UC_Asignar ..> UC_Estado : <<extend>>

@enduml
```

---

## 📝 2. Descripción de Actores y Casos de Uso

### Actores del Sistema
* **Usuario General (Base):** Actor abstracto que unifica los permisos comunes a todos los usuarios del sistema.
* **Solicitante:** Usuario (ej. Docente Evaluador) que registra la necesidad de cambio en el software.
* **Director:** Responsable de autorizar inicialmente los cambios e integraciones.
* **Gestor de Configuración (SCM):** Administrador del repositorio y estados, encargado de asignar recursos e integrar los cambios liberados.
* **Líder Técnico:** Analista técnico responsable de la viabilidad, estimación y asignación del personal de desarrollo/QA.
* **Comité de Control (CCB):** Entidad colegiada que aprueba o rechaza cambios con impacto mayor en el proyecto.
* **Desarrollador Asignado:** Constructor técnico que modifica los elementos de configuración de software (ECS).
* **Equipo QA / Tester:** Equipo de aseguramiento de calidad encargado de realizar las pruebas unitarias, funcionales (QA) y de aceptación (UAT).

### Casos de Uso Clave
* **Registrar Solicitud de Cambio:** Creación del ticket ingresando justificación e impacto.
* **Asignar Desarrollador y Tester:** Delegación de tareas técnicas a usuarios específicos.
* **Registrar Evidencias Git:** Inyección de la rama de desarrollo y URL del Pull Request, permitiendo la trazabilidad del código.
* **Registrar Pruebas QA / UAT:** Inserción de resultados de pruebas para dar viabilidad a la liberación de código.
* **Cambiar Estado del Ticket:** Operación de flujo SCM regulada por el motor de estados según el perfil.
