/**
 * controllers/adminController.js — Panel de Administración
 * Gestión de usuarios, proyectos, equipos y metodologías
 */

'use strict';

const bcrypt = require('bcryptjs');
const UserModel        = require('../models/UserModel');
const ProyectoModel    = require('../models/ProyectoModel');
const MetodologiaModel = require('../models/MetodologiaModel');
const CronogramaModel  = require('../models/CronogramaModel');
const ReporteModel     = require('../models/ReporteModel');
const { ROLES, ROLES_PROYECTO, ESTADOS_PROYECTO, TIPOS_ECM } = require('../config/constants');
const { query } = require('../config/db');
const encryption = require('../services/encryptionService');

const asyncH = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── DASHBOARD ADMIN ──────────────────────────────────────────────────────────
exports.dashboard = asyncH(async (req, res) => {
  const user = req.session.user;
  const proyectos = await ProyectoModel.findAll();
  const statsGlobales = await ProyectoModel.getStatsGlobales();
  const usuarios = await UserModel.findAll();
  const metodologias = await MetodologiaModel.findAll();

  // Agregar avance a cada proyecto
  for (const p of proyectos) {
    const avance = await ProyectoModel.getAvancePromedio(p.id_proyecto);
    p.promedio_avance = parseFloat(avance.promedio_avance || 0).toFixed(1);
    p.total_actividades = avance.total_actividades || 0;
  }

  // Obtener estadísticas de tickets (solicitudes de cambio) por estado
  const ticketStats = await query(
    `SELECT estado_actual AS estado, COUNT(*) AS cantidad 
     FROM solicitudes_cambio 
     GROUP BY estado_actual`
  );

  res.render('admin/dashboard', {
    user,
    roles: ROLES,
    proyectos,
    statsGlobales,
    usuarios,
    metodologias,
    ticketStats,
    title: 'Panel de Administración',
  });
});

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
exports.listarUsuarios = asyncH(async (req, res) => {
  const user = req.session.user;
  const usuarios = await UserModel.findAll();
  const rolesDisponibles = await query('SELECT * FROM roles ORDER BY nombre_rol ASC');

  res.render('admin/usuarios', {
    user,
    roles: ROLES,
    usuarios,
    rolesDisponibles,
    mensaje: req.query.ok ? 'Operación realizada correctamente.' : null,
    title: 'Gestión de Usuarios',
  });
});

exports.crearUsuario = asyncH(async (req, res) => {
  const { nombre_completo, correo, password, id_rol } = req.body;
  if (!nombre_completo || !correo || !password || !id_rol) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  await query(
    'INSERT INTO usuarios (nombre_completo, correo, password_hash, id_rol) VALUES (?, ?, ?, ?)',
    [nombre_completo, correo.trim().toLowerCase(), hash, parseInt(id_rol)]
  );
  return res.json({ success: true });
});

exports.editarUsuario = asyncH(async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo, password, id_rol } = req.body;
  if (!nombre_completo || !correo || !id_rol) {
    return res.status(400).json({ success: false, error: 'Campos requeridos faltantes.' });
  }
  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await query(
      'UPDATE usuarios SET nombre_completo = ?, correo = ?, password_hash = ?, id_rol = ? WHERE id_usuario = ?',
      [nombre_completo, correo.trim().toLowerCase(), hash, parseInt(id_rol), id]
    );
  } else {
    await query(
      'UPDATE usuarios SET nombre_completo = ?, correo = ?, id_rol = ? WHERE id_usuario = ?',
      [nombre_completo, correo.trim().toLowerCase(), parseInt(id_rol), id]
    );
  }
  return res.json({ success: true });
});

exports.eliminarUsuario = asyncH(async (req, res) => {
  const { id } = req.params;
  const currentUser = req.session.user;
  if (parseInt(id) === currentUser.id) {
    return res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario.' });
  }
  await query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  return res.json({ success: true });
});

// ─── PROYECTOS ────────────────────────────────────────────────────────────────
exports.listarProyectos = asyncH(async (req, res) => {
  const user = req.session.user;
  const proyectos = await ProyectoModel.findAll(req.query);
  const metodologias = await MetodologiaModel.findAll();

  for (const p of proyectos) {
    const avance = await ProyectoModel.getAvancePromedio(p.id_proyecto);
    p.promedio_avance = parseFloat(avance.promedio_avance || 0).toFixed(1);
    p.total_actividades = avance.total_actividades;
  }

  res.render('admin/proyectos', {
    user,
    roles: ROLES,
    proyectos,
    metodologias,
    estadosProyecto: ESTADOS_PROYECTO,
    filtros: req.query || {},
    title: 'Gestión de Proyectos',
  });
});

