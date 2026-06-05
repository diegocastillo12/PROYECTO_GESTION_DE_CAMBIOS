/**
 * controllers/proyectoController.js — Vistas de proyecto para Equipo y Solicitante
 * Cartera de proyectos, detalle, cronograma y reportes de avance
 */

'use strict';

const ProyectoModel    = require('../models/ProyectoModel');
const CronogramaModel  = require('../models/CronogramaModel');
const ReporteModel     = require('../models/ReporteModel');
const MetodologiaModel = require('../models/MetodologiaModel');
const TicketModel      = require('../models/TicketModel');
const { ROLES, ROLES_PROYECTO } = require('../config/constants');
const { query } = require('../config/db');
const encryption = require('../services/encryptionService');
const { Octokit } = require('@octokit/rest');

const asyncH = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── CARTERA DE PROYECTOS (Solicitante ve sus proyectos) ──────────────────────
exports.miCartera = asyncH(async (req, res) => {
  const user = req.session.user;

  let proyectos = [];
  if (user.rol === ROLES.SOLICITANTE) {
    proyectos = await ProyectoModel.findByCliente(user.id);
  } else {
    proyectos = await ProyectoModel.findByMiembro(user.id);
  }

  // Enriquecer con avance global, actividades asignadas al usuario y reportes no vistos
  for (const p of proyectos) {
    const avance = await ProyectoModel.getAvancePromedio(p.id_proyecto);
    p.promedio_avance    = parseFloat(avance.promedio_avance || 0).toFixed(1);
    p.total_actividades  = avance.total_actividades || 0;
    p.completadas        = avance.completadas || 0;

    // Actividades asignadas específicamente a este usuario en este proyecto
    const misActividades = await query(
      `SELECT nombre, estado, porcentaje_avance, fecha_fin
       FROM cronograma_actividades
       WHERE id_proyecto = ? AND id_usuario = ?
       ORDER BY fecha_fin ASC`,
      [p.id_proyecto, user.id]
    );
    p.mis_actividades      = misActividades;
    p.mis_completadas      = misActividades.filter(a => a.estado === 'Completado').length;
    p.mis_en_progreso      = misActividades.filter(a => a.estado === 'En Progreso').length;
    p.mi_promedio_avance   = misActividades.length
      ? (misActividades.reduce((s, a) => s + parseFloat(a.porcentaje_avance || 0), 0) / misActividades.length).toFixed(1)
      : null;

    if (user.rol === ROLES.SOLICITANTE) {
      p.reportes_nuevos = await ReporteModel.countNoVistos(p.id_proyecto);
    }
  }

  res.render('cartera', {
    user,
    roles: ROLES,
    proyectos,
    title: 'Mi Cartera de Proyectos',
  });
});

// ─── DETALLE DE PROYECTO ──────────────────────────────────────────────────────
exports.detalleProyecto = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  const proyecto = await ProyectoModel.findById(id);
  if (!proyecto) {
    return res.status(404).render('error', { title: '404', message: 'Proyecto no encontrado.', user, roles: ROLES });
  }

  // Verificar acceso: Admin ve todo, el resto debe estar asignado
  if (user.rol !== ROLES.ADMINISTRADOR) {
    const equipo = await ProyectoModel.getEquipo(id);
    const clientes = await ProyectoModel.getClientes(id);
    const esMiembro = equipo.some(m => m.id_usuario === user.id);
    const esCliente = clientes.some(c => c.id_usuario === user.id);
    if (!esMiembro && !esCliente) {
      return res.status(403).render('error', { title: '403', message: 'No tienes acceso a este proyecto.', user, roles: ROLES });
    }
  }

  const equipo      = await ProyectoModel.getEquipo(id);
  const clientes    = await ProyectoModel.getClientes(id);
  const cronograma  = await CronogramaModel.findByProyecto(id);
  const resumen     = await CronogramaModel.getResumen(id);
  const reportes    = await ReporteModel.findByProyecto(id, 20);
  const ranking     = await ReporteModel.getRanking(id);
  const informe     = await ReporteModel.getInformeEstado(id);

  // Árbol de metodología
  let arbolMetodologia = null;
  if (proyecto.id_metodologia) {
    arbolMetodologia = await MetodologiaModel.getArbolCompleto(proyecto.id_metodologia);
  }

  // Tickets del proyecto
  const tickets = await query(
    `SELECT sc.ticket_id AS id, sc.titulo, sc.estado_actual AS estado, sc.fecha_registro AS fechaCreacion,
            u.nombre_completo AS solicitanteNombre
     FROM solicitudes_cambio sc
     LEFT JOIN usuarios u ON sc.id_solicitante = u.id_usuario
     WHERE sc.id_proyecto = ?
     ORDER BY sc.fecha_registro DESC`,
    [id]
  );

  // Marcar reportes como vistos si es el solicitante
  if (user.rol === ROLES.SOLICITANTE) {
    await ReporteModel.marcarTodosVistos(id);
  }

  // Determinar rol del usuario en ESTE proyecto
  const miRolEnProyecto = equipo.find(m => m.id_usuario === user.id)?.rol_en_proyecto || user.rol;

  res.render('proyecto-detalle', {
    user,
    roles: ROLES,
    rolesProyecto: ROLES_PROYECTO,
    proyecto,
    equipo,
    clientes,
    cronograma,
    resumen,
    reportes,
    ranking,
    informe,
    arbolMetodologia,
    tickets,
    miRolEnProyecto,
    promedioAvance: await ReporteModel.getPromedioProyecto(id),
    title: proyecto.nombre,
  });
});

