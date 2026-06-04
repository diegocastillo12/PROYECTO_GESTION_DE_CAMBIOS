# Diagrama del Proceso Actual (Antes del Sistema SCM)

Este documento detalla el proceso manual, tradicional y no sistematizado de gestion de cambios (proceso AS-IS) que se realizaba mediante correos electronicos, mensajeria de chat, archivos Excel locales y comunicacion verbal, antes de la implementacion del sistema GestioCambios.

---

## 1. Diagrama de Proceso en PlantUML

```plantuml
@startuml Proceso_Actual_Manual

' CONFIGURACION VISUAL SIN COLORES PERSONALIZADOS
skinparam defaultFontName Arial
skinparam defaultFontSize 12

|Solicitante|
start
:Detecta necesidad de cambio o error;
:Redacta correo electronico o mensaje de chat;
:Envia la solicitud de cambio al Director;

|Director|
:Recibe el correo electronico;
:Reenvia el correo al Lider Tecnico solicitando analisis;

|Lider Tecnico|
:Recibe solicitud por correo;
:Analiza el impacto del cambio manualmente;
:Registra estimacion de horas en un documento de Word o Excel;
:Envia analisis de impacto y estimaciones por correo al Director;

|Director|
:Revisa el analisis enviado;
if (¿El impacto es mayor?) then (si)
  :Convoca a reunion presencial o virtual con el CCB;
  |Comite de Control (CCB)|
  :Discute la viabilidad del cambio en la reunion;
  if (¿Se aprueba el cambio?) then (si)
    :Se genera acta de reunion fisica o digital de aprobacion;
  else (no)
    :Se notifica el rechazo al Solicitante por correo;
    stop
  endif
else (no)
  |Director|
  if (¿Director aprueba el cambio?) then (si)
    :Aprueba mediante respuesta de correo electronico;
  else (no)
    :Notifica el rechazo al Solicitante por correo;
    stop
  endif
endif

|Director|
:Envia correo de autorizacion al Gestor de Configuracion;

|Gestor de Configuracion|
:Recibe correo de autorizacion;
:Asigna verbalmente o por chat al Desarrollador y al Tester;
:Registra la tarea en un archivo Excel de control local;

|Desarrollador Asignado|
:Recibe la asignacion;
:Modifica el codigo fuente de forma local;
:Realiza el commit y push al repositorio;
:Notifica al Tester por chat o verbalmente que el cambio esta listo;

|Equipo QA / Tester|
:Recibe notificacion verbal o de chat;
:Realiza pruebas de forma manual;
if (¿Se detectan errores?) then (si)
  :Registra errores en un bloc de notas o Excel;
  :Notifica los fallos al Desarrollador por chat;
  |Desarrollador Asignado|
  :Corrige fallos en codigo;
  :Vuelve a subir cambios e informa al Tester;
  |Equipo QA / Tester|
  :Vuelve a probar;
else (no)
  :Informa al Solicitante por correo que puede probar;
endif

|Solicitante|
:Recibe notificacion de pruebas;
:Prueba el cambio en su equipo o ambiente de pruebas;
if (¿El cambio es conforme?) then (si)
  :Envia correo de conformidad al Director y al Gestor;
  
  |Gestor de Configuracion|
  :Realiza la integracion manual del codigo;
  :Despliega el cambio en produccion;
  :Envia correo general informando la liberacion del cambio;
  stop
else (no)
  :Informa disconformidad por correo al Tester y Desarrollador;
  |Desarrollador Asignado|
  :Corrige fallos;
endif

@enduml
```

---

## 2. Puntos Criticos del Proceso Manual (AS-IS)

* **Falta de trazabilidad:** No hay un repositorio centralizado de auditoria. Las conversaciones, justificaciones y aprobaciones quedan dispersas en bandejas de correo individuales o chats temporales.
* **Inexistencia de control de estados:** Los tickets no tienen estados duros y regulados. El avance depende enteramente de que los participantes recuerden enviar un correo o mensaje al siguiente actor en la cadena.
* **Desconexion con el repositorio de codigo:** No hay relacion directa entre la solicitud de cambio y el commit o la rama de desarrollo. El Gestor de Configuracion debe integrar confiando en la palabra del Desarrollador.
* **Control manual de actividades:** El avance del proyecto se gestiona en hojas de Excel locales propensas a errores, duplicaciones y desactualizacion.
* **Dificultad de auditoria:** Para auditar un cambio antiguo, se debe reconstruir la linea de tiempo buscando correos electronicos, actas de reuniones escaneadas e historiales de chat.
