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

  // Validar que el usuario que reporta sea el responsable asignado
  if (!actividad.id_usuario || actividad.id_usuario !== user.id) {
    return res.status(403).json({ success: false, error: 'Solo el responsable asignado puede reportar avance en esta actividad.' });
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

  // ─── Leer buffer del archivo para guardarlo en BD ────────────────────────────
  let contenidoBinario = null;
  let contenidoMime    = null;
  let archivoNombre    = null;
  let archivoRuta      = null;

  if (req.file) {
    const fs = require('fs');
    contenidoBinario = fs.readFileSync(req.file.path);
    contenidoMime    = req.file.mimetype;
    archivoNombre    = req.file.originalname;
    archivoRuta      = `/uploads/versiones/${req.file.filename}`; // ruta local (fallback dev)

    // Limpiar archivo local después de leerlo (ya está en BD)
    try { fs.unlinkSync(req.file.path); } catch (_) {}
  }

  // ─── Intentar subir a GitHub si está configurado ────────────────────────────
  let commitSha = null;
  const proyecto = await ProyectoModel.findById(idProyecto);
  if (proyecto && proyecto.github_repo && contenidoBinario) {
    try {
      const tokenRows = await query('SELECT github_token FROM usuarios WHERE id_usuario = ?', [user.id]);
      let tokenCifrado = tokenRows[0]?.github_token;

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
            const repo  = parts[1];
            const contentBase64 = contenidoBinario.toString('base64');
            const gitPath = `entregables/actividad_${idActividad}/v${versionNumero}_${archivoNombre || 'contenido.txt'}`;
            const commitMessage = `Version ${versionNumero} - ${descripcionCambio || 'Sin descripcion'}`;
            const octokit = new Octokit({ auth: decryptedToken });

            const gitResponse = await octokit.repos.createOrUpdateFileContents({
              owner, repo, path: gitPath, message: commitMessage,
              content: contentBase64,
              committer: { name: user.nombre || 'GestioCambios System', email: user.correo || 'system@gestiocambios.local' },
              author:    { name: user.nombre || 'GestioCambios System', email: user.correo || 'system@gestiocambios.local' },
            });

            commitSha = gitResponse.data.commit.sha;
            console.log(`  ✅ Version ${versionNumero} subida a GitHub (${proyecto.github_repo}). Commit: ${commitSha}`);
          }
        }
      }
    } catch (gitErr) {
      console.warn(`  ⚠️ Advertencia al subir version a GitHub:`, gitErr.message);
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
    contenidoTexto: contenidoTexto || null,
    commitSha,
    contenidoBinario,
    contenidoMime,
  });

  return res.json({ success: true });
});

