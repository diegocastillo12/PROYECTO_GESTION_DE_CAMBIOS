/**
 * controllers/changeController.js — Lógica de negocio refactorizada
 * Utiliza la capa de Modelos y el WorkflowService.
 */

'use strict';

const TicketModel = require('../models/TicketModel');
const UserModel = require('../models/UserModel');
const ProyectoModel = require('../models/ProyectoModel');
const CronogramaModel = require('../models/CronogramaModel');
const WorkflowService = require('../services/WorkflowService');
const { ROLES, ESTADOS, TIPOS_CAMBIO, IMPACTOS, ESTADO_META, FLUJO_ESTADOS } = require('../config/constants');

// ─── ASYNC WRAPPER ────────────────────────────────────────────────────────────
const asyncH = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Helper to get roles by project map for the current user
async function getRolesPorProyecto(userId) {
  const rolesMap = {};
  const miembroProyectos = await ProyectoModel.findByMiembro(userId);
  miembroProyectos.forEach(p => {
    rolesMap[p.id_proyecto] = p.rol_en_proyecto;
  });
  const clienteProyectos = await ProyectoModel.findByCliente(userId);
  clienteProyectos.forEach(p => {
    rolesMap[p.id_proyecto] = ROLES.SOLICITANTE;
  });
  return rolesMap;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
exports.dashboard = asyncH(async (req, res) => {
  const user = req.session.user;
  
  // Redirigir según rol si intentan acceder directamente a /dashboard
  if (user.rol === ROLES.ADMINISTRADOR) {
    return res.redirect('/admin');
  }
  if (user.rol === ROLES.SOLICITANTE) {
    return res.redirect('/cartera');
  }

  const rolesPorProyecto = await getRolesPorProyecto(user.id);
  
  // Obtener todos los tickets de la base de datos usando el modelo
  const tickets = await TicketModel.findAll();
  
  // Filtrar según los permisos del rol
  const visibles = WorkflowService.filtrarPorRol(tickets, user, rolesPorProyecto);
  
  // Calcular estadísticas y bandeja de tareas
  const stats = WorkflowService.calcularStats(visibles);
  const bandeja = WorkflowService.filtrarBandeja(visibles, user, rolesPorProyecto);

  res.render('dashboard', {
    user,
    roles: ROLES,
    tickets: visibles,
    stats,
    bandeja,
    estadoMeta: ESTADO_META,
    title: 'Dashboard',
  });
});

// ─── LISTADO DE TICKETS ───────────────────────────────────────────────────────
exports.listarTickets = asyncH(async (req, res) => {
  const user = req.session.user;
  const rolesPorProyecto = await getRolesPorProyecto(user.id);
  
  // Buscar con filtros en base de datos (soluciona bug de filtrado en servidor)
  const tickets = await TicketModel.findAll(req.query);
  
  // Filtrar según permisos del rol
  const visibles = WorkflowService.filtrarPorRol(tickets, user, rolesPorProyecto);

  res.render('tickets', {
    user,
    roles: ROLES,
    tickets: visibles,
    estadoMeta: ESTADO_META,
    tiposCambio: TIPOS_CAMBIO,
    estados: ESTADOS,
    prioridades: IMPACTOS,
    filtros: req.query || {},
    title: 'Todos los Tickets',
  });
});

// ─── DETALLE DE TICKET ────────────────────────────────────────────────────────
exports.mostrarTicket = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  // Ticket principal usando el modelo
  const ticket = await TicketModel.findById(id);
  if (!ticket) {
    return res.status(404).render('error', {
      title: '404 — Ticket no encontrado',
      message: `No existe el ticket ${id}.`,
      user,
      roles: ROLES,
    });
  }

  // Archivos afectados (ECS)
  ticket.archivosAfectados = await TicketModel.getEcsAfectados(ticket.id_sc);

  // Evidencias Git
  const git = await TicketModel.getEvidenciaGit(ticket.id_sc);
  ticket.rama             = git ? git.nombre_rama : null;
  ticket.mergeRequest     = git ? git.url_pull_request : null;
  ticket.comentarioTecnico = git ? git.comentario_tecnico : null;

  // Control de calidad (con mapeo robusto para la UI)
  const qa = await TicketModel.getControlCalidad(ticket.id_sc);
  ticket.qaResultados = qa ? {
    qa_estado:         qa.qa_estado,
    qa_evidencia:      qa.qa_evidencia_url,
    qa_observaciones:  qa.qa_observaciones,
    uat_estado:        qa.uat_estado,
    uat_observaciones: qa.uat_observaciones,
    testsCorridos:     10, // Mocked para el gráfico de la UI
    testsPasados:      qa.qa_estado === 'Aprobado' ? 10 : 8,
    testsFallidos:     qa.qa_estado === 'Aprobado' ? 0 : 2,
    aprobado:          qa.qa_estado === 'Aprobado',
    notas:             qa.qa_observaciones || '',
  } : null;

  // Historial de estados
  const histRows = await TicketModel.getHistorial(ticket.id_sc);
  ticket.historial = histRows.map(h => ({
    estado:     h.estado_nuevo,
    anterior:   h.estado_anterior,
    fecha:      h.fecha_cambio,
    usuario:    h.usuario_nombre,
    rol:        h.usuario_rol,
    comentario: h.comentario,
  }));

  // Determinar rol efectivo en el proyecto para este usuario
  let rolEfectivo = user.rol;
  if (ticket.id_proyecto) {
    const equipo = await ProyectoModel.getEquipo(ticket.id_proyecto);
    const clientes = await ProyectoModel.getClientes(ticket.id_proyecto);
    
    const miembro = equipo.find(m => m.id_usuario === user.id);
    const esCliente = clientes.some(c => c.id_usuario === user.id);
    
    if (miembro) {
      rolEfectivo = miembro.rol_en_proyecto;
    } else if (esCliente) {
      rolEfectivo = ROLES.SOLICITANTE;
    }
  }

  // Transiciones y permisos usando el WorkflowService con el rol efectivo
  const transicionesDisponibles = WorkflowService.getTransicionesDisponibles(ticket.estado, rolEfectivo);
  const transicionesPermitidas = {};
  transicionesDisponibles.forEach(nuevoEstado => {
    transicionesPermitidas[nuevoEstado] = true;
  });

  const isTerminal = ['Liberado', 'Rechazado', 'Descartado'].includes(ticket.estado);

  // Inyección de usuarios para la asignación en los modales de la vista
  let desarrolladores = [];
  let testers = [];

  if (ticket.id_proyecto) {
    const equipo = await ProyectoModel.getEquipo(ticket.id_proyecto);
    desarrolladores = equipo
      .filter(m => [ROLES.DESARROLLADOR, ROLES.LIDER_TECNICO].includes(m.rol_en_proyecto))
      .map(m => ({
        id: m.id_usuario,
        nombre: m.nombre,
        rol: m.rol_en_proyecto
      }));
    testers = equipo
      .filter(m => m.rol_en_proyecto === ROLES.TESTER)
      .map(m => ({
        id: m.id_usuario,
        nombre: m.nombre,
        rol: m.rol_en_proyecto
      }));
  }

  // Fallback si no hay equipo en el proyecto (o no hay id_proyecto)
  if (desarrolladores.length === 0) {
    desarrolladores = await UserModel.findActiveByRoles([ROLES.DESARROLLADOR, ROLES.LIDER_TECNICO]);
  }
  if (testers.length === 0) {
    testers = await UserModel.findActiveByRoles([ROLES.TESTER]);
  }

  const allUsers = await UserModel.findAll();

  res.render('ticket-detail', {
    user,
    roles: ROLES,
    rolEfectivo,
    ticket,
    transicionesPermitidas,
    transicionesDisponibles,
    isTerminal,
    estadoMeta: ESTADO_META,
    flujoEstados: FLUJO_ESTADOS,
    desarrolladores,
    testers,
    users: allUsers, // Soluciona TypeError: Cannot read properties of undefined (reading 'filter')
    title: `${ticket.id} — ${ticket.titulo}`,
  });
});