// ─── REPORTAR AVANCE (POST API) ───────────────────────────────────────────────
exports.reportarAvance = asyncH(async (req, res) => {
  const user = req.session.user;
  const { idActividad, porcentaje, comentario } = req.body;

  if (!idActividad || porcentaje === undefined) {
    return res.status(400).json({ success: false, error: 'Actividad y porcentaje requeridos.' });
  }

  const actividad = await CronogramaModel.findById(idActividad);
  if (!actividad) return res.status(404).json({ success: false, error: 'Actividad no encontrada.' });

  if (!actividad.es_reportable) {
    return res.status(403).json({ success: false, error: 'Esta actividad no acepta reportes.' });
  }

  // Guardar reporte
  await ReporteModel.create({
    idActividad,
    idProyecto: actividad.id_proyecto,
    idUsuarioReporta: user.id,
    porcentaje,
    comentario,
  });

  // Actualizar % en la actividad
  await CronogramaModel.updateAvance(idActividad, porcentaje);

  // Retornar datos actualizados
  const actividadActualizada = await CronogramaModel.findById(idActividad);
  return res.json({
    success: true,
    porcentaje_avance: actividadActualizada.porcentaje_avance,
    estado: actividadActualizada.estado,
  });
});

// ─── CRONOGRAMA (CRUD API) ────────────────────────────────────────────────────
exports.crearActividad = asyncH(async (req, res) => {
  const user = req.session.user;
  // Aceptar tanto snake_case como camelCase
  const idProyecto  = req.body.idProyecto  || req.body.id_proyecto;
  const idFase      = req.body.idFase      || req.body.id_fase      || null;
  const idEntregable= req.body.idEntregable|| req.body.id_entregable|| null;
  const idUsuario   = req.body.idUsuario   || req.body.id_usuario   || null;
  const nombre      = req.body.nombre;
  const descripcion = req.body.descripcion || '';
  const fechaInicio = req.body.fechaInicio || req.body.fecha_inicio;
  const fechaFin    = req.body.fechaFin    || req.body.fecha_fin;
  const esReportable= req.body.esReportable !== undefined ? req.body.esReportable : req.body.es_reportable;
  const porcentaje_avance = req.body.porcentaje_avance || 0;
  const estado      = req.body.estado || 'Pendiente';

  if (!idProyecto || !nombre || !fechaInicio || !fechaFin) {
    return res.status(400).json({ success: false, error: 'Campos requeridos faltantes: proyecto, nombre, fecha inicio y fecha fin.' });
  }

  // Validar que fecha inicio sea <= fecha fin
  if (new Date(fechaInicio) > new Date(fechaFin)) {
    return res.status(400).json({ success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
  }

  const result = await CronogramaModel.create({
    idProyecto, idFase, idUsuario, nombre, descripcion,
    fechaInicio, fechaFin, esReportable, idEntregable, porcentaje_avance, estado
  });
  const actividad = await CronogramaModel.findById(result.insertId);
  return res.json({ success: true, actividad });
});

exports.actualizarActividad = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  // RN-08: Inmutabilidad del cronograma — solo Administrador puede modificar
  if (user.rol !== ROLES.ADMINISTRADOR) {
    return res.status(403).json({
      success: false,
      error: 'El cronograma base es inmutable. Solo el Administrador puede modificar actividades.',
    });
  }

  // Aceptar tanto snake_case como camelCase
  const idFase       = req.body.idFase       || req.body.id_fase       || null;
  const idEntregable = req.body.idEntregable || req.body.id_entregable || null;
  const idUsuario    = req.body.idUsuario    || req.body.id_usuario    || null;
  const nombre       = req.body.nombre;
  const descripcion  = req.body.descripcion  || '';
  const fechaInicio  = req.body.fechaInicio  || req.body.fecha_inicio;
  const fechaFin     = req.body.fechaFin     || req.body.fecha_fin;
  const esReportable = req.body.esReportable !== undefined ? req.body.esReportable : req.body.es_reportable;
  const estado       = req.body.estado       || 'Pendiente';
  const porcentaje_avance = req.body.porcentaje_avance;

  // Validar fechas si se proporcionan
  if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
    return res.status(400).json({ success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
  }

  await CronogramaModel.update(id, {
    idFase, idUsuario, nombre, descripcion, fechaInicio, fechaFin, esReportable, idEntregable, estado, porcentaje_avance
  });
  return res.json({ success: true });
});

exports.eliminarActividad = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  // RN-08: Inmutabilidad del cronograma — solo Administrador puede eliminar
  if (user.rol !== ROLES.ADMINISTRADOR) {
    return res.status(403).json({
      success: false,
      error: 'El cronograma base es inmutable. Solo el Administrador puede eliminar actividades.',
    });
  }

  await CronogramaModel.delete(id);
  return res.json({ success: true });
});

