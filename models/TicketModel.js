/**
 * models/TicketModel.js — Capa de Acceso a Datos para Solicitudes de Cambio
 * Encapsula consultas SQL relativas a tickets y tablas asociadas (historial, git, qa)
 */

'use strict';

const { query } = require('../config/db');

const BASE_QUERY = `
  SELECT
    sc.id_sc,
    sc.ticket_id          AS id,
    sc.titulo,
    sc.descripcion,
    sc.justificacion_tecnica AS justificacion,
    sc.tipo_cambio        AS tipo,
    sc.impacto            AS prioridad,
    sc.estado_actual      AS estado,
    sc.horas_hombre_estimadas AS estimacionHoras,
    sc.version_tag,
    sc.id_solicitante,
    sc.id_desarrollador   AS asignadoId,
    sc.id_tester          AS testerId,
    sc.fecha_registro     AS fechaCreacion,
    sc.fecha_ultima_modificacion AS fechaActualizacion,
    u_sol.nombre_completo AS solicitanteNombre,
    u_sol.correo          AS solicitanteCorreo,
    u_dev.nombre_completo AS asignadoNombre,
    u_test.nombre_completo AS testerNombre
  FROM  solicitudes_cambio sc
  LEFT JOIN usuarios u_sol  ON sc.id_solicitante    = u_sol.id_usuario
  LEFT JOIN usuarios u_dev  ON sc.id_desarrollador  = u_dev.id_usuario
  LEFT JOIN usuarios u_test ON sc.id_tester         = u_test.id_usuario
`;

