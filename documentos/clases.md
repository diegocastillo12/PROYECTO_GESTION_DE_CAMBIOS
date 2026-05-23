# Diagrama de Clases UML - GestioCambios

El diagrama de clases modela la estructura lógica del backend, definiendo los métodos, atributos y relaciones de los componentes de configuración, controladores, servicios y modelos de datos (patrón 3 capas).

---

## 🎨 1. Diagrama en PlantUML

```plantuml
@startuml
skinparam classAttributeIconSize 0
skinparam backgroundColor #FFFFFF
skinparam ranksep 60
skinparam nodesep 50

skinparam class {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    ArrowColor #475569
}

package "Configuración" {
    class "db" as DB_Helper << (M,#85C1E9) Module >> {
        + pool : Pool
        + query(sql: String, params: Array) : Promise<Array>
        + testConnection() : Promise<Boolean>
    }

    class "constants" as Constants << (M,#85C1E9) Module >> {
        + ROLES : Object
        + ESTADOS : Array<String>
        + TIPOS_CAMBIO : Array<String>
        + IMPACTOS : Array<String>
        + ESTADO_META : Object
        + FLUJO_ESTADOS : Array<String>
    }
}

package "Modelos (Data Access Layer)" {
    class "UserModel" as UserModel << (C,#2ECC71) Class >> {
        + findByCorreo(correo: String) : Promise<Object>
        + findById(id: Number) : Promise<Object>
        + findAll() : Promise<Array>
        + findActiveByRoles(rolesList: Array<String>) : Promise<Array>
        + updatePasswordHash(id: Number, hash: String) : Promise<Boolean>
    }

    class "TicketModel" as TicketModel << (C,#2ECC71) Class >> {
        + findAll(filtros: Object) : Promise<Array>
        + findById(ticketId: String) : Promise<Object>
        + countAll() : Promise<Number>
        + create(ticketData: Object) : Promise<Object>
        + updateEstado(idSc: Number, nuevoEstado: String) : Promise<Object>
        + updatePersonal(idSc: Number, idDev: Number, idTester: Number) : Promise<Object>
        + getHistorial(idSc: Number) : Promise<Array>
        + addHistorial(histData: Object) : Promise<Object>
        + getEcsAfectados(idSc: Number) : Promise<Array<String>>
        + getEvidenciaGit(idSc: Number) : Promise<Object>
        + saveEvidenciaGit(gitData: Object) : Promise<Object>
        + getControlCalidad(idSc: Number) : Promise<Object>
        + saveControlCalidad(qaData: Object) : Promise<Object>
    }
}

package "Servicios (Lógica de Negocio)" {
    class "WorkflowService" as WorkflowService << (C,#F1C40F) Class >> {
        - TRANSICIONES : Object
        + isValidTransition(actual: String, nuevo: String, rol: String) : Boolean
        + getTransicionesDisponibles(actual: String, rol: String) : Array<String>
        + filtrarPorRol(tickets: Array, user: Object) : Array
        + filtrarBandeja(tickets: Array, user: Object) : Array
        + calcularStats(tickets: Array) : Object
    }
}

package "Controladores (MVC)" {
    class "authController" as AuthController << (M,#E74C3C) Module >> {
        + showLogin(req, res)
        + login(req, res)
        + logout(req, res)
        + requireAuth(req, res, next)
        + requireRole(rolesPermitidos...) : Function
    }

    class "changeController" as ChangeController << (M,#E74C3C) Module >> {
        + dashboard(req, res)
        + listarTickets(req, res)
        + mostrarTicket(req, res)
        + mostrarNuevoTicket(req, res)
        + crearTicket(req, res)
        + cambiarEstado(req, res)
        + apiListar(req, res)
        + apiDetalle(req, res)
    }
}

' Relaciones de dependencia e interacción
UserModel ..> DB_Helper : usa query()
TicketModel ..> DB_Helper : usa query()

WorkflowService ..> Constants : lee ROLES y ESTADOS

AuthController ..> UserModel : consulta usuarios
AuthController ..> Constants : lee ROLES

ChangeController ..> TicketModel : gestiona datos
ChangeController ..> UserModel : consulta personal técnico
ChangeController ..> WorkflowService : delega reglas de flujo
ChangeController ..> Constants : lee ROLES y estados de UI

@enduml
```

---

## 📝 2. Descripción de Componentes Claves

* **Capa de Configuración:** 
  * `db.js` maneja la infraestructura técnica de base de datos exponiendo la conexión mediante promesas.
  * `constants.js` declara las constantes y variables paramétricas globales (evitando la duplicidad y el acoplamiento rígido).
* **Capa de Modelos (DAL):** Clases singleton encargadas únicamente de la consulta y mapeo físico relacional con la base de datos de usuarios y tickets de cambio.
* **Capa de Servicios:** `WorkflowService` actúa como el motor de reglas y la máquina de estados. Evalúa si las acciones enviadas por la UI son correctas según las transiciones lógicas del negocio SCM.
* **Capa de Controladores:** Clases encargadas de interactuar con Express.js, extrayendo parámetros de peticiones web y mapeando las respuestas mediante renderizado HTML (EJS) o API REST (JSON).