// ─── NUEVO TICKET (FORM) ──────────────────────────────────────────────────────
exports.mostrarNuevoTicket = asyncH(async (req, res) => {
  const { id_proyecto } = req.query;
  const user = req.session.user;

  let proyectos = [];
  if (user.rol === ROLES.SOLICITANTE) {
    proyectos = await ProyectoModel.findByCliente(user.id);
  } else {
    proyectos = await ProyectoModel.findByMiembro(user.id);
  }

  res.render('nuevo-ticket', {
    user,
    roles: ROLES,
    tiposCambio: TIPOS_CAMBIO,
    prioridades: IMPACTOS,
    id_proyecto: id_proyecto || null,
    proyectos,
    error: null,
    title: 'Nueva Solicitud de Cambio',
  });
});

// ─── CREAR TICKET ─────────────────────────────────────────────────────────────
exports.crearTicket = asyncH(async (req, res) => {
  const user = req.session.user;
  const { titulo, descripcion, justificacion_tecnica, tipo, prioridad, estimacionHoras, id_proyecto } = req.body;

  if (!titulo || !descripcion || !tipo) {
    if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(400).json({ success: false, ok: false, error: 'Los campos Título, Descripción y Tipo de Cambio son obligatorios.' });
    }
    return res.render('nuevo-ticket', {
      user,
      roles: ROLES,
      tiposCambio: TIPOS_CAMBIO,
      prioridades: IMPACTOS,
      error: 'Los campos Título, Descripción y Tipo de Cambio son obligatorios.',
      title: 'Nueva Solicitud de Cambio',
    });
  }

  // Generar ticket_id único con reintentos para evitar colisiones de concurrencia y huecos por borrado
  let ticket_id;
  let count = await TicketModel.countAll();
  let inserted = false;
  let attempts = 0;

  while (!inserted && attempts < 10) {
    ticket_id = `TK-SC${String(count + 1 + attempts).padStart(3, '0')}`;
    try {
      await TicketModel.create({
        ticketId: ticket_id,
        titulo,
        descripcion,
        justificacion: justificacion_tecnica,
        tipo,
        prioridad,
        estimacionHoras,
        idSolicitante: user.id,
        idProyecto: id_proyecto || null,
      });
      inserted = true;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        attempts++;
      } else {
        throw err;
      }
    }
  }

  if (!inserted) {
    return res.status(500).render('error', {
      title: 'Error Interno del Servidor',
      message: 'No se pudo generar un ID de ticket único después de múltiples intentos.',
      user,
      roles: ROLES,
    });
  }

  // Historial inicial
  const newTicket = await TicketModel.findById(ticket_id);
  if (newTicket) {
    await TicketModel.addHistorial({
      idSc: newTicket.id_sc,
      estadoAnterior: null,
      estadoNuevo: 'Solicitado',
      usuarioNombre: user.nombre,
      usuarioRol: user.rol,
      comentario: 'Ticket creado.',
    });
  }

  // Responder según el origen de la petición (Web o API)
  if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.json({ success: true, ok: true, ticket: { id: ticket_id } });
  } else {
    res.redirect(`/tickets/${ticket_id}`);
  }
});

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
exports.cambiarEstado = asyncH(async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;
  const { nuevoEstado, comentario, asignadoId, mergeRequest, rama, qaAprobado, qaNotes } = req.body;

  // Validar ticket
  const ticket = await TicketModel.findById(id);
  if (!ticket) {
    return res.status(404).json({ success: false, ok: false, error: 'Ticket no encontrado.' });
  }

  // Determinar rol efectivo en el proyecto para este usuario
  let rolEfectivo = user.rol;
  if (ticket.id_proyecto) {
    const equipo = await ProyectoModel.getEquipo(ticket.id_proyecto);
    const clientes = await ProyectoModel.getClientes(ticket.id_proyecto);
    
    const miembro = equipo.find(m => m.id_usuario === user.id);
    const esCliente = clientes.some(c => c.id_usuario === user.id);
    
    if (miembro) {
      rolEfectivo = miembro.rol_en_proyecto;
    } else if (esCliente) {
      rolEfectivo = ROLES.SOLICITANTE;
    }
  }

  // Validar transición en el servicio usando el rol efectivo
  const esValido = WorkflowService.isValidTransition(ticket.estado, nuevoEstado, rolEfectivo);
  if (!ESTADOS.includes(nuevoEstado) || !esValido) {
    return res.status(403).json({ success: false, ok: false, error: 'Transición no permitida para tu rol en este proyecto.' });
  }

  // Actualizar estado del ticket en base de datos
  await TicketModel.updateEstado(ticket.id_sc, nuevoEstado);

  // Registrar en historial usando el modelo
  await TicketModel.addHistorial({
    idSc:           ticket.id_sc,
    estadoAnterior: ticket.estado,
    estadoNuevo:    nuevoEstado,
    usuarioNombre:  user.nombre,
    usuarioRol:     user.rol,
    comentario:     comentario || null,
  });

  // 1. Guardar Asignación si se proporciona (flujo "En Desarrollo" / "Aprobado")
  if (asignadoId) {
    await TicketModel.updatePersonal(ticket.id_sc, parseInt(asignadoId), null);
  }

  // 2. Guardar Evidencias Git si se proporcionan
  if (rama || mergeRequest) {
    await TicketModel.saveEvidenciaGit({
      idSc:             ticket.id_sc,
      nombreRama:       rama || '',
      urlPullRequest:   mergeRequest || '',
      comentarioTecnico: comentario || '',
    });
  }

  // 3. Guardar Control de Calidad si se proporcionan campos de QA
  if (qaAprobado !== undefined) {
    await TicketModel.saveControlCalidad({
      idSc:             ticket.id_sc,
      qaEstado:         qaAprobado === 'true' ? 'Aprobado' : 'Rechazado',
      qaObservaciones:  qaNotes || '',
      qaEvidenciaUrl:   '',
      uatEstado:        qaAprobado === 'true' ? 'Aprobado' : 'Rechazado',
      uatObservaciones: qaNotes || '',
    });
  }

  // 4. Sincronizar automáticamente el porcentaje de avance de la actividad vinculada si existe
  await CronogramaModel.syncAvanceConTicket(ticket.id_sc, nuevoEstado, user.id, ticket.id_proyecto);

  // Retornar éxito (tanto success como ok para evitar fallos de interfaz)
  return res.json({ success: true, ok: true, nuevoEstado, ticketId: id });
});

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
exports.apiListar = asyncH(async (req, res) => {
  const user = req.session.user;
  const rolesPorProyecto = await getRolesPorProyecto(user.id);
  const tickets = await TicketModel.findAll();
  const visibles = WorkflowService.filtrarPorRol(tickets, user, rolesPorProyecto);
  res.json({ success: true, ok: true, data: visibles });
});

exports.apiDetalle = asyncH(async (req, res) => {
  const ticket = await TicketModel.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, ok: false, error: 'Not found' });
  res.json({ success: true, ok: true, data: ticket });
});
