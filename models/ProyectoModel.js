/**
 * models/ProyectoModel.js — Capa de Acceso a Datos para Proyectos
 * Gestiona proyectos, equipo por proyecto, clientes asignados
 */

'use strict';

const { query } = require('../config/db');

const BASE_PROYECTO = `
  SELECT
    p.id_proyecto,
    p.nombre,
    p.descripcion,
    p.estado,
    p.fecha_inicio,
    p.fecha_fin,
    p.id_admin,
    p.id_metodologia,
    p.fecha_creacion,
    p.github_repo,
    u.nombre_completo AS admin_nombre,
    m.nombre AS metodologia_nombre
  FROM proyectos p
  LEFT JOIN usuarios u ON p.id_admin = u.id_usuario
  LEFT JOIN metodologias m ON p.id_metodologia = m.id_metodologia
`;

class ProyectoModel {

  /** Todos los proyectos (Admin) con filtros opcionales */
  async findAll(filtros = {}) {
    let sql = BASE_PROYECTO;
    const params = [];
    const conditions = [];

    if (filtros.estado) {
      conditions.push('p.estado = ?');
      params.push(filtros.estado);
    }
    if (filtros.q && filtros.q.trim()) {
      conditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
      const qp = `%${filtros.q.trim()}%`;
      params.push(qp, qp);
    }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY p.fecha_creacion DESC';
    return query(sql, params);
  }

  /** Proyectos donde el usuario es cliente (Solicitante) */
  async findByCliente(idUsuario) {
    const sql = BASE_PROYECTO + `
      JOIN proyecto_clientes pc ON p.id_proyecto = pc.id_proyecto
      WHERE pc.id_usuario = ?
      ORDER BY p.fecha_creacion DESC
    `;
    return query(sql, [idUsuario]);
  }

  /** Proyectos donde el usuario es miembro del equipo */
  async findByMiembro(idUsuario) {
    const sql = `
      SELECT
        p.id_proyecto,
        p.nombre,
        p.descripcion,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        p.id_admin,
        p.id_metodologia,
        p.fecha_creacion,
        p.github_repo,
        u.nombre_completo AS admin_nombre,
        m.nombre AS metodologia_nombre,
        pe.rol_en_proyecto
      FROM proyectos p
      LEFT JOIN usuarios u ON p.id_admin = u.id_usuario
      LEFT JOIN metodologias m ON p.id_metodologia = m.id_metodologia
      JOIN proyecto_equipo pe ON p.id_proyecto = pe.id_proyecto
      WHERE pe.id_usuario = ?
      ORDER BY p.fecha_creacion DESC
    `;
    return query(sql, [idUsuario]);
  }

  /** Detalle de un proyecto por ID */
  async findById(idProyecto) {
    const sql = BASE_PROYECTO + ' WHERE p.id_proyecto = ?';
    const rows = await query(sql, [idProyecto]);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Crear un nuevo proyecto */
  async create(data) {
    const { nombre, descripcion, estado, fechaInicio, fechaFin, idAdmin, idMetodologia, githubRepo } = data;
    const sql = `
      INSERT INTO proyectos (nombre, descripcion, estado, fecha_inicio, fecha_fin, id_admin, id_metodologia, github_repo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return query(sql, [nombre, descripcion || '', estado || 'Activo', fechaInicio || null, fechaFin || null, idAdmin, idMetodologia || null, githubRepo || null]);
  }

  /** Actualizar un proyecto */
  async update(idProyecto, data) {
    const { nombre, descripcion, estado, fechaInicio, fechaFin, idMetodologia, githubRepo } = data;
    const sql = `
      UPDATE proyectos
      SET nombre = ?, descripcion = ?, estado = ?, fecha_inicio = ?, fecha_fin = ?, id_metodologia = ?, github_repo = ?
      WHERE id_proyecto = ?
    `;
    return query(sql, [nombre, descripcion || '', estado, fechaInicio || null, fechaFin || null, idMetodologia || null, githubRepo || null, idProyecto]);
  }

  /** Eliminar un proyecto */
  async delete(idProyecto) {
    return query('DELETE FROM proyectos WHERE id_proyecto = ?', [idProyecto]);
  }

  // ─── EQUIPO ───────────────────────────────────────────────────────────────────

  /** Obtener equipo de un proyecto con sus roles en el proyecto */
  async getEquipo(idProyecto) {
    const sql = `
      SELECT pe.id, pe.id_usuario, pe.rol_en_proyecto, pe.fecha_asignacion,
             u.nombre_completo AS nombre, u.correo,
             r.nombre_rol AS rol_global
      FROM proyecto_equipo pe
      JOIN usuarios u ON pe.id_usuario = u.id_usuario
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE pe.id_proyecto = ?
      ORDER BY u.nombre_completo ASC
    `;
    return query(sql, [idProyecto]);
  }

  /** Agregar miembro al equipo */
  async addMiembro(idProyecto, idUsuario, rolEnProyecto) {
    const sql = `
      INSERT INTO proyecto_equipo (id_proyecto, id_usuario, rol_en_proyecto)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rol_en_proyecto = VALUES(rol_en_proyecto)
    `;
    return query(sql, [idProyecto, idUsuario, rolEnProyecto]);
  }

  /** Remover miembro del equipo */
  async removeMiembro(idProyecto, idUsuario) {
    return query('DELETE FROM proyecto_equipo WHERE id_proyecto = ? AND id_usuario = ?', [idProyecto, idUsuario]);
  }

  // ─── CLIENTES ─────────────────────────────────────────────────────────────────

  /** Obtener clientes (Solicitantes) de un proyecto */
  async getClientes(idProyecto) {
    const sql = `
      SELECT pc.id, pc.id_usuario, pc.fecha_asignacion,
             u.nombre_completo AS nombre, u.correo
      FROM proyecto_clientes pc
      JOIN usuarios u ON pc.id_usuario = u.id_usuario
      WHERE pc.id_proyecto = ?
      ORDER BY u.nombre_completo ASC
    `;
    return query(sql, [idProyecto]);
  }

  /** Asignar cliente a proyecto */
  async addCliente(idProyecto, idUsuario) {
    const sql = `
      INSERT IGNORE INTO proyecto_clientes (id_proyecto, id_usuario)
      VALUES (?, ?)
    `;
    return query(sql, [idProyecto, idUsuario]);
  }

  /** Quitar cliente de proyecto */
  async removeCliente(idProyecto, idUsuario) {
    return query('DELETE FROM proyecto_clientes WHERE id_proyecto = ? AND id_usuario = ?', [idProyecto, idUsuario]);
  }

  /** Calcular porcentaje de avance promedio de un proyecto basado en actividades */
  async getAvancePromedio(idProyecto) {
    const sql = `
      SELECT
        COUNT(*) AS total_actividades,
        COALESCE(AVG(porcentaje_avance), 0) AS promedio_avance,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) AS completadas
      FROM cronograma_actividades
      WHERE id_proyecto = ?
    `;
    const rows = await query(sql, [idProyecto]);
    return rows[0] || { total_actividades: 0, promedio_avance: 0, completadas: 0 };
  }

  /** Stats globales para el admin dashboard */
  async getStatsGlobales() {
    const sql = `
      SELECT
        COUNT(*) AS total_proyectos,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN estado = 'Cerrado' THEN 1 ELSE 0 END) AS cerrados,
        SUM(CASE WHEN estado = 'Pausado' THEN 1 ELSE 0 END) AS pausados
      FROM proyectos
    `;
    const rows = await query(sql);
    return rows[0] || {};
  }
}

module.exports = new ProyectoModel();