exports.mostrarNuevoProyecto = asyncH(async (req, res) => {
  const user = req.session.user;
  const metodologias = await MetodologiaModel.findAll();
  res.render('admin/proyecto-form', {
    user,
    roles: ROLES,
    metodologias,
    estadosProyecto: ESTADOS_PROYECTO,
    proyecto: null,
    title: 'Nuevo Proyecto',
  });
});

exports.mostrarEditarFormProyecto = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;
  const proyecto = await ProyectoModel.findById(id);
  if (!proyecto) {
    return res.status(404).render('error', { title: '404', message: 'Proyecto no encontrado.', user, roles: ROLES });
  }

  // Bloquear edición si el cronograma ya tiene actividades
  const resumen = await CronogramaModel.getResumen(id);
  if (resumen.total > 0) {
    return res.redirect(`/admin/proyectos/${id}/config?error=cronograma`);
  }

  const metodologias = await MetodologiaModel.findAll();
  res.render('admin/proyecto-form', {
    user,
    roles: ROLES,
    metodologias,
    estadosProyecto: ESTADOS_PROYECTO,
    proyecto,
    title: `Editar: ${proyecto.nombre}`,
  });
});

exports.crearProyecto = asyncH(async (req, res) => {
  const user = req.session.user;
  const { nombre, descripcion, estado, fecha_inicio, fecha_fin, id_metodologia, github_repo, auto_crear_repo } = req.body;
  if (!nombre) return res.status(400).json({ success: false, error: 'El nombre es requerido.' });

  let finalRepo = github_repo ? github_repo.trim() : null;

  if (auto_crear_repo === 'true') {
    // 1. Obtener token del usuario administrador
    const rows = await query('SELECT github_token FROM usuarios WHERE id_usuario = ?', [user.id]);
    if (rows.length === 0 || !rows[0].github_token) {
      return res.status(400).json({ success: false, error: 'No tienes un token de GitHub configurado. Conéctalo desde el menú lateral.' });
    }

    const decryptedToken = encryption.decrypt(rows[0].github_token);
    if (!decryptedToken) {
      return res.status(400).json({ success: false, error: 'Error al descifrar tu token de GitHub.' });
    }

    try {
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: decryptedToken });

      // Slugificar el nombre para el repositorio
      const repoName = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const repoResponse = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: descripcion || `Proyecto: ${nombre}`,
        private: false,
        auto_init: true,
      });

      finalRepo = repoResponse.data.full_name;
    } catch (err) {
      return res.status(500).json({ success: false, error: `Error al crear repositorio en GitHub: ${err.message}` });
    }
  }

  const result = await ProyectoModel.create({
    nombre, descripcion, estado, fechaInicio: fecha_inicio, fechaFin: fecha_fin,
    idAdmin: user.id, idMetodologia: id_metodologia || null, githubRepo: finalRepo
  });
  const idProyecto = result.insertId;
  return res.json({ success: true, id_proyecto: idProyecto });
});

exports.mostrarEditarProyecto = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;
  const proyecto = await ProyectoModel.findById(id);
  if (!proyecto) return res.status(404).render('error', { title: '404', message: 'Proyecto no encontrado.', user, roles: ROLES });

  const metodologias = await MetodologiaModel.findAll();
  const equipo = await ProyectoModel.getEquipo(id);
  const clientes = await ProyectoModel.getClientes(id);
  const todosUsuarios = await UserModel.findAll();
  const cronograma = await CronogramaModel.findByProyecto(id);
  const resumenCronograma = await CronogramaModel.getResumen(id);

  // Árbol de metodología si existe
  let arbolMetodologia = null;
  if (proyecto.id_metodologia) {
    arbolMetodologia = await MetodologiaModel.getArbolCompleto(proyecto.id_metodologia);
  }

  // Tickets del proyecto para vincular como entregables
  const ticketsProyecto = await query(
    'SELECT id_sc, ticket_id, titulo, estado_actual FROM solicitudes_cambio WHERE id_proyecto = ? ORDER BY fecha_registro DESC',
    [id]
  );

  const reportes = await ReporteModel.findByProyecto(id, 20);
  const ranking = await ReporteModel.getRanking(id);

  res.render('admin/proyecto-config', {
    user,
    roles: ROLES,
    rolesProyecto: ROLES_PROYECTO,
    proyecto,
    metodologias,
    equipo,
    clientes,
    todosUsuarios,
    cronograma,
    resumenCronograma,
    arbolMetodologia,
    ticketsProyecto,
    reportes,
    ranking,
    estadosProyecto: ESTADOS_PROYECTO,
    tiposEcm: TIPOS_ECM,
    title: `Config: ${proyecto.nombre}`,
  });
});

