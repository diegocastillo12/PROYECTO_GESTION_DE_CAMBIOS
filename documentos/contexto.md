# Diagrama de Contexto - GestioCambios

El diagrama de contexto (Modelo C4 - Nivel 1) provee una vista panorámica de alto nivel que delimita las fronteras del sistema, mostrando las entidades externas (usuarios y sistemas) que se comunican con él.

---

## 🎨 1. Diagrama en PlantUML

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam ranksep 50
skinparam nodesep 50
skinparam actorStyle awesome

skinparam rectangle {
    BackgroundColor #1B4F72
    BorderColor #154360
    FontColor #FFFFFF
    FontSize 14
}

skinparam usecase {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    FontColor #334155
}

skinparam actor {
    BackgroundColor #F1F5F9
    BorderColor #475569
}

' 1. SISTEMA CENTRAL
rectangle "Sistema GestioCambios\n[Sistema SCM]" as System #1B4F72

' 2. ACTORES EXTERNOS
package "Usuarios del Sistema" {
    actor "Solicitante" as Sol
    actor "Equipo de Desarrollo\n[Líder, Dev, Tester]" as DevTeam
    actor "Gestión y Aprobadores\n[Gestor, Director, CCB]" as AdminTeam
}

' 3. SISTEMAS EXTERNOS
database "Base de Datos MySQL\n[Persistencia]" as DB #D5F5E3
rectangle "Servidor Git Externo\n[GitHub / GitLab]" as Git #EBF5FB

' 4. RELACIONES DE FLUJO DE INFORMACIÓN
Sol --> System : "1. Crea Solicitud de Cambio\ny consulta estado"
DevTeam --> System : "3. Registra desarrollo,\nramas Git y pruebas QA"
AdminTeam --> System : "2. Evalúa, asigna personal,\naprueba y libera cambios"

System <--> DB : "Almacena y consulta\ntickets, usuarios y auditoría"
System <-- Git : "Valida referencias de\nramas y Pull Requests"

@enduml
```

---

## 📝 2. Descripción de Interfaces Externas

* **Límite del Sistema (GestioCambios):** El aplicativo web Node.js responsable de coordinar el control de cambios de software.
* **Solicitante (Actor):** Ingresa requerimientos al sistema y monitorea el estado actual.
* **Equipo de Desarrollo (Actor):** Interviene actualizando ramas, asignaciones y registrando resultados de control de calidad técnico.
* **Gestión y Aprobación (Actor):** Director, Gestor SCM o miembros de CCB que evalúan el impacto y deciden el avance del ciclo de vida.
* **Base de Datos MySQL (Sistema Externo):** Persistencia relacional local encargada de resguardar el estado y las credenciales seguras.
* **Servidor Git Externo (GitHub/GitLab):** Infraestructura externa de versionamiento de código. El sistema asocia y enlaza referencias lógicas (ramas y solicitudes de integración) para asegurar la trazabilidad SCM.
