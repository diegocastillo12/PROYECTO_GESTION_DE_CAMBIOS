# Diagramas de Secuencia - GestioCambios

Los diagramas de secuencia ilustran la interacción de los componentes del sistema a lo largo del tiempo para ejecutar los tres casos de uso más críticos y representativos de la arquitectura.

---

## 🔐 1. Iniciar Sesión con Hasheo Seguro (Bcrypt)

### Diagrama en PlantUML

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10
skinparam ResponseMessageAlign center

actor "Usuario" as User
participant "Vista Login\n(login.ejs)" as UI
control "authController" as Ctrl
participant "UserModel" as Model
database "MySQL" as DB
participant "BcryptJS" as Crypt

User -> UI : Ingresa correo y contraseña
UI -> Ctrl : POST /login\n(correo, password)
activate Ctrl

Ctrl -> Model : findByCorreo(correo)
activate Model
Model -> DB : SELECT * FROM usuarios ...
activate DB
DB --> Model : Retorna registro de usuario
deactivate DB
Model --> Ctrl : Retorna objeto usuario (u)
deactivate Model

Ctrl -> Ctrl : Evalúa si password_hash\nes formato Bcrypt ($2a$ o $2b$)

alt Caso A: Contraseña ya está hasheada
    Ctrl -> Crypt : compare(password, u.password_hash)
    activate Crypt
    Crypt --> Ctrl : Retorna true / false
    deactivate Crypt
else Caso B: Contraseña en texto plano (Migración Semilla)
    Ctrl -> Ctrl : Compara password === u.password_hash
    opt Si las contraseñas coinciden
        Ctrl -> Crypt : genSalt(10) + hash(password)
        activate Crypt
        Crypt --> Ctrl : Retorna nuevo_hash
        deactivate Crypt
        Ctrl -> Model : updatePasswordHash(u.id, nuevo_hash)
        activate Model
        Model -> DB : UPDATE usuarios SET password_hash = ...
        activate DB
        DB --> Model : Confirmación de actualización
        deactivate DB
        Model --> Ctrl : Retorna éxito
        deactivate Model
    end
end

alt Si la contraseña fue válida (Caso A o B)
    Ctrl -> Ctrl : Establece req.session.user
    Ctrl --> UI : Redirección HTTP 302 a /dashboard
else Credenciales inválidas
    Ctrl --> UI : Renderiza login.ejs con mensaje de error
end
deactivate Ctrl
@enduml
```

### Descripción del Flujo
1. El usuario envía sus credenciales al servidor Express.
2. El controlador `authController` consulta los datos de registro mediante el método `findByCorreo` de `UserModel`.
3. Si el hash guardado posee el prefijo de Bcrypt, se delega la comparación al componente `bcryptjs`.
4. Si la clave se encuentra en texto plano (datos semilla), se evalúa la coincidencia directa. De ser exitosa, se genera el hash correspondiente en tiempo real y se actualiza en la base de datos de manera transparente (*lazy migration*), estableciendo la sesión del usuario.

---

## 📋 2. Registrar Solicitud de Cambio (Ticket)

### Diagrama en PlantUML

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10

actor "Solicitante / Gestor" as Actor
participant "Vista Nuevo Ticket\n(nuevo-ticket.ejs)" as UI
control "changeController" as Ctrl
participant "TicketModel" as Model
database "MySQL" as DB

Actor -> UI : Completa datos y presiona "Crear"
UI -> Ctrl : POST /tickets/nuevo\n(titulo, descripcion, tipo, prioridad, horas)
activate Ctrl

Ctrl -> Model : countAll()
activate Model
Model -> DB : SELECT COUNT(*) AS cnt FROM solicitudes_cambio
activate DB
DB --> Model : Retorna cantidad de tickets
deactivate DB
Model --> Ctrl : Retorna conteo (count)
deactivate Model

Ctrl -> Ctrl : Genera ticket_id correlativo\nTK-SC + (count + 1) -> (ej. "TK-SC007")

Ctrl -> Model : create(ticketData)
activate Model
Model -> DB : INSERT INTO solicitudes_cambio\n(ticket_id, titulo, estado_actual = 'Solicitado', ...)
activate DB
DB --> Model : Confirmación de registro (insertId)
deactivate DB
Model --> Ctrl : Retorna éxito
deactivate Model

Ctrl -> Model : findById(ticket_id)
activate Model
Model -> DB : SELECT * FROM solicitudes_cambio WHERE ticket_id = ?
activate DB
DB --> Model : Retorna registro creado (newTicket)
deactivate DB
Model --> Ctrl : Retorna objeto (newTicket)
deactivate Model

Ctrl -> Model : addHistorial(histData)
activate Model
Model -> DB : INSERT INTO historial_estados\n(id_sc, estado_anterior = NULL, estado_nuevo = 'Solicitado', ...)
activate DB
DB --> Model : Confirmación de registro
deactivate DB
Model --> Ctrl : Retorna éxito
deactivate Model

Ctrl --> UI : Redirección HTTP 302 a /tickets/TK-SCXXX
deactivate Ctrl
@enduml
```

