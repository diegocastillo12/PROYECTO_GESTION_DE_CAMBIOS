/**
 * services/WorkflowService.js — Servicio de Lógica del Flujo de Trabajo
 * Encapsula la máquina de estados, transiciones permitidas, visibilidad y estadísticas
 */

'use strict';

const { ROLES, ESTADOS, IMPACTOS } = require('../config/constants');

// Definición de la máquina de transiciones de estados
const TRANSICIONES = {
  'Solicitado': {
    'En Análisis': [ROLES.GESTOR_CONFIGURACION, ROLES.LIDER_TECNICO, ROLES.DIRECTOR],
    'Rechazado':   [ROLES.GESTOR_CONFIGURACION, ROLES.DIRECTOR],
    'Descartado':  [ROLES.GESTOR_CONFIGURACION],
  },
  'En Análisis': {
    'Pendiente de Aprobación': [ROLES.LIDER_TECNICO, ROLES.GESTOR_CONFIGURACION],
    'Rechazado':               [ROLES.LIDER_TECNICO, ROLES.DIRECTOR],
  },
  'Pendiente de Aprobación': {
    'Aprobado':   [ROLES.DIRECTOR, ROLES.CCB],
    'Rechazado':  [ROLES.DIRECTOR, ROLES.CCB],
    'Descartado': [ROLES.DIRECTOR],
  },
  'Aprobado': {
    'En Desarrollo': [ROLES.GESTOR_CONFIGURACION, ROLES.DESARROLLADOR],
  },
  'En Desarrollo': {
    'En Pruebas QA': [ROLES.DESARROLLADOR, ROLES.LIDER_TECNICO],
    'En Análisis':   [ROLES.LIDER_TECNICO],
  },
  'En Pruebas QA': {
    'En Pruebas UAT':          [ROLES.TESTER, ROLES.LIDER_TECNICO],
    'En Desarrollo':           [ROLES.TESTER],
    'Listo para Integración':  [ROLES.TESTER, ROLES.LIDER_TECNICO],
  },
  'En Pruebas UAT': {
    'Listo para Integración': [ROLES.TESTER, ROLES.LIDER_TECNICO],
    'En Desarrollo':          [ROLES.TESTER],
  },
  'Listo para Integración': {
    'Liberado':      [ROLES.GESTOR_CONFIGURACION],
    'En Desarrollo': [ROLES.GESTOR_CONFIGURACION],
  },
};

class WorkflowService {
  /**
   * Verificar si una transición de estado es válida para un rol específico
   * @param {string} estadoActual 
   * @param {string} nuevoEstado 
   * @param {string} rolUsuario 
   * @returns {boolean}
   */
  isValidTransition(estadoActual, nuevoEstado, rolUsuario) {
    const permitidos = (TRANSICIONES[estadoActual] || {})[nuevoEstado] || [];
    return permitidos.includes(rolUsuario);
  }

  /**
   * Obtener lista de estados destino permitidos para un rol en un estado específico
   * @param {string} estadoActual 
   * @param {string} rolUsuario 
   * @returns {Array<string>}
   */
  getTransicionesDisponibles(estadoActual, rolUsuario) {
    const transicionesEstado = TRANSICIONES[estadoActual] || {};
    const disponibles = [];
    Object.entries(transicionesEstado).forEach(([nuevoEstado, rolesPermitidos]) => {
      if (rolesPermitidos.includes(rolUsuario)) {
        disponibles.push(nuevoEstado);
      }
    });
    return disponibles;
  }

  /**
   * Filtrar tickets visibles según el rol y pertenencia del usuario
   * @param {Array} tickets 
   * @param {Object} user 
   * @returns {Array}
   */
  filtrarPorRol(tickets, user) {
    const { rol, id } = user;
    switch (rol) {
      case ROLES.SOLICITANTE:
        return tickets.filter(t => t.id_solicitante === id);
      case ROLES.DESARROLLADOR:
        return tickets.filter(t => t.asignadoId === id || t.estado === 'En Desarrollo');
      case ROLES.TESTER:
        return tickets.filter(t =>
          ['En Pruebas QA', 'En Pruebas UAT', 'Listo para Integración'].includes(t.estado)
        );
      default:
        return tickets; // Gestor, Director, CCB, Líder ven todos
    }
  }

  /**
   * Filtrar tickets que requieren atención activa según el rol del usuario (bandeja de tareas)
   * @param {Array} tickets 
   * @param {Object} user 
   * @returns {Array}
   */
  filtrarBandeja(tickets, user) {
    const { rol } = user;
    const mapa = {
      [ROLES.GESTOR_CONFIGURACION]:  ['Solicitado', 'En Análisis', 'Listo para Integración'],
      [ROLES.DIRECTOR]:              ['Solicitado', 'Pendiente de Aprobación'],
      [ROLES.CCB]:                   ['Pendiente de Aprobación'],
      [ROLES.LIDER_TECNICO]:         ['En Análisis', 'En Desarrollo', 'En Pruebas QA'],
      [ROLES.DESARROLLADOR]:         ['Aprobado', 'En Desarrollo'],
      [ROLES.TESTER]:                ['En Pruebas QA', 'En Pruebas UAT'],
      [ROLES.SOLICITANTE]:           ['Solicitado'],
    };
    const estados = mapa[rol] || [];
    return tickets.filter(t => estados.includes(t.estado));
  }

  /**
   * Calcular estadísticas agregadas sobre un conjunto de tickets
   * @param {Array} tickets 
   * @returns {Object}
   */
  calcularStats(tickets) {
    const stats = {
      total: tickets.length,
      porEstado: {},
      porImpacto: {},
    };
    
    ESTADOS.forEach(e => (stats.porEstado[e] = 0));
    IMPACTOS.forEach(i => (stats.porImpacto[i] = 0));
    
    tickets.forEach(t => {
      if (stats.porEstado[t.estado] !== undefined) stats.porEstado[t.estado]++;
      if (stats.porImpacto[t.prioridad] !== undefined) stats.porImpacto[t.prioridad]++;
    });
    
    return stats;
  }
}

module.exports = new WorkflowService();