exports.actualizarProyecto = asyncH(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, estado, fecha_inicio, fecha_fin, id_metodologia, github_repo } = req.body;

  // No permitir editar si ya hay actividades en el cronograma
  const resumen = await CronogramaModel.getResumen(id);
  if (resumen.total > 0) {
    return res.status(400).json({
      success: false,
      error: 'No se puede editar el proyecto porque el cronograma ya tiene actividades definidas. Elimina las actividades primero.',
    });
  }

  await ProyectoModel.update(id, {
    nombre,
    descripcion,
    estado,
    fechaInicio: fecha_inicio,
    fechaFin: fecha_fin,
    idMetodologia: id_metodologia || null,
    githubRepo: github_repo ? github_repo.trim() : null
  });
  return res.json({ success: true });
});

exports.eliminarProyecto = asyncH(async (req, res) => {
  const { id } = req.params;
  await ProyectoModel.delete(id);
  return res.json({ success: true });
});

// ─── EQUIPO ───────────────────────────────────────────────────────────────────
exports.asignarMiembro = asyncH(async (req, res) => {
  const { id } = req.params;
  const { id_usuario, rol_en_proyecto } = req.body;
  if (!id_usuario || !rol_en_proyecto) return res.status(400).json({ success: false, error: 'Datos incompletos.' });
  await ProyectoModel.addMiembro(id, id_usuario, rol_en_proyecto);
  const equipo = await ProyectoModel.getEquipo(id);
  return res.json({ success: true, equipo });
});

exports.quitarMiembro = asyncH(async (req, res) => {
  const { id, uid } = req.params;
  await ProyectoModel.removeMiembro(id, uid);
  return res.json({ success: true });
});

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
exports.asignarCliente = asyncH(async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  if (!id_usuario) return res.status(400).json({ success: false, error: 'ID de usuario requerido.' });
  await ProyectoModel.addCliente(id, id_usuario);
  const clientes = await ProyectoModel.getClientes(id);
  return res.json({ success: true, clientes });
});

exports.quitarCliente = asyncH(async (req, res) => {
  const { id, uid } = req.params;
  await ProyectoModel.removeCliente(id, uid);
  return res.json({ success: true });
});

// ─── METODOLOGÍAS ─────────────────────────────────────────────────────────────
exports.listarMetodologias = asyncH(async (req, res) => {
  const user = req.session.user;
  const metodologias = await MetodologiaModel.findAll();

  // Cargar árbol completo para cada metodología
  const arboles = [];
  for (const m of metodologias) {
    arboles.push(await MetodologiaModel.getArbolCompleto(m.id_metodologia));
  }

  res.render('admin/metodologias', {
    user,
    roles: ROLES,
    metodologias: arboles,
    tiposEcm: TIPOS_ECM,
    title: 'Gestión de Metodologías',
  });
});

exports.crearMetodologia = asyncH(async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido.' });
  const result = await MetodologiaModel.create({ nombre, descripcion });
  return res.json({ success: true, id_metodologia: result.insertId, nombre });
});

exports.actualizarMetodologia = asyncH(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  await MetodologiaModel.update(id, { nombre, descripcion });
  return res.json({ success: true });
});

exports.eliminarMetodologia = asyncH(async (req, res) => {
  const { id } = req.params;
  await MetodologiaModel.delete(id);
  return res.json({ success: true });
});

// Etapas
exports.crearEtapa = asyncH(async (req, res) => {
  const { id } = req.params; // id_metodologia
  const { nombre, descripcion, orden } = req.body;
  const result = await MetodologiaModel.createEtapa({ idMetodologia: id, nombre, descripcion, orden });
  return res.json({ success: true, id_etapa: result.insertId });
});

exports.eliminarEtapa = asyncH(async (req, res) => {
  const { id } = req.params;
  await MetodologiaModel.deleteEtapa(id);
  return res.json({ success: true });
});

// Fases
exports.crearFase = asyncH(async (req, res) => {
  const { id } = req.params; // id_etapa
  const { nombre, descripcion, orden } = req.body;
  const result = await MetodologiaModel.createFase({ idEtapa: id, nombre, descripcion, orden });
  return res.json({ success: true, id_fase: result.insertId });
});

exports.eliminarFase = asyncH(async (req, res) => {
  const { id } = req.params;
  await MetodologiaModel.deleteFase(id);
  return res.json({ success: true });
});

// ECM
exports.crearECM = asyncH(async (req, res) => {
  const { id } = req.params; // id_fase
  const { nombre, tipo, descripcion } = req.body;
  const result = await MetodologiaModel.createECM({ idFase: id, nombre, tipo, descripcion });
  return res.json({ success: true, id_ecm: result.insertId });
});

exports.eliminarECM = asyncH(async (req, res) => {
  const { id } = req.params;
  await MetodologiaModel.deleteECM(id);
  return res.json({ success: true });
});