class TicketModel {
  /**
   * Buscar todos los tickets con filtros opcionales del lado del servidor
   * @param {Object} filtros 
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    let sql = BASE_QUERY;
    const params = [];
    const conditions = [];

    if (filtros.q && filtros.q.trim()) {
      conditions.push('(sc.ticket_id LIKE ? OR sc.titulo LIKE ? OR sc.descripcion LIKE ?)');
      const qParam = `%${filtros.q.trim()}%`;
      params.push(qParam, qParam, qParam);
    }
    if (filtros.estado) {
      conditions.push('sc.estado_actual = ?');
      params.push(filtros.estado);
    }
    if (filtros.prioridad) {
      conditions.push('sc.impacto = ?');
      params.push(filtros.prioridad);
    }
    if (filtros.tipo) {
      conditions.push('sc.tipo_cambio = ?');
      params.push(filtros.tipo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY sc.fecha_ultima_modificacion DESC';
    return query(sql, params);
  }

  /**
   * Buscar un ticket por su ticket_id
   * @param {string} ticketId 
   * @returns {Promise<Object|null>}
   */
  async findById(ticketId) {
    const sql = BASE_QUERY + ' WHERE sc.ticket_id = ?';
    const rows = await query(sql, [ticketId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Contar la cantidad de registros para generar el correlativo de ticket
   * @returns {Promise<number>}
   */
  async countAll() {
    const sql = 'SELECT COUNT(*) AS cnt FROM solicitudes_cambio';
    const rows = await query(sql);
    return rows[0].cnt || 0;
  }

  /**
   * Insertar un nuevo ticket
   * @param {Object} ticketData 
   * @returns {Promise<Object>}
   */
  async create(ticketData) {
    const { ticketId, titulo, descripcion, justificacion, tipo, prioridad, estimacionHoras, idSolicitante } = ticketData;
    const sql = `
      INSERT INTO solicitudes_cambio
        (ticket_id, titulo, descripcion, justificacion_tecnica, tipo_cambio, impacto, estado_actual, horas_hombre_estimadas, id_solicitante)
      VALUES (?, ?, ?, ?, ?, ?, 'Solicitado', ?, ?)
    `;
    return query(sql, [
      ticketId,
      titulo,
      descripcion,
      justificacion || '',
      tipo,
      prioridad || 'Pendiente',
      parseInt(estimacionHoras) || 0,
      idSolicitante
    ]);
  }

  /**
   * Actualizar el estado de un ticket
   * @param {number} idSc 
   * @param {string} nuevoEstado 
   * @returns {Promise<Object>}
   */
  async updateEstado(idSc, nuevoEstado) {
    const sql = 'UPDATE solicitudes_cambio SET estado_actual = ? WHERE id_sc = ?';
    return query(sql, [nuevoEstado, idSc]);
  }

  /**
   * Asignar desarrollador y tester a un ticket
   * @param {number} idSc 
   * @param {number|null} idDesarrollador 
   * @param {number|null} idTester 
   * @returns {Promise<Object>}
   */
  async updatePersonal(idSc, idDesarrollador, idTester) {
    const sql = 'UPDATE solicitudes_cambio SET id_desarrollador = ?, id_tester = ? WHERE id_sc = ?';
    return query(sql, [idDesarrollador || null, idTester || null, idSc]);
  }

  /**
   * Obtener el historial de estados de un ticket
   * @param {number} idSc 
   * @returns {Promise<Array>}
   */
  async getHistorial(idSc) {
    const sql = 'SELECT * FROM historial_estados WHERE id_sc = ? ORDER BY fecha_cambio ASC';
    return query(sql, [idSc]);
  }

  /**
   * Registrar una nueva transición en el historial de estados
   * @param {Object} histData 
   * @returns {Promise<Object>}
   */
  async addHistorial(histData) {
    const { idSc, estadoAnterior, estadoNuevo, usuarioNombre, usuarioRol, comentario } = histData;
    const sql = `
      INSERT INTO historial_estados (id_sc, estado_anterior, estado_nuevo, usuario_nombre, usuario_rol, comentario)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return query(sql, [
      idSc,
      estadoAnterior,
      estadoNuevo,
      usuarioNombre,
      usuarioRol,
      comentario || null
    ]);
  }

  /**
   * Obtener rutas de archivos afectados (ECS)
   * @param {number} idSc 
   * @returns {Promise<Array<string>>}
   */
  async getEcsAfectados(idSc) {
    const sql = 'SELECT ruta_archivo FROM ecs_afectados WHERE id_sc = ?';
    const rows = await query(sql, [idSc]);
    return rows.map(r => r.ruta_archivo);
  }

  /**
   * Obtener evidencias de Git para un ticket
   * @param {number} idSc 
   * @returns {Promise<Object|null>}
   */
  async getEvidenciaGit(idSc) {
    const sql = 'SELECT * FROM evidencias_git WHERE id_sc = ?';
    const rows = await query(sql, [idSc]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Guardar o actualizar (Upsert) evidencias de Git
   * @param {Object} gitData 
   * @returns {Promise<Object>}
   */
  async saveEvidenciaGit(gitData) {
    const { idSc, nombreRama, urlPullRequest, comentarioTecnico } = gitData;
    const sql = `
      INSERT INTO evidencias_git (id_sc, nombre_rama, url_pull_request, comentario_tecnico)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre_rama = VALUES(nombre_rama),
        url_pull_request = VALUES(url_pull_request),
        comentario_tecnico = VALUES(comentario_tecnico)
    `;
    return query(sql, [idSc, nombreRama, urlPullRequest, comentarioTecnico || '']);
  }

  /**
   * Obtener control de calidad para un ticket
   * @param {number} idSc 
   * @returns {Promise<Object|null>}
   */
  async getControlCalidad(idSc) {
    const sql = 'SELECT * FROM control_calidad WHERE id_sc = ?';
    const rows = await query(sql, [idSc]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Guardar o actualizar (Upsert) resultados de QA/UAT
   * @param {Object} qaData 
   * @returns {Promise<Object>}
   */
  async saveControlCalidad(qaData) {
    const { idSc, qaEstado, qaObservaciones, qaEvidenciaUrl, uatEstado, uatObservaciones } = qaData;
    const sql = `
      INSERT INTO control_calidad (id_sc, qa_estado, qa_observaciones, qa_evidencia_url, uat_estado, uat_observaciones)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        qa_estado = VALUES(qa_estado),
        qa_observaciones = VALUES(qa_observaciones),
        qa_evidencia_url = VALUES(qa_evidencia_url),
        uat_estado = VALUES(uat_estado),
        uat_observaciones = VALUES(uat_observaciones)
    `;
    return query(sql, [
      idSc,
      qaEstado || 'Pendiente',
      qaObservaciones || '',
      qaEvidenciaUrl || '',
      uatEstado || 'Pendiente',
      uatObservaciones || ''
    ]);
  }
}

module.exports = new TicketModel();
