/**
 * apiRoutes.js — Endpoints REST para GestioCambios G04
 * Incluye rutas de tickets, proyectos, cronograma, reportes y metodologías
 * Los endpoints /api/admin/* y /api/* apuntan a los mismos controladores
 */

'use strict';

const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');
const change  = require('../controllers/changeController');
const admin   = require('../controllers/adminController');
const proy    = require('../controllers/proyectoController');
const { ROLES } = require('../config/constants');

const requireAdmin = auth.requireRole(ROLES.ADMINISTRADOR);

// ─── TICKETS ──────────────────────────────────────────────────────────────────
router.post('/tickets',                auth.requireAuth, change.crearTicket);
router.put('/tickets/:id/estado',      auth.requireAuth, change.cambiarEstado);
router.get('/tickets',                 auth.requireAuth, change.apiListar);
router.get('/tickets/:id',             auth.requireAuth, change.apiDetalle);

// ─── PROYECTOS (ambos prefijos funcionan) ─────────────────────────────────────
const crearProyecto     = [auth.requireAuth, requireAdmin, admin.crearProyecto];
const actualizarProy    = [auth.requireAuth, requireAdmin, admin.actualizarProyecto];
const eliminarProy      = [auth.requireAuth, requireAdmin, admin.eliminarProyecto];
const asignarMiembro    = [auth.requireAuth, requireAdmin, admin.asignarMiembro];
const quitarMiembro     = [auth.requireAuth, requireAdmin, admin.quitarMiembro];
const asignarCliente    = [auth.requireAuth, requireAdmin, admin.asignarCliente];
const quitarCliente     = [auth.requireAuth, requireAdmin, admin.quitarCliente];

// Con prefijo /api/proyectos/... (rutas originales)
router.post('/proyectos',                        ...crearProyecto);
router.put('/proyectos/:id',                     ...actualizarProy);
router.delete('/proyectos/:id',                  ...eliminarProy);
router.post('/proyectos/:id/equipo',             ...asignarMiembro);
router.delete('/proyectos/:id/equipo/:uid',      ...quitarMiembro);
router.post('/proyectos/:id/clientes',           ...asignarCliente);
router.delete('/proyectos/:id/clientes/:uid',    ...quitarCliente);

// Con prefijo /api/admin/proyectos/... (lo que usan las vistas del admin)
router.post('/admin/proyectos',                      ...crearProyecto);
router.put('/admin/proyectos/:id',                   ...actualizarProy);
router.delete('/admin/proyectos/:id',                ...eliminarProy);
router.post('/admin/proyectos/:id/equipo',           ...asignarMiembro);
router.delete('/admin/proyectos/:id/equipo/:uid',    ...quitarMiembro);
router.post('/admin/proyectos/:id/clientes',         ...asignarCliente);
router.delete('/admin/proyectos/:id/clientes/:uid',  ...quitarCliente);

// Cronograma del proyecto (usado por proyecto-config.ejs como /api/admin/proyectos/:id/cronograma)
router.post('/admin/proyectos/:id/cronograma', auth.requireAuth, requireAdmin, async (req, res, next) => {
  req.body.idProyecto = req.params.id;
  return proy.crearActividad(req, res, next);
});
router.put('/admin/proyectos/:id/cronograma/:aid',    auth.requireAuth, requireAdmin, (req, res, next) => {
  req.params.id = req.params.aid; return proy.actualizarActividad(req, res, next);
});
router.delete('/admin/proyectos/:id/cronograma/:aid', auth.requireAuth, requireAdmin, (req, res, next) => {
  req.params.id = req.params.aid; return proy.eliminarActividad(req, res, next);
});

