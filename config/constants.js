/**
 * config/constants.js — Constantes de Negocio y Configuración de UI
 * Centraliza roles, estados, flujos e impactos de GestioCambios
 */

'use strict';

const ROLES = {
  SOLICITANTE:          'Solicitante',
  DIRECTOR:             'Director',
  GESTOR_CONFIGURACION: 'Gestor de Configuración',
  LIDER_TECNICO:        'Líder Técnico',
  CCB:                  'Comité de Control (CCB)',
  DESARROLLADOR:        'Desarrollador Asignado',
  TESTER:               'Equipo QA / Tester',
};

const ESTADOS = [
  'Solicitado',
  'En Análisis',
  'Pendiente de Aprobación',
  'Aprobado',
  'En Desarrollo',
  'En Pruebas QA',
  'En Pruebas UAT',
  'Listo para Integración',
  'Liberado',
  'Rechazado',
  'Descartado',
];

const TIPOS_CAMBIO = ['Correctivo', 'Evolutivo', 'Adaptativo', 'Perfectivo'];

const IMPACTOS = ['Pendiente', 'Menor', 'Mayor'];

const ESTADO_META = {
  'Solicitado':              { badge: 'badge-slate',  icon: '📋', color: 'var(--slate)' },
  'En Análisis':             { badge: 'badge-orange', icon: '🔍', color: 'var(--orange)' },
  'Pendiente de Aprobación': { badge: 'badge-blue',   icon: '⏳', color: 'var(--blue)' },
  'Aprobado':                { badge: 'badge-teal',   icon: '✅', color: 'var(--teal)' },
  'En Desarrollo':           { badge: 'badge-yellow', icon: '💻', color: 'var(--yellow)' },
  'En Pruebas QA':           { badge: 'badge-pink',   icon: '🧪', color: 'var(--pink)' },
  'En Pruebas UAT':          { badge: 'badge-purple', icon: '👥', color: 'var(--purple)' },
  'Listo para Integración':  { badge: 'badge-blue',   icon: '🔗', color: 'var(--blue)' },
  'Liberado':                { badge: 'badge-green',  icon: '🚀', color: 'var(--accent)' },
  'Rechazado':               { badge: 'badge-red',    icon: '❌', color: 'var(--red)' },
  'Descartado':              { badge: 'badge-slate',  icon: '🗑️', color: 'var(--slate)' },
};

// Pasos secuenciales del ciclo de vida (para el Stepper)
const FLUJO_ESTADOS = [
  'Solicitado',
  'En Análisis',
  'Pendiente de Aprobación',
  'Aprobado',
  'En Desarrollo',
  'En Pruebas QA',
  'En Pruebas UAT',
  'Listo para Integración',
  'Liberado',
];

module.exports = {
  ROLES,
  ESTADOS,
  TIPOS_CAMBIO,
  IMPACTOS,
  ESTADO_META,
  FLUJO_ESTADOS,
};