// ─── VERSIONADO GRANULAR DE ECS ───────────────────────────────────────────────
const VersionEcsModel = require('../models/VersionEcsModel');

exports.crearVersion = asyncH(async (req, res) => {
  const user = req.session.user;
  const idActividad      = req.body.idActividad    || req.body.id_actividad;
  const idProyecto       = req.body.idProyecto     || req.body.id_proyecto;
  const versionNumero    = req.body.versionNumero   || req.body.version_numero;
  const descripcionCambio = req.body.descripcionCambio || req.body.descripcion_cambio || '';
  const contenidoTexto    = req.body.contenidoTexto    || req.body.contenido_texto || '';

  if (!idActividad || !idProyecto || !versionNumero) {
    return res.status(400).json({ success: false, error: 'Campos requeridos: actividad, proyecto y número de versión.' });
  }

  const archivoRuta = req.file ? `/uploads/versiones/${req.file.filename}` : null;
  const archivoNombre = req.file ? req.file.originalname : null;

  // Intentar subir a GitHub si está configurado en el proyecto
  let commitSha = null;
  const proyecto = await ProyectoModel.findById(idProyecto);
  if (proyecto && proyecto.github_repo) {
    try {
      // 1. Obtener token del usuario activo
      const tokenRows = await query('SELECT github_token FROM usuarios WHERE id_usuario = ?', [user.id]);
      let tokenCifrado = tokenRows[0]?.github_token;

      // Fallback al token del administrador del proyecto si el desarrollador no tiene uno
      if (!tokenCifrado) {
        const adminTokenRows = await query('SELECT github_token FROM usuarios WHERE id_usuario = ?', [proyecto.id_admin]);
        tokenCifrado = adminTokenRows[0]?.github_token;
      }

      if (tokenCifrado) {
        const decryptedToken = encryption.decrypt(tokenCifrado);
        if (decryptedToken) {
          const parts = proyecto.github_repo.split('/');
          if (parts.length === 2) {
            const owner = parts[0];
            const repo = parts[1];

            let contentBase64 = '';
            let gitPath = '';
            if (req.file) {
              const fsPromises = require('fs').promises;
              const fileBuffer = await fsPromises.readFile(req.file.path);
              contentBase64 = fileBuffer.toString('base64');
              gitPath = `entregables/actividad_${idActividad}/v${versionNumero}_${req.file.originalname}`;
            } else {
              contentBase64 = Buffer.from(contenidoTexto).toString('base64');
              gitPath = `entregables/actividad_${idActividad}/v${versionNumero}_contenido.txt`;
            }

            const commitMessage = `Version ${versionNumero} - ${descripcionCambio || 'Sin descripcion'}`;
            const octokit = new Octokit({ auth: decryptedToken });

            const gitResponse = await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: gitPath,
              message: commitMessage,
              content: contentBase64,
              committer: {
                name: user.nombre || 'GestioCambios System',
                email: user.correo || 'system@gestiocambios.local'
              },
              author: {
                name: user.nombre || 'GestioCambios System',
                email: user.correo || 'system@gestiocambios.local'
              }
            });

            commitSha = gitResponse.data.commit.sha;
            console.log(`  ✅ Version ${versionNumero} subida a GitHub (${proyecto.github_repo}). Commit: ${commitSha}`);
          }
        }
      }
    } catch (gitErr) {
      console.warn(`  ⚠️ Advertencia al subir version a GitHub, usando fallback local:`, gitErr.message);
    }
  }

  await VersionEcsModel.create({
    idActividad,
    idProyecto,
    versionNumero,
    descripcionCambio,
    idUsuarioAutor: user.id,
    archivoRuta,
    archivoNombre,
    contenidoTexto,
    commitSha,
  });

  return res.json({ success: true });
});