// Avance
router.get('/proyectos/:id/avance', auth.requireAuth, async (req, res) => {
  try {
    const ReporteModel = require('../models/ReporteModel');
    const promedio = await ReporteModel.getPromedioProyecto(req.params.id);
    const ranking  = await ReporteModel.getRanking(req.params.id);
    res.json({ success: true, promedio, ranking });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─── CRONOGRAMA / ACTIVIDADES (prefijo estándar) ──────────────────────────────
router.post('/actividades',            auth.requireAuth, proy.crearActividad);
router.put('/actividades/:id',         auth.requireAuth, proy.actualizarActividad);
router.delete('/actividades/:id',      auth.requireAuth, proy.eliminarActividad);

// ─── REPORTES DE AVANCE ───────────────────────────────────────────────────────
router.post('/reportes',               auth.requireAuth, proy.reportarAvance);

// ─── USUARIOS (ambos prefijos) ────────────────────────────────────────────────
router.post('/usuarios',               auth.requireAuth, requireAdmin, admin.crearUsuario);
router.put('/usuarios/:id',            auth.requireAuth, requireAdmin, admin.editarUsuario);
router.delete('/usuarios/:id',         auth.requireAuth, requireAdmin, admin.eliminarUsuario);
// Con prefijo /api/admin/usuarios/...
router.post('/admin/usuarios',         auth.requireAuth, requireAdmin, admin.crearUsuario);
router.put('/admin/usuarios/:id',      auth.requireAuth, requireAdmin, admin.editarUsuario);
router.delete('/admin/usuarios/:id',   auth.requireAuth, requireAdmin, admin.eliminarUsuario);

// ─── METODOLOGÍAS (ambos prefijos) ────────────────────────────────────────────
router.post('/metodologias',           auth.requireAuth, requireAdmin, admin.crearMetodologia);
router.put('/metodologias/:id',        auth.requireAuth, requireAdmin, admin.actualizarMetodologia);
router.delete('/metodologias/:id',     auth.requireAuth, requireAdmin, admin.eliminarMetodologia);

router.post('/admin/metodologias',     auth.requireAuth, requireAdmin, admin.crearMetodologia);
router.put('/admin/metodologias/:id',  auth.requireAuth, requireAdmin, admin.actualizarMetodologia);
router.delete('/admin/metodologias/:id', auth.requireAuth, requireAdmin, admin.eliminarMetodologia);

// Etapas
router.post('/metodologias/:id/etapas',              auth.requireAuth, requireAdmin, admin.crearEtapa);
router.delete('/etapas/:id',                         auth.requireAuth, requireAdmin, admin.eliminarEtapa);
router.post('/admin/metodologias/:id/etapas',        auth.requireAuth, requireAdmin, admin.crearEtapa);
router.delete('/admin/metodologias/etapas/:id',      auth.requireAuth, requireAdmin, admin.eliminarEtapa);

// Fases
router.post('/etapas/:id/fases',                     auth.requireAuth, requireAdmin, admin.crearFase);
router.delete('/fases/:id',                          auth.requireAuth, requireAdmin, admin.eliminarFase);
router.post('/admin/metodologias/etapas/:id/fases',  auth.requireAuth, requireAdmin, admin.crearFase);
router.delete('/admin/metodologias/fases/:id',       auth.requireAuth, requireAdmin, admin.eliminarFase);

// ECM
router.post('/fases/:id/ecm',                        auth.requireAuth, requireAdmin, admin.crearECM);
router.delete('/ecm/:id',                            auth.requireAuth, requireAdmin, admin.eliminarECM);
router.post('/admin/metodologias/fases/:id/ecm',     auth.requireAuth, requireAdmin, admin.crearECM);
router.delete('/admin/metodologias/ecm/:id',         auth.requireAuth, requireAdmin, admin.eliminarECM);

const multer = require('multer');
const fs = require('fs');

// Configuración de almacenamiento para versiones de ECS
const uploadDir = 'public/uploads/versiones';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ─── VERSIONADO GRANULAR DE ECS ───────────────────────────────────────────────
router.post('/versiones',                            auth.requireAuth, upload.single('archivo'), proy.crearVersion);
router.get('/versiones/:id/archivo',                 auth.requireAuth, proy.servirArchivo);
router.post('/versiones/comparar-ia',                auth.requireAuth, proy.compararVersionesConIA);
router.get('/actividades/:id/versiones',             auth.requireAuth, proy.listarVersiones);
router.get('/proyectos/:id/versiones',               auth.requireAuth, proy.listarVersionesProyecto);
router.get('/admin/proyectos/:id/versiones',         auth.requireAuth, proy.listarVersionesProyecto);

// ─── INTEGRACIÓN DE GITHUB ────────────────────────────────────────────────────
router.post('/usuario/github-token',                 auth.requireAuth, proy.guardarGithubToken);
router.get('/usuario/github-status',                  auth.requireAuth, proy.obtenerGithubStatus);

module.exports = router;
