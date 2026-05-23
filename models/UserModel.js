/**
 * models/UserModel.js — Capa de Acceso a Datos para Usuarios
 * Encapsula consultas SQL relativas a la tabla 'usuarios' y 'roles'
 */

'use strict';

const { query } = require('../config/db');

class UserModel {
  /**
   * Buscar un usuario por correo electrónico, cargando el nombre de su rol
   * @param {string} correo
   * @returns {Promise<Object|null>}
   */
  async findByCorreo(correo) {
    const sql = `
      SELECT u.id_usuario AS id, u.nombre_completo AS nombre, u.correo, u.password_hash,
             r.nombre_rol AS rol, r.id_rol AS id_rol
      FROM   usuarios u
      JOIN   roles r ON u.id_rol = r.id_rol
      WHERE  u.correo = ?
    `;
    const rows = await query(sql, [correo.trim().toLowerCase()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Buscar un usuario por su ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const sql = `
      SELECT u.id_usuario AS id, u.nombre_completo AS nombre, u.correo,
             r.nombre_rol AS rol, r.id_rol AS id_rol
      FROM   usuarios u
      JOIN   roles r ON u.id_rol = r.id_rol
      WHERE  u.id_usuario = ?
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Buscar todos los usuarios
   * @returns {Promise<Array>}
   */
  async findAll() {
    const sql = `
      SELECT u.id_usuario AS id, u.nombre_completo AS nombre, u.correo,
             r.nombre_rol AS rol
      FROM   usuarios u
      JOIN   roles r ON u.id_rol = r.id_rol
      ORDER BY u.nombre_completo ASC
    `;
    return query(sql);
  }

  /**
   * Listar usuarios activos filtrados por ciertos nombres de roles
   * @param {Array<string>} rolesList
   * @returns {Promise<Array>}
   */
  async findActiveByRoles(rolesList) {
    if (!rolesList || rolesList.length === 0) return [];
    
    // Generar marcadores (?, ?, ...) para la cláusula IN
    const placeholders = rolesList.map(() => '?').join(',');
    const sql = `
      SELECT u.id_usuario AS id, u.nombre_completo AS nombre, r.nombre_rol AS rol
      FROM   usuarios u
      JOIN   roles r ON u.id_rol = r.id_rol
      WHERE  r.nombre_rol IN (${placeholders})
      ORDER BY u.nombre_completo ASC
    `;
    return query(sql, rolesList);
  }

  /**
   * Actualizar la contraseña hasheada del usuario
   * @param {number} id
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async updatePasswordHash(id, hash) {
    const sql = `UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?`;
    const result = await query(sql, [hash, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new UserModel();
