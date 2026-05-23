# Diagrama de Componentes - GestioCambios

El diagrama de componentes detalla la organización lógica de los módulos de software en tiempo de ejecución, sus interfaces de comunicación y la distribución de tareas entre el frontend, el backend y la persistencia de datos.

---

## 🎨 1. Diagrama en PlantUML

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam ranksep 60
skinparam nodesep 45

skinparam component {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #1E293B
}

skinparam interface {
    BackgroundColor #F1C40F
    BorderColor #D68910
}

' 1. CLIENT LAYER (Navegador)
package "Navegador Cliente [Capa de Presentación]" {
    component [UI Engine (HTML/CSS)] as UI
    component [AJAX Client (sidebar.js)] as ClientJS
}

' 2. WEB SERVICES LAYER (Express API / Routing)
package "Servidor de Aplicaciones Express [Node.js Server]" {
    
    interface "HTTP/HTTPS (Port 3000)" as HTTP_Int
    interface "REST API JSON" as REST_Int
    
    component [Enrutador Web (webRoutes)] as RouterWeb
    component [Enrutador API (apiRoutes)] as RouterAPI
    
    component [Auth Controller] as AuthCtrl
    component [Change Controller] as ChangeCtrl
    
    component [Workflow Service] as Service
    
    component [User Model] as UserModel
    component [TicketModel] as TicketModel
}

' 3. DATABASE LAYER (MySQL)
package "Servidor de Datos [MySQL]" {
    interface "Conexiones Pool (Port 3306)" as DB_Int
    component [MySQL Database Engine] as MySQL
}

' 4. EXTERNAL LAYER (Git Platform)
component [Git SaaS (GitHub / GitLab)] as GitSvc

' --- RELACIONES Y FLUJOS ---

UI --> HTTP_Int : "Carga HTML/CSS"
ClientJS --> REST_Int : "Envía payloads JSON"

HTTP_Int -- RouterWeb
REST_Int -- RouterAPI

RouterWeb --> AuthCtrl : "Despacha solicitudes"
RouterWeb --> ChangeCtrl : "Despacha solicitudes"
RouterAPI --> ChangeCtrl : "Despacha solicitudes API"

ChangeCtrl --> Service : "Valida reglas de flujo"
ChangeCtrl --> UserModel : "Pide personal activo"
ChangeCtrl --> TicketModel : "Operaciones de tickets"
AuthCtrl --> UserModel : "Valida login"

UserModel --> DB_Int : "Petición SQL"
TicketModel --> DB_Int : "Petición SQL"
DB_Int -- MySQL

ClientJS ..> GitSvc : "Referencia URLs de Merge Requests"

@enduml
```

---

## 📝 2. Especificación de Componentes e Interfaces

### Capa de Cliente (Presentación)
* **UI Engine (HTML5/CSS3):** Encargado de pintar el maquetado dinámico y responder al escalado visual.
* **AJAX Client (`sidebar.js`):** Gestiona la lógica asíncrona del lado del cliente. Escucha eventos, recolecta inputs (como asignados, ramas de Git, evidencias de QA) y realiza peticiones `PUT/POST` en formato JSON para actualizar los tickets sin parpadeos de recarga.

### Capa de Servidor (Negocio y Control)
* **Interfaces HTTP y REST:** Puntos de entrada lógicos expuestos en el puerto `3000`.
* **Enrutadores (`webRoutes` y `apiRoutes`):** Analizan las URLs entrantes y derivan la ejecución al controlador correspondiente.
* **Controladores (`authController` y `changeController`):** Procesan la información de sesión y coordinan las llamadas lógicas.
* **Workflow Service:** Componente lógico que implementa el autómata de estados de cambio de SCM, controlando qué transiciones están permitidas por rol.
* **Capa de Modelos (User y Ticket):** Módulos que encapsulan las sentencias SQL y abstraen las consultas de BD en objetos de negocio legibles.

### Capa de Datos y Servicios Externos
* **MySQL Database Engine (Puerto 3306):** Servidor relacional encargado del resguardo de las tablas físicas del sistema.
* **Git SaaS (GitHub/GitLab):** Servicio externo de administración de código referenciado mediante enlaces HTTP desde el cliente.
