/**
 * models/CronogramaModel.js — Capa de Acceso a Datos para Cronograma de Actividades
 * Gestiona actividades del cronograma de proyectos
 */

'use strict';

const { query } = require('../config/db');

const BASE_ACTIVIDAD = `
  SELECT
    ca.id_actividad,
    ca.id_proyecto,
    ca.id_fase,
    ca.id_usuario,
    ca.nombre,
    ca.descripcion,
    ca.fecha_inicio,
    ca.fecha_fin,
    ca.es_reportable,
    ca.id_entregable,
    ca.porcentaje_avance,
    ca.estado,
    f.nombre AS fase_nombre,
    e.nombre AS etapa_nombre,
    sc.ticket_id AS entregable_ticket_id,
    sc.titulo AS entregable_titulo,
    sc.estado_actual AS entregable_estado,
    u.nombre_completo AS asignado_nombre
  FROM cronograma_actividades ca
  LEFT JOIN fases f ON ca.id_fase = f.id_fase
  LEFT JOIN etapas e ON f.id_etapa = e.id_etapa
  LEFT JOIN solicitudes_cambio sc ON ca.id_entregable = sc.id_sc
  LEFT JOIN usuarios u ON ca.id_usuario = u.id_usuario
`;

class CronogramaModel {

  /** Obtener actividades de un proyecto */
  async findByProyecto(idProyecto) {
    const sql = BASE_ACTIVIDAD + ' WHERE ca.id_proyecto = ? ORDER BY ca.fecha_inicio ASC, ca.id_actividad ASC';
    return query(sql, [idProyecto]);
  }

