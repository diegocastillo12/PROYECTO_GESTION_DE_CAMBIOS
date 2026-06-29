-- =============================================================================
-- SISTEMA DE GESTIÓN DE CAMBIOS (db_gestion_cambios)
-- Script optimizado bajo estándares de ingeniería de software (SQL ANSI)
-- Convención de Nombres: snake_case | Palabras Clave: MAYÚSCULAS
-- =============================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CONFIGURACIÓN DE LA BASE DE DATOS (Nombres limpios sin espacios)
CREATE DATABASE IF NOT EXISTS db_gestion_cambios
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE db_gestion_cambios;

-- =============================================================================
-- SECCIÓN 1: TABLAS MAESTRAS (SIN DEPENDENCIAS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT,
    nombre_rol VARCHAR(50) NOT NULL,
    
    CONSTRAINT pk_roles PRIMARY KEY (id_rol),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id_rol, nombre_rol) VALUES
(1, 'Solicitante'),
(2, 'Director'),
(3, 'Gestor de Configuración'),
(4, 'Líder Técnico'),
(5, 'Comité de Control (CCB)'),
(6, 'Desarrollador Asignado'),
(7, 'Equipo QA / Tester'),
(8, 'Administrador');

CREATE TABLE IF NOT EXISTS metodologias (
    id_metodologia INT AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    
    CONSTRAINT pk_metodologias PRIMARY KEY (id_metodologia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECCIÓN 2: TABLAS CON DEPENDENCIAS SIMPLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT DEFAULT NULL,
    
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT fk_usuarios_roles 
        FOREIGN KEY (id_rol) REFERENCES roles (id_rol) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (id_usuario, nombre_completo, correo, password_hash, id_rol) VALUES
(1, 'Docente Evaluador UPT', 'docente@upt.pe', '$2b$10$KdBPZ5wsv285Oxd1Wuj.zuyjH4HNE9.iPt0MoTqjfjrK/sOIZEsBS', 1),
(2, 'Sergio Alberto Colque Ponce', 'sergio@upt.pe', '$2b$10$EPy5BIuMrd32meBD/dDwFOMhmWA.YI74knRj82TTXPwaD5VM4/gaa', 3),
(3, 'Diego Fernando Castillo Mamani', 'diego@upt.pe', '$2b$10$AGIJB6EzHlwqJ6yzA8fIDOU3Sx.ZfE8wof1y1syAREQoPXAQbYG2m', 4),
(4, 'Gregory Brandon Huanca Merma', 'gregory@upt.pe', '$2b$10$zDLhVuWMnO1OFfvRY5IFgu44X5Ixm0lkgT049ztOLcnd6Oie1/Sxa', 6),
(5, 'César Nikolas Camac Meléndez', 'cesar@upt.pe', '$2b$10$WUTIfBjRyKMDorlpCskM/uZHcH5kyotmdt/VM5od0aaVaBcsgM3p.', 7),
(6, 'Director Ejemplo', 'director@upt.pe', '$2b$10$1Fexm9JkZ.Qs.xLu30rjTumpelHvFG88wUSVIvH9AWD6kNNqTFaxG', 2),
(7, 'CCB Ejemplo', 'ccb@upt.pe', '$2b$10$hDQupgnakCDdDdHwUsXR4uEVMWn9Yhu.r7RiuVeLC6RCpEv2ytVSy', 5),
(8, 'Admin Sistema', 'admin@upt.pe', '123', 8);

CREATE TABLE IF NOT EXISTS etapas (
    id_etapa INT AUTO_INCREMENT,
    id_metodologia INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    orden INT DEFAULT 0,
    descripcion TEXT DEFAULT NULL,
    
    CONSTRAINT pk_etapas PRIMARY KEY (id_etapa),
    CONSTRAINT fk_etapas_metodologias 
        FOREIGN KEY (id_metodologia) REFERENCES metodologias (id_metodologia) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proyectos (
    id_proyecto INT AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    estado ENUM('Activo','Pausado','Cerrado','Archivado') DEFAULT 'Activo',
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin DATE DEFAULT NULL,
    id_admin INT NOT NULL,
    id_metodologia INT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_proyectos PRIMARY KEY (id_proyecto),
    CONSTRAINT fk_proyectos_admin 
        FOREIGN KEY (id_admin) REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_proyectos_metodologias 
        FOREIGN KEY (id_metodologia) REFERENCES metodologias (id_metodologia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fases (
    id_fase INT AUTO_INCREMENT,
    id_etapa INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    orden INT DEFAULT 0,
    descripcion TEXT DEFAULT NULL,
    
    CONSTRAINT pk_fases PRIMARY KEY (id_fase),
    CONSTRAINT fk_fases_etapas 
        FOREIGN KEY (id_etapa) REFERENCES etapas (id_etapa) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS elementos_config_metodologia (
    id_ecm INT AUTO_INCREMENT,
    id_fase INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('Documento','Diagrama','Codigo','Prueba','Otro') DEFAULT 'Documento',
    descripcion TEXT DEFAULT NULL,
    
    CONSTRAINT pk_elementos_config_metodologia PRIMARY KEY (id_ecm),
    CONSTRAINT fk_ecm_fases 
        FOREIGN KEY (id_fase) REFERENCES fases (id_fase) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECCIÓN 3: SOLICITUDES DE CAMBIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS solicitudes_cambio (
    id_sc INT AUTO_INCREMENT,
    id_proyecto INT DEFAULT NULL,
    ticket_id VARCHAR(15) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    justificacion_tecnica TEXT NOT NULL,
    tipo_cambio ENUM('Correctivo','Evolutivo','Adaptativo','Perfectivo') DEFAULT 'Correctivo',
    impacto ENUM('Pendiente','Menor','Mayor') DEFAULT 'Pendiente',
    modulos_afectados TEXT DEFAULT NULL,
    id_ecm_afectado INT DEFAULT NULL,
    id_etapa_afectada INT DEFAULT NULL,
    requisito_afectado VARCHAR(400) DEFAULT NULL,
    riesgo_tecnico ENUM('Bajo','Medio','Alto') DEFAULT NULL,
    informe_impacto TEXT DEFAULT NULL,
    costo_estimado DECIMAL(10,2) DEFAULT NULL,
    estado_actual ENUM('Solicitado','En Análisis','Pendiente de Aprobación','Aprobado','En Desarrollo','En Pruebas QA','En Pruebas UAT','Listo para Integración','Liberado','Rechazado','Descartado') DEFAULT 'Solicitado',
    horas_hombre_estimadas INT DEFAULT 0,
    version_tag VARCHAR(15) DEFAULT NULL,
    id_solicitante INT NOT NULL,
    id_desarrollador INT DEFAULT NULL,
    id_tester INT DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_solicitudes_cambio PRIMARY KEY (id_sc),
    CONSTRAINT uq_sc_ticket UNIQUE (ticket_id),
    CONSTRAINT fk_sc_solicitante FOREIGN KEY (id_solicitante) REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_sc_desarrollador FOREIGN KEY (id_desarrollador) REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_sc_tester FOREIGN KEY (id_tester) REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_sc_proyecto FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) ON DELETE SET NULL,
    CONSTRAINT fk_sc_ecm FOREIGN KEY (id_ecm_afectado) REFERENCES elementos_config_metodologia (id_ecm) ON DELETE SET NULL,
    CONSTRAINT fk_sc_etapa FOREIGN KEY (id_etapa_afectada) REFERENCES etapas (id_etapa) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO solicitudes_cambio (id_sc, id_proyecto, ticket_id, titulo, descripcion, justificacion_tecnica, tipo_cambio, impacto, modulos_afectados, riesgo_tecnico, informe_impacto, costo_estimado, estado_actual, horas_hombre_estimadas, version_tag, id_solicitante, id_desarrollador, id_tester, fecha_registro, fecha_ultima_modificacion) VALUES
(1, NULL, 'TK-SC001', 'Fallo en API de autenticación biométrica - Puerta Norte', 'Los lectores de rostro fallan en la mañana debido a la luz solar directa.', 'Se requiere ajustar el umbral de confianza del algoritmo en el controlador de reconocimiento.', 'Correctivo', 'Mayor', NULL, NULL, NULL, NULL, 'En Desarrollo', 12, NULL, 1, 4, 5, '2026-05-23 03:52:51', '2026-05-23 03:52:51'),
(2, NULL, 'TK-SC002', 'Automatización de alertas de inasistencias vía n8n', 'Implementar un nodo webhook en n8n para notificar de inmediato al estudiante cuando sume 3 faltas.', 'Optimizar la retención estudiantil mediante alertas tempranas automatizadas.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, 'Solicitado', 0, NULL, 1, NULL, NULL, '2026-05-23 03:52:51', '2026-05-23 03:52:51'),
(6, NULL, 'TK-SC006', 'Mejora de interfaz del panel de control', 'Rediseño del dashboard para mostrar métricas en tiempo real con gráficos interactivos.', 'Mejorar la experiencia de usuario y facilitar la toma de decisiones del Director.', 'Evolutivo', 'Mayor', NULL, NULL, NULL, NULL, 'En Análisis', 6, NULL, 1, NULL, NULL, '2026-05-23 04:59:29', '2026-05-23 05:12:52'),
(7, NULL, 'TK-SC007', 'Cancelación temporal de actividades - Sergio Offline', 'Incidencia de comunicación: Sergio se encuentra offline temporalmente afectando entregas.', 'Registro preventivo de estado de conectividad.', 'Adaptativo', 'Mayor', NULL, NULL, NULL, NULL, 'Solicitado', 6, NULL, 1, NULL, NULL, '2026-05-23 15:39:40', '2026-05-23 15:39:40'),
(8, NULL, 'TK-SC008', 'Duplicado - Sergio Offline', 'Registro duplicado por reintento de conexión.', 'Limpieza requerida en revisión.', 'Adaptativo', 'Mayor', NULL, NULL, NULL, NULL, 'Solicitado', 6, NULL, 1, NULL, NULL, '2026-05-23 15:39:41', '2026-05-23 15:39:41'),
(11, NULL, 'TK-SC009', 'Ajuste de validaciones generales', 'Validación de campos vacíos en formularios.', 'Evitar excepciones no controladas.', 'Correctivo', 'Pendiente', NULL, NULL, NULL, NULL, 'Rechazado', 2, NULL, 1, NULL, NULL, '2026-05-28 04:34:30', '2026-05-28 20:50:53'),
(16, NULL, 'TK-SC010', 'Optimización de consultas pesadas', 'Indexación de tablas críticas de logs.', 'Mejora de tiempos de respuesta.', 'Evolutivo', 'Pendiente', NULL, NULL, NULL, NULL, 'Liberado', 4, NULL, 1, 4, NULL, '2026-05-28 20:45:25', '2026-05-28 21:11:08'),
(20, NULL, 'TK-SC011', 'Ajuste de roles en Líder Técnico', 'Modificación de permisos en vista del líder.', 'Seguridad de accesos.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, 'Liberado', 4, NULL, 1, 4, NULL, '2026-05-28 21:42:51', '2026-05-28 21:55:46'),
(24, NULL, 'TK-SC012', 'Actualización de datos - Andy Calizaya', 'Corrección de metadatos de usuario.', 'Sincronización con repositorio central.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, 'Liberado', 3, NULL, 1, 4, NULL, '2026-05-28 23:33:38', '2026-05-28 23:37:42'),
(28, NULL, 'TK-SC013', 'Cambio en interfaz de registro', 'Modificación estética del botón principal.', 'Alineación con guía de estilos.', 'Correctivo', 'Pendiente', NULL, NULL, NULL, NULL, 'Liberado', 3, NULL, 1, 4, NULL, '2026-05-29 00:02:08', '2026-05-29 00:09:10');

-- =============================================================================
-- SECCIÓN 4: TABLAS DEPENDIENTES DE SOLICITUDES DE CAMBIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS control_calidad (
    id_calidad INT AUTO_INCREMENT,
    id_sc INT NOT NULL,
    qa_estado ENUM('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
    qa_evidencia_url VARCHAR(255) DEFAULT NULL,
    qa_observaciones TEXT DEFAULT NULL,
    uat_estado ENUM('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
    uat_observaciones TEXT DEFAULT NULL,
    
    CONSTRAINT pk_control_calidad PRIMARY KEY (id_calidad),
    CONSTRAINT uq_cc_sc UNIQUE (id_sc),
    CONSTRAINT fk_cc_solicitudes 
        FOREIGN KEY (id_sc) REFERENCES solicitudes_cambio (id_sc) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO control_calidad (id_calidad, id_sc, qa_estado, qa_evidencia_url, qa_observaciones, uat_estado, uat_observaciones) VALUES
(1, 16, 'Aprobado', '', 'Aprobado sin observaciones', 'Aprobado', 'Validado por usuario'),
(2, 20, 'Aprobado', '', 'Pruebas conformes', 'Aprobado', 'Cierre de ticket'),
(3, 24, 'Aprobado', '', 'Ok', 'Aprobado', 'Ok'),
(4, 28, 'Aprobado', '', '.', 'Aprobado', '.');

CREATE TABLE IF NOT EXISTS ecs_afectados (
    id_ecs INT AUTO_INCREMENT,
    id_sc INT NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    
    CONSTRAINT pk_ecs_afectados PRIMARY KEY (id_ecs),
    CONSTRAINT fk_ecs_solicitudes 
        FOREIGN KEY (id_sc) REFERENCES solicitudes_cambio (id_sc) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ecs_afectados (id_ecs, id_sc, ruta_archivo) VALUES
(1, 1, '/src/controllers/biometricController.js'),
(2, 1, '/src/routes/auth.js');

CREATE TABLE IF NOT EXISTS evidencias_git (
    id_evidencia INT AUTO_INCREMENT,
    id_sc INT NOT NULL,
    nombre_rama VARCHAR(100) NOT NULL,
    url_pull_request VARCHAR(255) NOT NULL,
    comentario_tecnico TEXT DEFAULT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_evidencias_git PRIMARY KEY (id_evidencia),
    CONSTRAINT uq_git_sc UNIQUE (id_sc),
    CONSTRAINT fk_git_solicitudes 
        FOREIGN KEY (id_sc) REFERENCES solicitudes_cambio (id_sc) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO evidencias_git (id_evidencia, id_sc, nombre_rama, url_pull_request, comentario_tecnico, fecha_envio) VALUES
(1, 16, 'feature/auth-fix', 'https://github.com/repo/pull/16', 'Merge correcto', '2026-05-28 21:00:59'),
(3, 20, 'alitamovil', 'https://github.com/repo/pull/20', 'Rama técnica', '2026-05-28 21:52:35'),
(4, 24, 'patch/user-fix', 'https://github.com/repo/pull/24', 'Ajuste de datos', '2026-05-28 23:35:55'),
(6, 28, 'ui/button-fix', 'prueba.com', 'Corrección visual', '2026-05-29 00:07:13');

CREATE TABLE IF NOT EXISTS historial_estados (
    id_historial INT AUTO_INCREMENT,
    id_sc INT NOT NULL,
    estado_anterior VARCHAR(50) DEFAULT NULL,
    estado_nuevo VARCHAR(50) NOT NULL,
    usuario_nombre VARCHAR(100) NOT NULL,
    usuario_rol VARCHAR(50) NOT NULL,
    comentario TEXT DEFAULT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_historial_estados PRIMARY KEY (id_historial),
    CONSTRAINT fk_historial_solicitudes 
        FOREIGN KEY (id_sc) REFERENCES solicitudes_cambio (id_sc) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO historial_estados (id_historial, id_sc, estado_anterior, estado_nuevo, usuario_nombre, usuario_rol, comentario, fecha_cambio) VALUES
(3, 6, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-23 04:59:29'),
(4, 6, 'Solicitado', 'En Análisis', 'Director Ejemplo', 'Director', NULL, '2026-05-23 05:12:52'),
(5, 7, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-23 15:39:40'),
(6, 8, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-23 15:39:41'),
(7, 16, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-28 20:45:25'),
(8, 16, 'Solicitado', 'En Análisis', 'Director Ejemplo', 'Director', 'lo aceptamos', '2026-05-28 20:50:31'),
(9, 11, 'Solicitado', 'Rechazado', 'Director Ejemplo', 'Director', 'requerido', '2026-05-28 20:50:53'),
(10, 16, 'En Análisis', 'Pendiente de Aprobación', 'Diego Fernando Castillo Mamani', 'Líder Técnico', NULL, '2026-05-28 20:57:32'),
(11, 16, 'Pendiente de Aprobación', 'Aprobado', 'Director Ejemplo', 'Director', NULL, '2026-05-28 20:58:28'),
(12, 16, 'Aprobado', 'En Desarrollo', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-28 21:00:59'),
(13, 16, 'En Desarrollo', 'En Pruebas QA', 'Gregory Brandon Huanca Merma', 'Desarrollador Asignado', 'awaa', '2026-05-28 21:09:07'),
(14, 16, 'En Pruebas QA', 'Listo para Integración', 'César Nikolas Camac Meléndez', 'Equipo QA / Tester', NULL, '2026-05-28 21:09:53'),
(15, 16, 'Listo para Integración', 'Liberado', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', 'waa', '2026-05-28 21:11:08'),
(16, 20, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-28 21:42:51'),
(17, 20, 'Solicitado', 'En Análisis', 'Director Ejemplo', 'Director', NULL, '2026-05-28 21:43:18'),
(18, 20, 'En Análisis', 'Pendiente de Aprobación', 'Diego Fernando Castillo Mamani', 'Líder Técnico', NULL, '2026-05-28 21:43:55'),
(19, 20, 'Pendiente de Aprobación', 'Aprobado', 'Director Ejemplo', 'Director', NULL, '2026-05-28 21:44:27'),
(20, 20, 'Aprobado', 'En Desarrollo', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-28 21:52:35'),
(21, 20, 'En Desarrollo', 'En Pruebas QA', 'Gregory Brandon Huanca Merma', 'Desarrollador Asignado', NULL, '2026-05-28 21:52:56'),
(22, 20, 'En Pruebas QA', 'En Pruebas UAT', 'César Nikolas Camac Meléndez', 'Equipo QA / Tester', NULL, '2026-05-28 21:53:31'),
(23, 20, 'En Pruebas UAT', 'Listo para Integración', 'César Nikolas Camac Meléndez', 'Equipo QA / Tester', NULL, '2026-05-28 21:54:11'),
(24, 20, 'Listo para Integración', 'Liberado', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', '1', '2026-05-28 21:55:46'),
(25, 24, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-28 23:33:38'),
(26, 24, 'Solicitado', 'En Análisis', 'Director Ejemplo', 'Director', NULL, '2026-05-28 23:34:04'),
(27, 24, 'En Análisis', 'Pendiente de Aprobación', 'Diego Fernando Castillo Mamani', 'Líder Técnico', NULL, '2026-05-28 23:34:28'),
(28, 24, 'Pendiente de Aprobación', 'Aprobado', 'Director Ejemplo', 'Director', NULL, '2026-05-28 23:35:02'),
(29, 24, 'Aprobado', 'En Desarrollo', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-28 23:35:55'),
(30, 24, 'En Desarrollo', 'En Pruebas QA', 'Gregory Brandon Huanca Merma', 'Desarrollador Asignado', NULL, '2026-05-28 23:36:30'),
(31, 24, 'En Pruebas QA', 'Listo para Integración', 'César Nikolas Camac Meléndez', 'Equipo QA / Tester', NULL, '2026-05-28 23:36:59'),
(32, 24, 'Listo para Integración', 'Liberado', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-28 23:37:42'),
(33, 28, NULL, 'Solicitado', 'Docente Evaluador UPT', 'Solicitante', 'Ticket creado.', '2026-05-29 00:02:08'),
(34, 28, 'Solicitado', 'En Análisis', 'Director Ejemplo', 'Director', NULL, '2026-05-29 00:02:32'),
(35, 28, 'En Análisis', 'Pendiente de Aprobación', 'Diego Fernando Castillo Mamani', 'Líder Técnico', NULL, '2026-05-29 00:04:21'),
(36, 28, 'Pendiente de Aprobación', 'Aprobado', 'Director Ejemplo', 'Director', NULL, '2026-05-29 00:06:18'),
(37, 28, 'Aprobado', 'En Desarrollo', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-29 00:07:12'),
(38, 28, 'En Desarrollo', 'En Pruebas QA', 'Gregory Brandon Huanca Merma', 'Desarrollador Asignado', NULL, '2026-05-29 00:07:57'),
(39, 28, 'En Pruebas QA', 'Listo para Integración', 'César Nikolas Camac Meléndez', 'Equipo QA / Tester', NULL, '2026-05-29 00:08:26'),
(40, 28, 'Listo para Integración', 'Liberado', 'Sergio Alberto Colque Ponce', 'Gestor de Configuración', NULL, '2026-05-29 00:09:10');

-- =============================================================================
-- SECCIÓN 5: PROYECTOS Y PLANIFICACIÓN
-- =============================================================================

CREATE TABLE IF NOT EXISTS proyecto_clientes (
    id INT AUTO_INCREMENT,
    id_proyecto INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_proyecto_clientes PRIMARY KEY (id),
    CONSTRAINT uq_proyecto_cliente UNIQUE (id_proyecto, id_usuario),
    CONSTRAINT fk_clientes_proyectos 
        FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) 
        ON DELETE CASCADE,
    CONSTRAINT fk_clientes_usuarios 
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proyecto_equipo (
    id INT AUTO_INCREMENT,
    id_proyecto INT NOT NULL,
    id_usuario INT NOT NULL,
    rol_en_proyecto VARCHAR(60) NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_proyecto_equipo PRIMARY KEY (id),
    CONSTRAINT uq_proyecto_equipo UNIQUE (id_proyecto, id_usuario),
    CONSTRAINT fk_equipo_proyectos 
        FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) 
        ON DELETE CASCADE,
    CONSTRAINT fk_equipo_usuarios 
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cronograma_actividades (
    id_actividad INT AUTO_INCREMENT,
    id_proyecto INT NOT NULL,
    id_fase INT DEFAULT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    es_reportable TINYINT(1) DEFAULT 1,
    id_entregable INT DEFAULT NULL,
    porcentaje_avance DECIMAL(5,2) DEFAULT 0.00,
    estado ENUM('Pendiente','En Progreso','Completado','Bloqueado') DEFAULT 'Pendiente',
    
    CONSTRAINT pk_cronograma_actividades PRIMARY KEY (id_actividad),
    CONSTRAINT fk_cronograma_proyectos 
        FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) 
        ON DELETE CASCADE,
    CONSTRAINT fk_cronograma_fases 
        FOREIGN KEY (id_fase) REFERENCES fases (id_fase) 
        ON DELETE SET NULL,
    CONSTRAINT fk_cronograma_sc 
        FOREIGN KEY (id_entregable) REFERENCES solicitudes_cambio (id_sc) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reportes_avance (
    id_reporte INT AUTO_INCREMENT,
    id_actividad INT NOT NULL,
    id_proyecto INT NOT NULL,
    id_usuario_reporta INT NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    comentario TEXT DEFAULT NULL,
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visto_por_cliente TINYINT(1) DEFAULT 0,
    
    CONSTRAINT pk_reportes_avance PRIMARY KEY (id_reporte),
    CONSTRAINT fk_reportes_actividades 
        FOREIGN KEY (id_actividad) REFERENCES cronograma_actividades (id_actividad) 
        ON DELETE CASCADE,
    CONSTRAINT fk_reportes_proyectos 
        FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto),
    CONSTRAINT fk_reportes_usuarios 
        FOREIGN KEY (id_usuario_reporta) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. RESTAURAR VERIFICACIÓN DE LLAVES FORÁNEAS
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;