// ─── SERVIR ARCHIVO DE VERSIÓN DESDE LA BD ────────────────────────────────────
exports.servirArchivo = asyncH(async (req, res) => {
  const { id } = req.params; // id_version
  const version = await VersionEcsModel.findByIdConBinario(id);

  if (!version) {
    return res.status(404).json({ error: 'Versión no encontrada.' });
  }

  // Prioridad 1: contenido binario en BD
  if (version.contenido_binario) {
    const mime = version.contenido_mime || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${version.archivo_nombre || 'documento'}"`);
    return res.send(version.contenido_binario);
  }

  // Prioridad 2: archivo local (fallback para versiones antiguas)
  if (version.archivo_ruta) {
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'public', version.archivo_ruta.replace(/^\//, ''));
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }

  // Prioridad 3: contenido texto
  if (version.contenido_texto) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(version.contenido_texto);
  }

  return res.status(404).json({ error: 'No hay contenido disponible para esta versión.' });
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

// ─── COMPARACIÓN INTELIGENTE DE VERSIONES CON IA (GEMINI FLASH) ───────────────
exports.compararVersionesConIA = asyncH(async (req, res) => {
  const { idV1, idV2 } = req.body;

  if (!idV1 || !idV2) {
    return res.status(400).json({ success: false, error: 'Se requieren dos versiones para comparar.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'tu_api_key_aqui') {
    return res.json({
      success: false,
      error: 'La API Key de Gemini no está configurada en el servidor. Por favor, agregue la variable GEMINI_API_KEY en su archivo .env y reinicie el servidor.'
    });
  }

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const mammoth = require("mammoth");

  try {
    const v1 = await VersionEcsModel.findByIdConBinario(idV1);
    const v2 = await VersionEcsModel.findByIdConBinario(idV2);

    if (!v1 || !v2) {
      return res.status(404).json({ success: false, error: 'Una o ambas versiones no fueron encontradas.' });
    }

    const antigua = new Date(v1.fecha_version) < new Date(v2.fecha_version) ? v1 : v2;
    const nueva   = antigua === v1 ? v2 : v1;

    const procesarVersion = async (version) => {
      const mime = version.contenido_mime || '';
      const nombre = version.archivo_nombre || '';
      const ext = nombre.split('.').pop().toLowerCase();

      if ((mime.includes('pdf') || ext === 'pdf') && version.contenido_binario) {
        return {
          tipo: 'pdf',
          data: {
            inlineData: {
              data: version.contenido_binario.toString('base64'),
              mimeType: 'application/pdf'
            }
          }
        };
      }

      if ((mime.includes('word') || ['doc', 'docx'].includes(ext)) && version.contenido_binario) {
        try {
          const result = await mammoth.extractRawText({ buffer: version.contenido_binario });
          return { tipo: 'texto', data: result.value || 'Documento de Word sin texto legible.' };
        } catch (e) {
          return { tipo: 'texto', data: `Error al extraer texto de Word: ${e.message}` };
        }
      }

      if (version.contenido_texto) {
        return { tipo: 'texto', data: version.contenido_texto };
      }

      return { tipo: 'texto', data: `Archivo adjunto: ${nombre || 'Sin nombre'} (Tipo: ${mime || 'Desconocido'}). No se pudo procesar el contenido de texto.` };
    };

    const resAntigua = await procesarVersion(antigua);
    const resNueva   = await procesarVersion(nueva);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1beta" });

    let prompt = `Eres un experto en Gestión de Configuración (SCM) y QA.
Tu objetivo es analizar y comparar de forma semántica la Versión Antigua y la Versión Nueva de los entregables del ECS.

**IMPORTANTE: Proporciona un análisis de término medio: informativo y claro, pero ágil. Evita rodeos, saludos o introducciones largas. Usa viñetas breves pero explicativas (de 1 o 2 líneas cada una) para que se entienda el contexto de cada cambio. La respuesta completa debe tener alrededor de 200 a 250 palabras.**

Estructura el reporte en Markdown con los siguientes títulos:
1. 📋 **Resumen de la Actualización**: Un párrafo corto de 3 a 4 líneas que explique el propósito principal del cambio entre versiones.
2. 🔍 **Cambios Detallados**:
   - Agregados: Qué secciones o requisitos nuevos se incluyeron y qué aportan.
   - Modificaciones: Qué partes se reescribieron, expandieron o refinaron y por qué.
3. ⚠️ **Impacto y Recomendación**: 2 o 3 viñetas breves sobre los riesgos que introducen estos cambios en el proyecto y qué acciones aconsejas al equipo de QA o Desarrollo.

---
INFORMACIÓN GENERAL:
- Versión Antigua: v${antigua.version_numero} (Nombre: ${antigua.archivo_nombre || 'Texto plano'})
- Versión Nueva: v${nueva.version_numero} (Nombre: ${nueva.archivo_nombre || 'Texto plano'})
`;

    const parts = [prompt];

    parts.push(`\n--- DOCUMENTO ANTIGUO (v${antigua.version_numero}) ---`);
    if (resAntigua.tipo === 'pdf') {
      parts.push(resAntigua.data);
    } else {
      parts.push(resAntigua.data);
    }

    parts.push(`\n--- DOCUMENTO NUEVO (v${nueva.version_numero}) ---`);
    if (resNueva.tipo === 'pdf') {
      parts.push(resNueva.data);
    } else {
      parts.push(resNueva.data);
    }

    // Reintentar hasta 3 veces en caso de 503 (sobrecarga temporal de la API)
    let result;
    for (let intento = 1; intento <= 3; intento++) {
      try {
        result = await model.generateContent(parts);
        break; // éxito
      } catch (e) {
        const is503 = e.message && (e.message.includes('503') || e.message.includes('high demand') || e.message.includes('Service Unavailable'));
        const is429 = e.message && (e.message.includes('429') || e.message.includes('quota') || e.message.includes('Too Many Requests'));

        if (is429) {
          return res.status(429).json({
            success: false,
            error: 'Se ha superado la cuota gratuita de la API de Gemini por hoy. Intenta de nuevo mañana o revisa tu plan en https://ai.google.dev'
          });
        }

        if (is503 && intento < 3) {
          console.warn(`  ⚠️ Gemini 503 (intento ${intento}/3) — esperando 4s...`);
          await new Promise(r => setTimeout(r, 4000));
          continue;
        }
        throw e;
      }
    }

    const response = await result.response;
    const analysisMarkdown = response.text();

    return res.json({ success: true, analysis: analysisMarkdown });

  } catch (err) {
    console.error('Error en la comparación con IA:', err);
    return res.status(500).json({ success: false, error: 'Ocurrió un error inesperado al procesar la comparación con IA: ' + err.message });
  }
});