  /** Obtener actividad por ID */
  async findById(idActividad) {
    const sql = BASE_ACTIVIDAD + ' WHERE ca.id_actividad = ?';
    const rows = await query(sql, [idActividad]);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Crear actividad en el cronograma */
  async create(data) {
    const { idProyecto, idFase, idUsuario, nombre, descripcion, fechaInicio, fechaFin, esReportable, idEntregable, porcentaje_avance, estado } = data;
    
    let pct = parseFloat(porcentaje_avance);
    if (isNaN(pct)) pct = 0;

    let DB_estado = estado || 'Pendiente';
    if (DB_estado === 'Completada') DB_estado = 'Completado';
    
    if (pct === 100) DB_estado = 'Completado';
    else if (pct > 0 && DB_estado === 'Pendiente') DB_estado = 'En Progreso';

    const sql = `
      INSERT INTO cronograma_actividades
        (id_proyecto, id_fase, id_usuario, nombre, descripcion, fecha_inicio, fecha_fin, es_reportable, id_entregable, porcentaje_avance, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return query(sql, [
      idProyecto,
      idFase || null,
      idUsuario || null,
      nombre,
      descripcion || '',
      fechaInicio,
      fechaFin,
      esReportable !== undefined ? (esReportable ? 1 : 0) : 1,
      idEntregable || null,
      pct,
      DB_estado
    ]);
  }

  /** Actualizar actividad */
  async update(idActividad, data) {
    const { idFase, idUsuario, nombre, descripcion, fechaInicio, fechaFin, esReportable, idEntregable, estado, porcentaje_avance } = data;
    
    let DB_estado = estado || 'Pendiente';
    if (DB_estado === 'Completada') DB_estado = 'Completado';

    let pct = parseFloat(porcentaje_avance);
    if (isNaN(pct)) {
      pct = DB_estado === 'Completado' ? 100 : (DB_estado === 'En Progreso' ? 50 : 0);
    } else {
      pct = Math.min(100, Math.max(0, pct));
      // Sincronizar estado si el admin cambió el porcentaje pero no el estado
      if (pct === 100) DB_estado = 'Completado';
      else if (pct > 0 && DB_estado === 'Pendiente') DB_estado = 'En Progreso';
      else if (pct === 0 && DB_estado === 'En Progreso') DB_estado = 'Pendiente';
    }

    const sql = `
      UPDATE cronograma_actividades
      SET id_fase = ?, id_usuario = ?, nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?,
          es_reportable = ?, id_entregable = ?, estado = ?, porcentaje_avance = ?
      WHERE id_actividad = ?
    `;
    return query(sql, [
      idFase || null,
      idUsuario || null,
      nombre,
      descripcion || '',
      fechaInicio,
      fechaFin,
      esReportable !== undefined ? (esReportable ? 1 : 0) : 1,
      idEntregable || null,
      DB_estado,
      pct,
      idActividad,
    ]);
  }

  /** Actualizar porcentaje de avance de una actividad */
  async updateAvance(idActividad, porcentaje) {
    const pct = Math.min(100, Math.max(0, parseFloat(porcentaje) || 0));
    // Actualizar estado automáticamente según el %
    let estado = 'Pendiente';
    if (pct > 0 && pct < 100) estado = 'En Progreso';
    else if (pct >= 100) estado = 'Completado';

    return query(
      'UPDATE cronograma_actividades SET porcentaje_avance = ?, estado = ? WHERE id_actividad = ?',
      [pct, estado, idActividad]
    );
  }

  /** Eliminar actividad */
  async delete(idActividad) {
    return query('DELETE FROM cronograma_actividades WHERE id_actividad = ?', [idActividad]);
  }

  /** Resumen del cronograma: total actividades, promedio avance, completadas */
  async getResumen(idProyecto) {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COALESCE(AVG(porcentaje_avance), 0) AS promedio,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN estado = 'En Progreso' THEN 1 ELSE 0 END) AS en_progreso,
        SUM(CASE WHEN estado = 'Bloqueado' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM cronograma_actividades
      WHERE id_proyecto = ?
    `;
    const rows = await query(sql, [idProyecto]);
    return rows[0] || { total: 0, promedio: 0, completadas: 0, en_progreso: 0, bloqueadas: 0, pendientes: 0 };
  }

  /** Sincronizar el avance de la actividad vinculada a un ticket */
  async syncAvanceConTicket(idSc, nuevoEstado, idUsuarioCambio, idProyecto) {
    const mapped = {
      'Solicitado':                { pct: 0,   estado: 'Pendiente' },
      'En Análisis':              { pct: 10,  estado: 'En Progreso' },
      'Pendiente de Aprobación':  { pct: 20,  estado: 'En Progreso' },
      'Aprobado':                  { pct: 30,  estado: 'En Progreso' },
      'En Desarrollo':             { pct: 50,  estado: 'En Progreso' },
      'En Pruebas QA':             { pct: 70,  estado: 'En Progreso' },
      'En Pruebas UAT':            { pct: 80,  estado: 'En Progreso' },
      'Listo para Integración':  { pct: 90,  estado: 'En Progreso' },
      'Liberado':                  { pct: 100, estado: 'Completado' },
      'Rechazado':                 { pct: 0,   estado: 'Bloqueado' },
      'Descartado':                { pct: 0,   estado: 'Pendiente' }
    }[nuevoEstado];

    if (!mapped) return null;

    // Buscar actividad vinculada al ticket — incluir id_usuario asignado
    const rows = await query(
      'SELECT id_actividad, id_usuario FROM cronograma_actividades WHERE id_entregable = ?',
      [idSc]
    );

    let idActividad;
    let idResponsable;

    if (rows.length === 0) {
      // Auto-crear una actividad vinculada al ticket si no existe
      // 1. Obtener información del proyecto
      const projectRows = await query(
        'SELECT fecha_inicio, fecha_fin, id_metodologia FROM proyectos WHERE id_proyecto = ?',
        [idProyecto]
      );
      // 2. Obtener información del ticket
      const ticketRows = await query(
        'SELECT titulo, descripcion, id_desarrollador, ticket_id FROM solicitudes_cambio WHERE id_sc = ?',
        [idSc]
      );

      if (ticketRows.length === 0) return null;

      const ticket = ticketRows[0];
      const project = projectRows[0] || {};

      // 3. Buscar la primera fase de la metodología asociada, si existe
      let idFase = null;
      if (project.id_metodologia) {
        const phases = await query(
          `SELECT f.id_fase 
           FROM etapas e 
           JOIN fases f ON f.id_etapa = e.id_etapa 
           WHERE e.id_metodologia = ? 
           ORDER BY e.id_etapa ASC, f.id_fase ASC LIMIT 1`,
          [project.id_metodologia]
        );
        if (phases.length > 0) {
          idFase = phases[0].id_fase;
        }
      }

      // 4. Fechas por defecto
      const fechaInicio = project.fecha_inicio || new Date();
      const fechaFin = project.fecha_fin || new Date();

      idResponsable = ticket.id_desarrollador || null;

      // 5. Insertar actividad
      const insertRes = await query(
        `INSERT INTO cronograma_actividades
          (id_proyecto, id_fase, id_usuario, nombre, descripcion, fecha_inicio, fecha_fin, es_reportable, id_entregable, porcentaje_avance, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          idProyecto,
          idFase,
          idResponsable,
          `${ticket.ticket_id}: ${ticket.titulo}`,
          ticket.descripcion || '',
          fechaInicio,
          fechaFin,
          idSc,
          mapped.pct,
          mapped.estado
        ]
      );
      idActividad = insertRes.insertId;
    } else {
      idActividad = rows[0].id_actividad;
      idResponsable = rows[0].id_usuario;

      // Actualizar avance de la actividad existente
      await query(
        'UPDATE cronograma_actividades SET porcentaje_avance = ?, estado = ? WHERE id_actividad = ?',
        [mapped.pct, mapped.estado, idActividad]
      );
    }

    // El reporte se registra a nombre del RESPONSABLE asignado (no de quien cambió el ticket)
    // Si la actividad no tiene responsable, usar quien hizo el cambio
    const idReportante = idResponsable || idUsuarioCambio;

    const sqlReport = `
      INSERT INTO reportes_avance (id_actividad, id_proyecto, id_usuario_reporta, porcentaje, comentario)
      VALUES (?, ?, ?, ?, ?)
    `;
    await query(sqlReport, [
      idActividad,
      idProyecto,
      idReportante,
      mapped.pct,
      `Avance automático: ticket pasó a "${nuevoEstado}".`
    ]);

    return { idActividad, ...mapped };
  }
}

module.exports = new CronogramaModel();