exports.listarVersiones = asyncH(async (req, res) => {
  const { id } = req.params; // id_actividad
  const versiones = await VersionEcsModel.findByActividad(id);
  return res.json({ success: true, versiones });
});

exports.listarVersionesProyecto = asyncH(async (req, res) => {
  const { id } = req.params; // id_proyecto
  const versiones = await VersionEcsModel.findByProyecto(id);
  const resumen   = await VersionEcsModel.getResumenProyecto(id);
  return res.json({ success: true, versiones, resumen });
});

// ─── CONFIGURACIÓN DE GITHUB ──────────────────────────────────────────────────
const encryption = require('../services/encryptionService');
const { Octokit } = require('@octokit/rest');

exports.guardarGithubToken = asyncH(async (req, res) => {
  const user = req.session.user;
  const { token } = req.body;

  if (!token || token.trim() === '') {
    await query('UPDATE usuarios SET github_token = NULL WHERE id_usuario = ?', [user.id]);
    return res.json({ success: true, conectado: false });
  }

  const encryptedToken = encryption.encrypt(token.trim());
  await query('UPDATE usuarios SET github_token = ? WHERE id_usuario = ?', [encryptedToken, user.id]);
  return res.json({ success: true, conectado: true });
});

exports.obtenerGithubStatus = asyncH(async (req, res) => {
  const user = req.session.user;
  const rows = await query('SELECT github_token FROM usuarios WHERE id_usuario = ?', [user.id]);
  
  if (rows.length === 0 || !rows[0].github_token) {
    return res.json({ success: true, conectado: false });
  }

  const decryptedToken = encryption.decrypt(rows[0].github_token);
  if (!decryptedToken) {
    return res.json({ success: true, conectado: false, error: 'Error al descifrar token' });
  }

  try {
    const octokit = new Octokit({ auth: decryptedToken });
    const { data } = await octokit.users.getAuthenticated();
    return res.json({ success: true, conectado: true, username: data.login });
  } catch (err) {
    return res.json({ success: true, conectado: false, error: 'Token inválido o expirado' });
  }
});

// ─── REPORTES HISTORIAL ───────────────────────────────────────────────────────
exports.verReportes = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params; // id_proyecto

  const proyecto = await ProyectoModel.findById(id);
  if (!proyecto) return res.status(404).render('error', { title: '404', message: 'Proyecto no encontrado.', user, roles: ROLES });

  const reportes = await ReporteModel.findByProyecto(id, 100);
  const ranking  = await ReporteModel.getRanking(id);
  const informe  = await ReporteModel.getInformeEstado(id);
  const promedio = await ReporteModel.getPromedioProyecto(id);

  res.render('reportes-avance', {
    user,
    roles: ROLES,
    proyecto,
    reportes,
    ranking,
    informe,
    promedio,
    title: `Reportes — ${proyecto.nombre}`,
  });
});
