# Diagrama de Despliegue - GestioCambios

El diagrama de despliegue representa la arquitectura física y de red del sistema, detallando el hardware (nodos), el middleware (servidores de aplicación) y las piezas de software (artefactos) que intervienen en la ejecución.

---

## 🎨 1. Diagrama en PlantUML

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam ranksep 60
skinparam nodesep 40

skinparam node {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #1E293B
}

skinparam database {
    BackgroundColor #D5F5E3
    BorderColor #27AE60
    FontColor #1E293B
}

skinparam artifact {
    BackgroundColor #E8F8F5
    BorderColor #117A65
}

' 1. CLIENT TIER (Capa de Cliente)
node "Dispositivo de Usuario\n[PC / Laptop]" as ClientDevice {
    node "Navegador Web\n[Chrome / Firefox / Edge]" as WebBrowser {
        artifact "UI Interactiva\n(HTML5 / CSS3 / Client JS)" as ClientApp
    }
}

' 2. APPLICATION TIER (Capa de Aplicación)
node "Servidor de Aplicación\n[Servidor Local / VPS]" as AppServer {
    node "Entorno de Ejecución\n[Node.js Runtime]" as NodeJS {
        artifact "Servidor Express.js\n(GestioCambios App)" as ExpressApp
    }
}

' 3. DATABASE TIER (Capa de Datos)
node "Servidor de Base de Datos" as DBServer {
    database "MySQL / MariaDB\n[gestiocambios_db]" as DBInstance
}

' 4. ENTERPRISE TIER (Servicios de Terceros)
node "Servidor de Repositorios\n[SaaS Externo]" as GitServer {
    node "Plataforma Git\n[GitHub / GitLab]" as GitRepo
}

' CONEXIONES FISICAS / LOGICAS
ClientApp -- ExpressApp : "HTTP / HTTPS (Puerto 3000)\n[Peticiones REST / HTML]"
ExpressApp -- DBInstance : "Conexión TCP/IP (Puerto 3306)\n[Conectores mysql2 / Query Pool]"
ClientApp ..> GitRepo : "Redirección HTTPS\n[Control de Código]"

@enduml
```

---

## 📝 2. Descripción de Componentes de Infraestructura

* **Dispositivo de Usuario:** La máquina física del usuario final. Ejecuta el navegador web y procesa los estilos estáticos CSS y los scripts cliente AJAX ([sidebar.js](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/public/js/sidebar.js)) para comunicarse con el servidor.
* **Servidor de Aplicación Node.js (Puerto 3000):** El servidor Express.js procesa la lógica en backend y compila dinámicamente las plantillas del lado del servidor (EJS) para retornarlas como HTML al cliente.
* **Servidor de Base de Datos MySQL (Puerto 3306):** Instancia local o remota que almacena la persistencia de datos relacionales, comunicándose a través de sockets TCP/IP con el pool de conexiones del conector `mysql2`.
* **Servidor de Repositorios Git (GitHub/GitLab):** Plataforma externa en la nube a la que el usuario es redirigido desde el navegador para auditar e integrar ramas de código.
