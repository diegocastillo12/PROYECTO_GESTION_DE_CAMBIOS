/**
 * models/VersionEcsModel.js — Capa de Acceso a Datos para Versionado Granular de ECS
 * Gestiona el historial de versiones de secciones de documentos y diagramas
 * vinculados a actividades del cronograma (Elementos de Configuración de Software)
 */

'use strict';

const { query } = require('../config/db');

class VersionEcsModel {

  /**
   * Obtener todas las versiones de una actividad (ECS) específica
   * @param {number} idActividad
   * @returns {Promise<Array>}
   */
  async findByActividad(idActividad) {
    const sql = `
      SELECT
        v.id_version,
        v.id_actividad,
        v.id_proyecto,
        v.version_numero,
        v.descripcion_cambio,
        v.id_usuario_autor,
        v.fecha_version,
        v.archivo_ruta,
        v.archivo_nombre,
        v.contenido_texto,
        v.commit_sha,
        u.nombre_completo AS autor_nombre
      FROM versiones_ecs v
      JOIN usuarios u ON v.id_usuario_autor = u.id_usuario
      WHERE v.id_actividad = ?
      ORDER BY v.fecha_version DESC
    `;
    return query(sql, [idActividad]);
  }

  /**
   * Obtener todas las versiones de un proyecto completo
   * @param {number} idProyecto
   * @returns {Promise<Array>}
   */
  async findByProyecto(idProyecto) {
    const sql = `
      SELECT
        v.id_version,
        v.id_actividad,
        v.id_proyecto,
        v.version_numero,
        v.descripcion_cambio,
        v.id_usuario_autor,
        v.fecha_version,
        v.archivo_ruta,
        v.archivo_nombre,
        v.contenido_texto,
        v.commit_sha,
        u.nombre_completo AS autor_nombre,
        ca.nombre AS actividad_nombre
      FROM versiones_ecs v
      JOIN usuarios u ON v.id_usuario_autor = u.id_usuario
      JOIN cronograma_actividades ca ON v.id_actividad = ca.id_actividad
      WHERE v.id_proyecto = ?
      ORDER BY v.fecha_version DESC
    `;
    return query(sql, [idProyecto]);
  }

  /**
   * Obtener la última versión registrada de una actividad
   * @param {number} idActividad
   * @returns {Promise<string>} - Número de versión (ej: "1.0")
   */
  async getUltimaVersion(idActividad) {
    const sql = `
      SELECT version_numero
      FROM versiones_ecs
      WHERE id_actividad = ?
      ORDER BY fecha_version DESC
      LIMIT 1
    `;
    const rows = await query(sql, [idActividad]);
    return rows.length > 0 ? rows[0].version_numero : '0.0';
  }

  /**
   * Crear una nueva versión de un ECS
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const { idActividad, idProyecto, versionNumero, descripcionCambio, idUsuarioAutor, archivoRuta, archivoNombre, contenidoTexto, commitSha } = data;
    const sql = `
      INSERT INTO versiones_ecs (id_actividad, id_proyecto, version_numero, descripcion_cambio, id_usuario_autor, archivo_ruta, archivo_nombre, contenido_texto, commit_sha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return query(sql, [
      idActividad,
      idProyecto,
      versionNumero,
      descripcionCambio || '',
      idUsuarioAutor,
      archivoRuta || null,
      archivoNombre || null,
      contenidoTexto || null,
      commitSha || null,
    ]);
  }

  /**
   * Contar versiones de una actividad
   * @param {number} idActividad
   * @returns {Promise<number>}
   */
  async countByActividad(idActividad) {
    const sql = 'SELECT COUNT(*) AS cnt FROM versiones_ecs WHERE id_actividad = ?';
    const rows = await query(sql, [idActividad]);
    return rows[0]?.cnt || 0;
  }

  /**
   * Eliminar una versión específica
   * @param {number} idVersion
   * @returns {Promise<Object>}
   */
  async delete(idVersion) {
    return query('DELETE FROM versiones_ecs WHERE id_version = ?', [idVersion]);
  }

  /**
   * Resumen de versionado por proyecto: total de versiones por actividad
   * @param {number} idProyecto
   * @returns {Promise<Array>}
   */
  async getResumenProyecto(idProyecto) {
    const sql = `
      SELECT
        ca.id_actividad,
        ca.nombre AS actividad_nombre,
        u.nombre_completo AS responsable,
        COUNT(v.id_version) AS total_versiones,
        MAX(v.version_numero) AS version_actual,
        MAX(v.fecha_version) AS ultima_actualizacion
      FROM cronograma_actividades ca
      LEFT JOIN versiones_ecs v ON ca.id_actividad = v.id_actividad
      LEFT JOIN usuarios u ON ca.id_usuario = u.id_usuario
      WHERE ca.id_proyecto = ?
      GROUP BY ca.id_actividad, ca.nombre, u.nombre_completo
      ORDER BY ca.fecha_inicio ASC
    `;
    return query(sql, [idProyecto]);
  }
}

module.exports = new VersionEcsModel();
