/**
 * models/ReporteModel.js — Capa de Acceso a Datos para Reportes de Avance
 * Gestiona reportes de progreso y ranking por proyecto
 */

'use strict';

const { query } = require('../config/db');

class ReporteModel {

  /** Reportes de avance de un proyecto, paginados o todos */
  async findByProyecto(idProyecto, limit = 50) {
    const safeLimit = parseInt(limit, 10) || 50;
    const sql = `
      SELECT
        ra.id_reporte,
        ra.id_actividad,
        ra.id_proyecto,
        ra.id_usuario_reporta,
        ra.porcentaje,
        ra.comentario,
        ra.fecha_reporte,
        ra.visto_por_cliente,
        u.nombre_completo AS reportado_por,
        pe.rol_en_proyecto,
        ca.nombre AS actividad_nombre
      FROM reportes_avance ra
      JOIN usuarios u ON ra.id_usuario_reporta = u.id_usuario
      LEFT JOIN proyecto_equipo pe ON (ra.id_usuario_reporta = pe.id_usuario AND ra.id_proyecto = pe.id_proyecto)
      JOIN cronograma_actividades ca ON ra.id_actividad = ca.id_actividad
      WHERE ra.id_proyecto = ?
      ORDER BY ra.fecha_reporte DESC
      LIMIT ${safeLimit}
    `;
    return query(sql, [idProyecto]);
  }

  /** Historial de reportes de una actividad específica */
  async findByActividad(idActividad) {
    const sql = `
      SELECT
        ra.*,
        u.nombre_completo AS reportado_por,
        pe.rol_en_proyecto
      FROM reportes_avance ra
      JOIN usuarios u ON ra.id_usuario_reporta = u.id_usuario
      LEFT JOIN proyecto_equipo pe ON (ra.id_usuario_reporta = pe.id_usuario AND ra.id_proyecto = pe.id_proyecto)
      WHERE ra.id_actividad = ?
      ORDER BY ra.fecha_reporte ASC
    `;
    return query(sql, [idActividad]);
  }

  /** Crear un reporte de avance */
  async create(data) {
    const { idActividad, idProyecto, idUsuarioReporta, porcentaje, comentario } = data;
    const sql = `
      INSERT INTO reportes_avance (id_actividad, id_proyecto, id_usuario_reporta, porcentaje, comentario)
      VALUES (?, ?, ?, ?, ?)
    `;
    return query(sql, [idActividad, idProyecto, idUsuarioReporta, parseFloat(porcentaje), comentario || null]);
  }

  /** Marcar reportes como vistos por el cliente */
  async marcarVisto(idReporte) {
    return query('UPDATE reportes_avance SET visto_por_cliente = 1 WHERE id_reporte = ?', [idReporte]);
  }

  /** Marcar todos los reportes de un proyecto como vistos */
  async marcarTodosVistos(idProyecto) {
    return query('UPDATE reportes_avance SET visto_por_cliente = 1 WHERE id_proyecto = ?', [idProyecto]);
  }

  /** Cantidad de reportes no vistos por cliente */
  async countNoVistos(idProyecto) {
    const sql = 'SELECT COUNT(*) AS cnt FROM reportes_avance WHERE id_proyecto = ? AND visto_por_cliente = 0';
    const rows = await query(sql, [idProyecto]);
    return rows[0]?.cnt || 0;
  }

  /**
   * Ranking de miembros del equipo por actividad reportada en un proyecto
   * Ordena por último % reportado (mayor primero) y total de reportes
   * Incluye detección de tareas atrasadas (fecha_fin < hoy y no completadas)
   */
  async getRanking(idProyecto) {
    const sql = `
      SELECT
        u.id_usuario,
        u.nombre_completo AS nombre,
        pe.rol_en_proyecto AS rol,
        COUNT(DISTINCT ra.id_reporte) AS total_reportes,
        COALESCE(AVG(ca.porcentaje_avance), 0) AS promedio_avance,
        MAX(ra.fecha_reporte) AS ultimo_reporte,
        SUM(CASE WHEN ca.fecha_fin < CURDATE() AND ca.estado != 'Completado' THEN 1 ELSE 0 END) AS tareas_atrasadas,
        COUNT(DISTINCT ca.id_actividad) AS total_tareas
      FROM proyecto_equipo pe
      JOIN usuarios u ON pe.id_usuario = u.id_usuario
      LEFT JOIN reportes_avance ra ON (ra.id_usuario_reporta = pe.id_usuario AND ra.id_proyecto = pe.id_proyecto)
      LEFT JOIN cronograma_actividades ca ON (ca.id_usuario = pe.id_usuario AND ca.id_proyecto = pe.id_proyecto)
      WHERE pe.id_proyecto = ?
      GROUP BY pe.id_usuario, u.nombre_completo, pe.rol_en_proyecto
      ORDER BY promedio_avance DESC, total_reportes DESC, u.nombre_completo ASC
    `;
    return query(sql, [idProyecto]);
  }

  /** Promedio general de avance de un proyecto (basado en actividades) */
  async getPromedioProyecto(idProyecto) {
    const sql = `
      SELECT COALESCE(AVG(porcentaje_avance), 0) AS promedio
      FROM cronograma_actividades
      WHERE id_proyecto = ?
    `;
    const rows = await query(sql, [idProyecto]);
    return parseFloat(rows[0]?.promedio || 0).toFixed(1);
  }

  /** Informe de estado: avance por actividad con su último reporte */
  async getInformeEstado(idProyecto) {
    const sql = `
      SELECT
        ca.id_actividad,
        ca.nombre AS actividad,
        ca.fecha_inicio,
        ca.fecha_fin,
        ca.porcentaje_avance,
        ca.estado,
        ca.es_reportable,
        r_last.reportado_por,
        r_last.comentario AS ultimo_comentario,
        r_last.fecha_reporte AS fecha_ultimo_reporte
      FROM cronograma_actividades ca
      LEFT JOIN (
        SELECT ra2.id_actividad,
               u2.nombre_completo AS reportado_por,
               ra2.comentario,
               ra2.fecha_reporte
        FROM reportes_avance ra2
        JOIN usuarios u2 ON ra2.id_usuario_reporta = u2.id_usuario
        WHERE ra2.id_proyecto = ?
          AND ra2.fecha_reporte = (
            SELECT MAX(ra3.fecha_reporte)
            FROM reportes_avance ra3
            WHERE ra3.id_actividad = ra2.id_actividad
          )
      ) r_last ON ca.id_actividad = r_last.id_actividad
      WHERE ca.id_proyecto = ?
      ORDER BY ca.fecha_inicio ASC
    `;
    return query(sql, [idProyecto, idProyecto]);
  }
}

module.exports = new ReporteModel();
