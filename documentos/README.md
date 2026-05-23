# Documentos de Arquitectura de Software (SAD) - GestioCambios

Este directorio contiene la documentación técnica y los diagramas arquitectónicos del sistema **GestioCambios G04**, listos para ser incorporados en el **Documento de Arquitectura de Software (SAD)**.

## 📂 Contenido del Directorio

A continuación, se listan los documentos detallados con sus respectivas descripciones y códigos fuente en **PlantUML** para su edición y visualización:

1. **[Requisitos del Sistema](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/requisitos.md):** Listado formal de Requisitos Funcionales (RF) y Requisitos No Funcionales (RNF).
2. **[Diagrama de Casos de Uso](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/casos_de_uso.md):** Diagrama que modela las interacciones de los distintos roles y actores del sistema usando herencia de actores.
3. **[Diagramas de Secuencia](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/secuencia.md):** Detalle de los 3 flujos lógicos clave del sistema:
   - Autenticación segura y migración transparente a Bcrypt.
   - Registro y creación de una solicitud de cambio (Ticket).
   - Cambio de estado de un ticket e inyección de evidencias de desarrollo y QA.
4. **[Diagrama de Clases](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/clases.md):** Modelado UML de los controladores, servicios, modelos y módulos de configuración del backend.
5. **[Diagrama de Contexto](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/contexto.md):** Vista C4 Nivel 1 que define las interacciones del sistema con los usuarios y servicios externos.
6. **[Diagrama de Despliegue](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/despliegue.md):** Topología física de hardware y entornos lógicos de software para la ejecución del sistema.
7. **[Diagrama de Paquetes](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/paquetes.md):** Estructura completa de directorios y dependencias de importación físicas del código fuente.
8. **[Diagrama de Componentes](file:///c:/Users/ASUS/Music/Sistema_de_Gestion_de_la_Configuracion/GestioCambios/documentos/componentes.md):** Desglose de los módulos lógicos en tiempo de ejecución, interfaces expuestas y puertos de conexión.

---

## 🛠️ ¿Cómo visualizar los diagramas de PlantUML?

Todos los archivos contienen bloques de código delimitados por `@startuml` y `@enduml`. Puedes renderizarlos mediante las siguientes opciones:
- **VS Code:** Instalar la extensión **PlantUML** y presionar `Alt + D` dentro del archivo.
- **Online:** Copiar el bloque de código y pegarlo en [PlantText](https://www.planttext.com/) o [PlantUML Server](http://www.plantuml.com/plantuml).