### Descripción del Flujo
1. El solicitante registra los parámetros del cambio.
2. `changeController` solicita al `TicketModel` el conteo de elementos registrados para calcular el correlativo único de ticket (ej. `TK-SC004`).
3. Se inserta la solicitud de cambio en la base de datos a través de `TicketModel.create()`.
4. Tras recuperar el identificador autonumérico asignado en BD (`id_sc`), el controlador inserta una entrada en la tabla historial con estado inicial `"Solicitado"`, culminando con el redireccionamiento a la interfaz del ticket.

---

## 🔄 3. Transición de Estado y Asignación de Recursos

### Diagrama en PlantUML

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10

actor "Líder Técnico / Gestor" as Actor
participant "Detalle Ticket\n(ticket-detail.ejs)" as UI
control "changeController" as Ctrl
control "WorkflowService" as Service
participant "TicketModel" as Model
database "MySQL" as DB

Actor -> UI : Selecciona nuevo estado (ej. "En Desarrollo"),\nasigna Desarrollador y confirma transición
UI -> Ctrl : PUT /api/tickets/:id/estado (payload JSON)
activate Ctrl

Ctrl -> Model : findById(id)
activate Model
Model -> DB : SELECT * FROM solicitudes_cambio WHERE ticket_id = ?
activate DB
DB --> Model : Retorna datos del ticket
deactivate DB
Model --> Ctrl : Retorna objeto (ticket)
deactivate Model

Ctrl -> Service : isValidTransition(ticket.estado, nuevoEstado, user.rol)
activate Service
Service --> Ctrl : Retorna true (Transición válida)
deactivate Service

Ctrl -> Model : updateEstado(ticket.id_sc, nuevoEstado)
activate Model
Model -> DB : UPDATE solicitudes_cambio SET estado_actual = ? WHERE id_sc = ?
activate DB
DB --> Model : Confirmación de actualización
deactivate DB
Model --> Ctrl : Retorna éxito
deactivate Model

Ctrl -> Model : addHistorial(histData)
activate Model
Model -> DB : INSERT INTO historial_estados (estado_anterior, estado_nuevo, ...)
activate DB
DB --> Model : Confirmación de registro
deactivate DB
Model --> Ctrl : Retorna éxito
deactivate Model

opt Si el payload contiene asignadoId (Asignación de Personal)
    Ctrl -> Model : updatePersonal(ticket.id_sc, asignadoId, NULL)
    activate Model
    Model -> DB : UPDATE solicitudes_cambio SET id_desarrollador = ? ...
    activate DB
    DB --> Model : Confirmación
    deactivate DB
    Model --> Ctrl : Retorna éxito
    deactivate Model
end

opt Si el payload contiene datos Git (Ramas / Pull Requests)
    Ctrl -> Model : saveEvidenciaGit(gitData)
    activate Model
    Model -> DB : INSERT INTO evidencias_git ... ON DUPLICATE KEY UPDATE
    activate DB
    DB --> Model : Confirmación
    deactivate DB
    Model --> Ctrl : Retorna éxito
    deactivate Model
end

Ctrl --> UI : Responde JSON { success: true, nuevoEstado, ticketId }
deactivate Ctrl

UI -> UI : Muestra notificación Toast ("Estado actualizado ✓")\ny recarga la página
@enduml
```

### Descripción del Flujo
1. La interfaz envía una petición asíncrona mediante AJAX al endpoint de estado conteniendo todos los datos del formulario (comentarios, asignados, ramas Git, resultados de pruebas).
2. El controlador valida el estado actual del ticket y consulta las reglas en `WorkflowService` para corroborar que la transición es válida para el rol del usuario autenticado.
3. Si es válida, se actualiza el estado y se registra la transición en la tabla de historial de auditoría.
4. Opcionalmente, se procesa de forma atómica la inserción o actualización de la asignación del desarrollador técnico, rama de Git e información de control de calidad, respondiendo con éxito en formato JSON.
