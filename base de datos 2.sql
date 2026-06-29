-- --------------------------------------------------------
-- Host:                         152.53.195.99
-- Versión del servidor:         8.4.10 - MySQL Community Server - GPL
-- SO del servidor:              Linux
-- HeidiSQL Versión:             12.16.0.7229
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para db_gestion_cambios
CREATE DATABASE IF NOT EXISTS `db_gestion_cambios` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_gestion_cambios`;

-- Volcando estructura para tabla db_gestion_cambios.control_calidad
CREATE TABLE IF NOT EXISTS `control_calidad` (
  `id_calidad` int NOT NULL AUTO_INCREMENT,
  `id_sc` int NOT NULL,
  `qa_estado` enum('Pendiente','Aprobado','Rechazado') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `qa_evidencia_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qa_observaciones` text COLLATE utf8mb4_unicode_ci,
  `uat_estado` enum('Pendiente','Aprobado','Rechazado') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `uat_observaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_calidad`),
  UNIQUE KEY `uq_cc_sc` (`id_sc`),
  CONSTRAINT `fk_cc_solicitudes` FOREIGN KEY (`id_sc`) REFERENCES `solicitudes_cambio` (`id_sc`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.control_calidad: ~4 rows (aproximadamente)
INSERT INTO `control_calidad` (`id_calidad`, `id_sc`, `qa_estado`, `qa_evidencia_url`, `qa_observaciones`, `uat_estado`, `uat_observaciones`) VALUES
	(1, 16, 'Aprobado', '', 'Aprobado sin observaciones', 'Aprobado', 'Validado por usuario'),
	(2, 20, 'Aprobado', '', 'Pruebas conformes', 'Aprobado', 'Cierre de ticket'),
	(3, 24, 'Aprobado', '', 'Ok', 'Aprobado', 'Ok'),
	(4, 28, 'Aprobado', '', '.', 'Aprobado', '.');

-- Volcando estructura para tabla db_gestion_cambios.cronograma_actividades
CREATE TABLE IF NOT EXISTS `cronograma_actividades` (
  `id_actividad` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_fase` int DEFAULT NULL,
  `id_usuario` int DEFAULT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `es_reportable` tinyint(1) DEFAULT '1',
  `id_entregable` int DEFAULT NULL,
  `porcentaje_avance` decimal(5,2) DEFAULT '0.00',
  `estado` enum('Pendiente','En Progreso','Completado','Bloqueado') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  PRIMARY KEY (`id_actividad`),
  KEY `fk_cronograma_proyectos` (`id_proyecto`),
  KEY `fk_cronograma_fases` (`id_fase`),
  KEY `fk_cronograma_sc` (`id_entregable`),
  KEY `fk_cronograma_usuarios` (`id_usuario`),
  CONSTRAINT `fk_cronograma_fases` FOREIGN KEY (`id_fase`) REFERENCES `fases` (`id_fase`) ON DELETE SET NULL,
  CONSTRAINT `fk_cronograma_proyectos` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE,
  CONSTRAINT `fk_cronograma_sc` FOREIGN KEY (`id_entregable`) REFERENCES `solicitudes_cambio` (`id_sc`) ON DELETE SET NULL,
  CONSTRAINT `fk_cronograma_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.cronograma_actividades: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_gestion_cambios.ecs_afectados
CREATE TABLE IF NOT EXISTS `ecs_afectados` (
  `id_ecs` int NOT NULL AUTO_INCREMENT,
  `id_sc` int NOT NULL,
  `ruta_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_ecs`),
  KEY `fk_ecs_solicitudes` (`id_sc`),
  CONSTRAINT `fk_ecs_solicitudes` FOREIGN KEY (`id_sc`) REFERENCES `solicitudes_cambio` (`id_sc`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.ecs_afectados: ~2 rows (aproximadamente)
INSERT INTO `ecs_afectados` (`id_ecs`, `id_sc`, `ruta_archivo`) VALUES
	(1, 1, '/src/controllers/biometricController.js'),
	(2, 1, '/src/routes/auth.js');

-- Volcando estructura para tabla db_gestion_cambios.elementos_config_metodologia
CREATE TABLE IF NOT EXISTS `elementos_config_metodologia` (
  `id_ecm` int NOT NULL AUTO_INCREMENT,
  `id_fase` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('Documento','Diagrama','Codigo','Prueba','Otro') COLLATE utf8mb4_unicode_ci DEFAULT 'Documento',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_ecm`),
  KEY `fk_ecm_fases` (`id_fase`),
  CONSTRAINT `fk_ecm_fases` FOREIGN KEY (`id_fase`) REFERENCES `fases` (`id_fase`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.elementos_config_metodologia: ~0 rows (aproximadamente)
INSERT INTO `elementos_config_metodologia` (`id_ecm`, `id_fase`, `nombre`, `tipo`, `descripcion`) VALUES
	(1, 1, 'Documento Visión', 'Documento', 'Define el alcance general y las necesidades del negocio.'),
	(2, 1, 'Especificación de Requerimientos de Software (SRS)', 'Documento', 'Requisitos funcionales y no funcionales detallados.'),
	(3, 1, 'Diagrama de Casos de Uso', 'Diagrama', 'Representación visual de los actores e interacciones del sistema.'),
	(4, 2, 'Documento de Arquitectura de Software (SAD)', 'Documento', 'Descripción del diseño arquitectónico del sistema.'),
	(5, 2, 'Diagrama de Clases', 'Diagrama', 'Modelo estático de la estructura del sistema.'),
	(6, 2, 'Diagrama de Secuencia', 'Diagrama', 'Modelo dinámico del flujo de interacción entre objetos.'),
	(7, 3, 'Código Fuente', 'Codigo', 'Implementación del código del sistema.'),
	(8, 3, 'Plan de Pruebas Unitarias', 'Prueba', 'Pruebas automatizadas de lógica interna.'),
	(9, 4, 'Manual de Usuario', 'Documento', 'Guía de uso para el usuario final.'),
	(10, 4, 'Plan de Despliegue', 'Documento', 'Pasos y requerimientos para subir a producción.'),
	(11, 5, 'Product Backlog', 'Documento', 'Lista priorizada de características del producto.'),
	(12, 5, 'Historias de Usuario (User Stories)', 'Documento', 'Requerimientos descritos desde la perspectiva del usuario.'),
	(13, 6, 'Sprint Backlog', 'Documento', 'Tareas seleccionadas para el sprint actual.'),
	(14, 6, 'Código Incremental', 'Codigo', 'Entregable funcional desarrollado durante el sprint.'),
	(15, 6, 'Criterios de Aceptación', 'Documento', 'Condiciones que debe cumplir el incremento.'),
	(16, 7, 'Reporte de Sprint Review', 'Documento', 'Resultado de la demo del incremento ante el Product Owner.'),
	(17, 7, 'Plan de Acción Retrospectiva', 'Documento', 'Mejoras a implementar en el siguiente sprint.'),
	(18, 1, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(19, 1, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(20, 1, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(21, 1, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(22, 2, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(23, 2, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(24, 2, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(25, 3, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(26, 3, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(27, 3, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(28, 3, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(29, 4, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(30, 4, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(31, 4, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(32, 4, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(33, 5, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(34, 5, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(35, 5, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(36, 5, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(37, 6, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(38, 6, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(39, 6, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(40, 6, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.'),
	(41, 7, 'Especificación de Requisitos', 'Documento', 'Especificación de requisitos de software (SRS).'),
	(42, 7, 'Módulo de Autenticación', 'Codigo', 'Código fuente del módulo de inicio de sesión y perfiles.'),
	(43, 7, 'Diagrama de Clases', 'Diagrama', 'Diagrama UML de estructura de clases de la solución.'),
	(44, 7, 'Plan de Pruebas', 'Prueba', 'Documento y casos de prueba QA.');

-- Volcando estructura para tabla db_gestion_cambios.etapas
CREATE TABLE IF NOT EXISTS `etapas` (
  `id_etapa` int NOT NULL AUTO_INCREMENT,
  `id_metodologia` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int DEFAULT '0',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_etapa`),
  KEY `fk_etapas_metodologias` (`id_metodologia`),
  CONSTRAINT `fk_etapas_metodologias` FOREIGN KEY (`id_metodologia`) REFERENCES `metodologias` (`id_metodologia`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.etapas: ~0 rows (aproximadamente)
INSERT INTO `etapas` (`id_etapa`, `id_metodologia`, `nombre`, `orden`, `descripcion`) VALUES
	(1, 1, 'Iniciación', 1, 'Definición del alcance del proyecto y casos de negocio.'),
	(2, 1, 'Elaboración', 2, 'Planificación de actividades y diseño de la arquitectura base.'),
	(3, 1, 'Construcción', 3, 'Desarrollo del producto e implementación del software.'),
	(4, 1, 'Transición', 4, 'Pruebas finales, despliegue y entrega al usuario final.'),
	(5, 2, 'Planificación', 1, 'Definición del product backlog inicial y alcance general.'),
	(6, 2, 'Sprints', 2, 'Desarrollo iterativo e incremental del software.'),
	(7, 2, 'Cierre de Sprint', 3, 'Revisión del incremento y retrospectiva.');

-- Volcando estructura para tabla db_gestion_cambios.evidencias_git
CREATE TABLE IF NOT EXISTS `evidencias_git` (
  `id_evidencia` int NOT NULL AUTO_INCREMENT,
  `id_sc` int NOT NULL,
  `nombre_rama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_pull_request` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comentario_tecnico` text COLLATE utf8mb4_unicode_ci,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evidencia`),
  UNIQUE KEY `uq_git_sc` (`id_sc`),
  CONSTRAINT `fk_git_solicitudes` FOREIGN KEY (`id_sc`) REFERENCES `solicitudes_cambio` (`id_sc`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.evidencias_git: ~4 rows (aproximadamente)
INSERT INTO `evidencias_git` (`id_evidencia`, `id_sc`, `nombre_rama`, `url_pull_request`, `comentario_tecnico`, `fecha_envio`) VALUES
	(1, 16, 'feature/auth-fix', 'https://github.com/repo/pull/16', 'Merge correcto', '2026-05-28 21:00:59'),
	(3, 20, 'alitamovil', 'https://github.com/repo/pull/20', 'Rama técnica', '2026-05-28 21:52:35'),
	(4, 24, 'patch/user-fix', 'https://github.com/repo/pull/24', 'Ajuste de datos', '2026-05-28 23:35:55'),
	(6, 28, 'ui/button-fix', 'prueba.com', 'Corrección visual', '2026-05-29 00:07:13');

-- Volcando estructura para tabla db_gestion_cambios.fases
CREATE TABLE IF NOT EXISTS `fases` (
  `id_fase` int NOT NULL AUTO_INCREMENT,
  `id_etapa` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int DEFAULT '0',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_fase`),
  KEY `fk_fases_etapas` (`id_etapa`),
  CONSTRAINT `fk_fases_etapas` FOREIGN KEY (`id_etapa`) REFERENCES `etapas` (`id_etapa`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.fases: ~0 rows (aproximadamente)
INSERT INTO `fases` (`id_fase`, `id_etapa`, `nombre`, `orden`, `descripcion`) VALUES
	(1, 1, 'Concepción y Requerimientos', 1, NULL),
	(2, 2, 'Arquitectura y Diseño', 1, NULL),
	(3, 3, 'Desarrollo y Pruebas Unitarias', 1, NULL),
	(4, 4, 'Despliegue y Cierre', 1, NULL),
	(5, 5, 'Preparación del Backlog', 1, NULL),
	(6, 6, 'Ejecución del Sprint', 1, NULL),
	(7, 7, 'Revisión y Retrospectiva', 1, NULL);

-- Volcando estructura para tabla db_gestion_cambios.historial_estados
CREATE TABLE IF NOT EXISTS `historial_estados` (
  `id_historial` int NOT NULL AUTO_INCREMENT,
  `id_sc` int NOT NULL,
  `estado_anterior` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `fk_historial_solicitudes` (`id_sc`),
  CONSTRAINT `fk_historial_solicitudes` FOREIGN KEY (`id_sc`) REFERENCES `solicitudes_cambio` (`id_sc`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.historial_estados: ~38 rows (aproximadamente)
INSERT INTO `historial_estados` (`id_historial`, `id_sc`, `estado_anterior`, `estado_nuevo`, `usuario_nombre`, `usuario_rol`, `comentario`, `fecha_cambio`) VALUES
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

-- Volcando estructura para tabla db_gestion_cambios.metodologias
CREATE TABLE IF NOT EXISTS `metodologias` (
  `id_metodologia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_metodologia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.metodologias: ~2 rows (aproximadamente)
INSERT INTO `metodologias` (`id_metodologia`, `nombre`, `descripcion`) VALUES
	(1, 'RUP (Rational Unified Process)', 'Metodología tradicional de desarrollo de software basada en fases y casos de uso.'),
	(2, 'Scrum', 'Metodología ágil para la gestión de proyectos de desarrollo de software basada en iteraciones (sprints).');

-- Volcando estructura para tabla db_gestion_cambios.proyecto_clientes
CREATE TABLE IF NOT EXISTS `proyecto_clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proyecto_cliente` (`id_proyecto`,`id_usuario`),
  KEY `fk_clientes_usuarios` (`id_usuario`),
  CONSTRAINT `fk_clientes_proyectos` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE,
  CONSTRAINT `fk_clientes_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.proyecto_clientes: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_gestion_cambios.proyecto_equipo
CREATE TABLE IF NOT EXISTS `proyecto_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_usuario` int NOT NULL,
  `rol_en_proyecto` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proyecto_equipo` (`id_proyecto`,`id_usuario`),
  KEY `fk_equipo_usuarios` (`id_usuario`),
  CONSTRAINT `fk_equipo_proyectos` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE,
  CONSTRAINT `fk_equipo_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.proyecto_equipo: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_gestion_cambios.proyectos
CREATE TABLE IF NOT EXISTS `proyectos` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('Activo','Pausado','Cerrado','Archivado') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `id_admin` int NOT NULL,
  `id_metodologia` int DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `github_repo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`),
  KEY `fk_proyectos_admin` (`id_admin`),
  KEY `fk_proyectos_metodologias` (`id_metodologia`),
  CONSTRAINT `fk_proyectos_admin` FOREIGN KEY (`id_admin`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_proyectos_metodologias` FOREIGN KEY (`id_metodologia`) REFERENCES `metodologias` (`id_metodologia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.proyectos: ~0 rows (aproximadamente)
INSERT INTO `proyectos` (`id_proyecto`, `nombre`, `descripcion`, `estado`, `fecha_inicio`, `fecha_fin`, `id_admin`, `id_metodologia`, `fecha_creacion`, `github_repo`) VALUES
	(2, 'SMART CAMPUS PARA LA UPT', 'SMART CAMPUS PARA LA UPT', 'Activo', '2026-06-29', '2026-08-20', 8, 2, '2026-06-29 19:54:25', NULL);

-- Volcando estructura para tabla db_gestion_cambios.reportes_avance
CREATE TABLE IF NOT EXISTS `reportes_avance` (
  `id_reporte` int NOT NULL AUTO_INCREMENT,
  `id_actividad` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `id_usuario_reporta` int NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `fecha_reporte` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `visto_por_cliente` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_reporte`),
  KEY `fk_reportes_actividades` (`id_actividad`),
  KEY `fk_reportes_proyectos` (`id_proyecto`),
  KEY `fk_reportes_usuarios` (`id_usuario_reporta`),
  CONSTRAINT `fk_reportes_actividades` FOREIGN KEY (`id_actividad`) REFERENCES `cronograma_actividades` (`id_actividad`) ON DELETE CASCADE,
  CONSTRAINT `fk_reportes_proyectos` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`),
  CONSTRAINT `fk_reportes_usuarios` FOREIGN KEY (`id_usuario_reporta`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.reportes_avance: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_gestion_cambios.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_roles_nombre` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.roles: ~8 rows (aproximadamente)
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
	(1, 'Solicitante'),
	(2, 'Director'),
	(3, 'Gestor de Configuración'),
	(4, 'Líder Técnico'),
	(5, 'Comité de Control (CCB)'),
	(6, 'Desarrollador Asignado'),
	(7, 'Equipo QA / Tester'),
	(8, 'Administrador');

-- Volcando estructura para tabla db_gestion_cambios.solicitudes_cambio
CREATE TABLE IF NOT EXISTS `solicitudes_cambio` (
  `id_sc` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int DEFAULT NULL,
  `ticket_id` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `justificacion_tecnica` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_cambio` enum('Correctivo','Evolutivo','Adaptativo','Perfectivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Correctivo',
  `impacto` enum('Pendiente','Menor','Mayor') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `modulos_afectados` text COLLATE utf8mb4_unicode_ci,
  `id_ecm_afectado` int DEFAULT NULL,
  `id_etapa_afectada` int DEFAULT NULL,
  `requisito_afectado` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `riesgo_tecnico` enum('Bajo','Medio','Alto') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `informe_impacto` text COLLATE utf8mb4_unicode_ci,
  `costo_estimado` decimal(10,2) DEFAULT NULL,
  `estado_actual` enum('Solicitado','En Análisis','Pendiente de Aprobación','Aprobado','En Desarrollo','En Pruebas QA','En Pruebas UAT','Listo para Integración','Liberado','Rechazado','Descartado') COLLATE utf8mb4_unicode_ci DEFAULT 'Solicitado',
  `horas_hombre_estimadas` int DEFAULT '0',
  `version_tag` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_solicitante` int NOT NULL,
  `id_desarrollador` int DEFAULT NULL,
  `id_tester` int DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultima_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sc`),
  UNIQUE KEY `uq_sc_ticket` (`ticket_id`),
  KEY `fk_sc_solicitante` (`id_solicitante`),
  KEY `fk_sc_desarrollador` (`id_desarrollador`),
  KEY `fk_sc_tester` (`id_tester`),
  KEY `fk_sc_proyecto` (`id_proyecto`),
  KEY `fk_sc_ecm` (`id_ecm_afectado`),
  KEY `fk_sc_etapa` (`id_etapa_afectada`),
  CONSTRAINT `fk_sc_desarrollador` FOREIGN KEY (`id_desarrollador`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_sc_ecm` FOREIGN KEY (`id_ecm_afectado`) REFERENCES `elementos_config_metodologia` (`id_ecm`) ON DELETE SET NULL,
  CONSTRAINT `fk_sc_etapa` FOREIGN KEY (`id_etapa_afectada`) REFERENCES `etapas` (`id_etapa`) ON DELETE SET NULL,
  CONSTRAINT `fk_sc_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE SET NULL,
  CONSTRAINT `fk_sc_solicitante` FOREIGN KEY (`id_solicitante`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_sc_tester` FOREIGN KEY (`id_tester`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.solicitudes_cambio: ~10 rows (aproximadamente)
INSERT INTO `solicitudes_cambio` (`id_sc`, `id_proyecto`, `ticket_id`, `titulo`, `descripcion`, `justificacion_tecnica`, `tipo_cambio`, `impacto`, `modulos_afectados`, `id_ecm_afectado`, `id_etapa_afectada`, `requisito_afectado`, `riesgo_tecnico`, `informe_impacto`, `costo_estimado`, `estado_actual`, `horas_hombre_estimadas`, `version_tag`, `id_solicitante`, `id_desarrollador`, `id_tester`, `fecha_registro`, `fecha_ultima_modificacion`) VALUES
	(1, NULL, 'TK-SC001', 'Fallo en API de autenticación biométrica - Puerta Norte', 'Los lectores de rostro fallan en la mañana debido a la luz solar directa.', 'Se requiere ajustar el umbral de confianza del algoritmo en el controlador de reconocimiento.', 'Correctivo', 'Mayor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'En Desarrollo', 12, NULL, 1, 4, 5, '2026-05-23 03:52:51', '2026-05-23 03:52:51'),
	(2, NULL, 'TK-SC002', 'Automatización de alertas de inasistencias vía n8n', 'Implementar un nodo webhook en n8n para notificar de inmediato al estudiante cuando sume 3 faltas.', 'Optimizar la retención estudiantil mediante alertas tempranas automatizadas.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Solicitado', 0, NULL, 1, NULL, NULL, '2026-05-23 03:52:51', '2026-05-23 03:52:51'),
	(6, NULL, 'TK-SC006', 'Mejora de interfaz del panel de control', 'Rediseño del dashboard para mostrar métricas en tiempo real con gráficos interactivos.', 'Mejorar la experiencia de usuario y facilitar la toma de decisiones del Director.', 'Evolutivo', 'Mayor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'En Análisis', 6, NULL, 1, NULL, NULL, '2026-05-23 04:59:29', '2026-05-23 05:12:52'),
	(7, NULL, 'TK-SC007', 'Cancelación temporal de actividades - Sergio Offline', 'Incidencia de comunicación: Sergio se encuentra offline temporalmente afectando entregas.', 'Registro preventivo de estado de conectividad.', 'Adaptativo', 'Mayor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Solicitado', 6, NULL, 1, NULL, NULL, '2026-05-23 15:39:40', '2026-05-23 15:39:40'),
	(8, NULL, 'TK-SC008', 'Duplicado - Sergio Offline', 'Registro duplicado por reintento de conexión.', 'Limpieza requerida en revisión.', 'Adaptativo', 'Mayor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Solicitado', 6, NULL, 1, NULL, NULL, '2026-05-23 15:39:41', '2026-05-23 15:39:41'),
	(11, NULL, 'TK-SC009', 'Ajuste de validaciones generales', 'Validación de campos vacíos en formularios.', 'Evitar excepciones no controladas.', 'Correctivo', 'Pendiente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Rechazado', 2, NULL, 1, NULL, NULL, '2026-05-28 04:34:30', '2026-05-28 20:50:53'),
	(16, NULL, 'TK-SC010', 'Optimización de consultas pesadas', 'Indexación de tablas críticas de logs.', 'Mejora de tiempos de respuesta.', 'Evolutivo', 'Pendiente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Liberado', 4, NULL, 1, 4, NULL, '2026-05-28 20:45:25', '2026-05-28 21:11:08'),
	(20, NULL, 'TK-SC011', 'Ajuste de roles en Líder Técnico', 'Modificación de permisos en vista del líder.', 'Seguridad de accesos.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Liberado', 4, NULL, 1, 4, NULL, '2026-05-28 21:42:51', '2026-05-28 21:55:46'),
	(24, NULL, 'TK-SC012', 'Actualización de datos - Andy Calizaya', 'Corrección de metadatos de usuario.', 'Sincronización con repositorio central.', 'Evolutivo', 'Menor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Liberado', 3, NULL, 1, 4, NULL, '2026-05-28 23:33:38', '2026-05-28 23:37:42'),
	(28, NULL, 'TK-SC013', 'Cambio en interfaz de registro', 'Modificación estética del botón principal.', 'Alineación con guía de estilos.', 'Correctivo', 'Pendiente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Liberado', 3, NULL, 1, 4, NULL, '2026-05-29 00:02:08', '2026-05-29 00:09:10');

-- Volcando estructura para tabla db_gestion_cambios.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int DEFAULT NULL,
  `github_token` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  KEY `fk_usuarios_roles` (`id_rol`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.usuarios: ~8 rows (aproximadamente)
INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `correo`, `password_hash`, `id_rol`, `github_token`) VALUES
	(1, 'Docente Evaluador UPT', 'docente@upt.pe', '$2b$10$KdBPZ5wsv285Oxd1Wuj.zuyjH4HNE9.iPt0MoTqjfjrK/sOIZEsBS', 1, NULL),
	(2, 'Sergio Alberto Colque Ponce', 'sergio@upt.pe', '$2b$10$EPy5BIuMrd32meBD/dDwFOMhmWA.YI74knRj82TTXPwaD5VM4/gaa', 3, NULL),
	(3, 'Diego Fernando Castillo Mamani', 'diego@upt.pe', '$2b$10$AGIJB6EzHlwqJ6yzA8fIDOU3Sx.ZfE8wof1y1syAREQoPXAQbYG2m', 4, NULL),
	(4, 'Gregory Brandon Huanca Merma', 'gregory@upt.pe', '$2b$10$zDLhVuWMnO1OFfvRY5IFgu44X5Ixm0lkgT049ztOLcnd6Oie1/Sxa', 6, NULL),
	(5, 'César Nikolas Camac Meléndez', 'cesar@upt.pe', '$2b$10$WUTIfBjRyKMDorlpCskM/uZHcH5kyotmdt/VM5od0aaVaBcsgM3p.', 7, NULL),
	(6, 'Director Ejemplo', 'director@upt.pe', '$2b$10$1Fexm9JkZ.Qs.xLu30rjTumpelHvFG88wUSVIvH9AWD6kNNqTFaxG', 2, NULL),
	(7, 'CCB Ejemplo', 'ccb@upt.pe', '$2b$10$hDQupgnakCDdDdHwUsXR4uEVMWn9Yhu.r7RiuVeLC6RCpEv2ytVSy', 5, NULL),
	(8, 'Admin Sistema', 'admin@upt.pe', '$2b$10$uK55AQYW0IKb2UUktlmoFuWtYz6JsBabo/S9xFnnWyvmikOvZcDe2', 8, NULL);

-- Volcando estructura para tabla db_gestion_cambios.versiones_ecs
CREATE TABLE IF NOT EXISTS `versiones_ecs` (
  `id_version` int NOT NULL AUTO_INCREMENT,
  `id_actividad` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `version_numero` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion_cambio` text COLLATE utf8mb4_unicode_ci,
  `id_usuario_autor` int NOT NULL,
  `fecha_version` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `archivo_ruta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archivo_nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contenido_texto` longtext COLLATE utf8mb4_unicode_ci,
  `commit_sha` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contenido_binario` longblob,
  `contenido_mime` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla db_gestion_cambios.versiones_ecs: ~0 rows (aproximadamente)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
