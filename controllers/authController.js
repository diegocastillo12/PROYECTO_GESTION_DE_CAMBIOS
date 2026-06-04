/**
 * controllers/authController.js — Autenticación segura y migración de claves
 * Login por correo + contraseña hasheada contra tabla usuarios
 */

'use strict';

const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const { ROLES } = require('../config/constants');

// ─── WRAPPER ASYNC ────────────────────────────────────────────────────────────
const asyncH = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.showLogin = (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('login', { error: null, roles: ROLES, title: 'Iniciar Sesión' });
};

exports.login = asyncH(async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.render('login', {
      error: 'Ingresa tu correo y contraseña.',
      roles: ROLES,
      title: 'Iniciar Sesión',
    });
  }

  // Buscar usuario por correo usando la capa de modelos
  const u = await UserModel.findByCorreo(correo);

  if (!u) {
    return res.render('login', {
      error: 'Correo o contraseña incorrectos.',
      roles: ROLES,
      title: 'Iniciar Sesión',
    });
  }

  let passwordCorrect = false;

  // Intentar verificar con bcrypt (las claves hasheadas empiezan con $2a$ o $2b$)
  const isHashed = u.password_hash.startsWith('$2a$') || u.password_hash.startsWith('$2b$');
  
  if (isHashed) {
    passwordCorrect = await bcrypt.compare(password, u.password_hash);
  } else {
    // Si no está hasheado, comparar como texto plano (migración rápida de datos semilla)
    if (u.password_hash === password) {
      passwordCorrect = true;
      // Hashear y actualizar en la BD de forma transparente
      try {
        const salt = await bcrypt.genSalt(10);
        const nuevoHash = await bcrypt.hash(password, salt);
        await UserModel.updatePasswordHash(u.id, nuevoHash);
        console.log(`🔐 Clave del usuario ${correo} migrada exitosamente a bcrypt.`);
      } catch (err) {
        console.error(`⚠️ Error al migrar clave de ${correo}:`, err.message);
      }
    }
  }

  if (!passwordCorrect) {
    return res.render('login', {
      error: 'Correo o contraseña incorrectos.',
      roles: ROLES,
      title: 'Iniciar Sesión',
    });
  }

  // Guardar en sesión
  req.session.user = {
    id:     u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol:    u.rol,
  };

  res.redirect('/');
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
};

exports.requireRole = (...rolesPermitidos) => (req, res, next) => {
  const user = req.session && req.session.user;
  if (!user) return res.redirect('/login');
  if (rolesPermitidos.includes(user.rol)) return next();
  res.status(403).render('error', {
    title: '403 — Acceso Denegado',
    message: 'No tienes permiso para acceder a esta sección.',
    user,
    roles: ROLES,
  });
};
