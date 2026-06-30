/**
 * models/CronogramaModel.js — Capa de Acceso a Datos para Cronograma de Actividades
 * Gestiona actividades del cronograma de proyectos
 */

'use strict';

const { query } = require('../config/db');

const BASE_ACTIVIDAD = `
  SELECT
    ca.id_actividad,
    ca.id_proyecto,
    ca.id_fase,
    ca.id_usuario,
    ca.nombre,
    ca.descripcion,
    ca.fecha_inicio,
    ca.fecha_fin,
    ca.es_reportable,
    ca.id_entregable,
    ca.porcentaje_avance,
    ca.estado,
    f.nombre AS fase_nombre,
    e.nombre AS etapa_nombre,
    sc.ticket_id AS entregable_ticket_id,
    sc.titulo AS entregable_titulo,
    sc.estado_actual AS entregable_estado,
    u.nombre_completo AS asignado_nombre
  FROM cronograma_actividades ca
  LEFT JOIN fases f ON ca.id_fase = f.id_fase
  LEFT JOIN etapas e ON f.id_etapa = e.id_etapa
  LEFT JOIN solicitudes_cambio sc ON ca.id_entregable = sc.id_sc
  LEFT JOIN usuarios u ON ca.id_usuario = u.id_usuario
`;

class CronogramaModel {

  /** Obtener actividades de un proyecto */
  async findByProyecto(idProyecto) {
    const sql = BASE_ACTIVIDAD + ' WHERE ca.id_proyecto = ? ORDER BY ca.fecha_inicio ASC, ca.id_actividad ASC';
    return query(sql, [idProyecto]);
  }

  /** Obtener actividad por ID */
  async findById(idActividad) {
    const sql = BASE_ACTIVIDAD + ' WHERE ca.id_actividad = ?';
    const rows = await query(sql, [idActividad]);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Crear actividad en el cronograma */
  async create(data) {
    const { idProyecto, idFase, idUsuario, nombre, descripcion, fechaInicio, fechaFin, esReportable, idEntregable, porcentaje_avance, estado } = data;
    
    let pct = parseFloat(porcentaje_avance);
    if (isNaN(pct)) pct = 0;

    let DB_estado = estado || 'Pendiente';
    if (DB_estado === 'Completada') DB_estado = 'Completado';
    
    if (pct === 100) DB_estado = 'Completado';
    else if (pct > 0 && DB_estado === 'Pendiente') DB_estado = 'En Progreso';

    const sql = `
      INSERT INTO cronograma_actividades
        (id_proyecto, id_fase, id_usuario, nombre, descripcion, fecha_inicio, fecha_fin, es_reportable, id_entregable, porcentaje_avance, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return query(sql, [
      idProyecto,
      idFase || null,
      idUsuario || null,
      nombre,
      descripcion || '',
      fechaInicio,
      fechaFin,
      esReportable !== undefined ? (esReportable ? 1 : 0) : 1,
      idEntregable || null,
      pct,
      DB_estado
    ]);
  }

  /** Actualizar actividad */
  async update(idActividad, data) {
    const { idFase, idUsuario, nombre, descripcion, fechaInicio, fechaFin, esReportable, idEntregable, estado, porcentaje_avance } = data;
    
    let DB_estado = estado || 'Pendiente';
    if (DB_estado === 'Completada') DB_estado = 'Completado';

    let pct = parseFloat(porcentaje_avance);
    if (isNaN(pct)) {
      pct = DB_estado === 'Completado' ? 100 : (DB_estado === 'En Progreso' ? 50 : 0);
    } else {
      pct = Math.min(100, Math.max(0, pct));
      // Sincronizar estado si el admin cambió el porcentaje pero no el estado
      if (pct === 100) DB_estado = 'Completado';
      else if (pct > 0 && DB_estado === 'Pendiente') DB_estado = 'En Progreso';
      else if (pct === 0 && DB_estado === 'En Progreso') DB_estado = 'Pendiente';
    }

    const sql = `
      UPDATE cronograma_actividades
      SET id_fase = ?, id_usuario = ?, nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?,
          es_reportable = ?, id_entregable = ?, estado = ?, porcentaje_avance = ?
      WHERE id_actividad = ?
    `;
    return query(sql, [
      idFase || null,
      idUsuario || null,
      nombre,
      descripcion || '',
      fechaInicio,
      fechaFin,
      esReportable !== undefined ? (esReportable ? 1 : 0) : 1,
      idEntregable || null,
      DB_estado,
      pct,
      idActividad,
    ]);
  }

  /** Actualizar porcentaje de avance de una actividad */
  async updateAvance(idActividad, porcentaje) {
    const pct = Math.min(100, Math.max(0, parseFloat(porcentaje) || 0));
    // Actualizar estado automáticamente según el %
    let estado = 'Pendiente';
    if (pct > 0 && pct < 100) estado = 'En Progreso';
    else if (pct >= 100) estado = 'Completado';

    return query(
      'UPDATE cronograma_actividades SET porcentaje_avance = ?, estado = ? WHERE id_actividad = ?',
      [pct, estado, idActividad]
    );
  }

  /** Eliminar actividad */
  async delete(idActividad) {
    return query('DELETE FROM cronograma_actividades WHERE id_actividad = ?', [idActividad]);
  }

  /** Resumen del cronograma: total actividades, promedio avance, completadas */
  async getResumen(idProyecto) {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COALESCE(AVG(porcentaje_avance), 0) AS promedio,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN estado = 'En Progreso' THEN 1 ELSE 0 END) AS en_progreso,
        SUM(CASE WHEN estado = 'Bloqueado' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM cronograma_actividades
      WHERE id_proyecto = ?
    `;
    const rows = await query(sql, [idProyecto]);
    return rows[0] || { total: 0, promedio: 0, completadas: 0, en_progreso: 0, bloqueadas: 0, pendientes: 0 };
  }

  /**
   * Generar cronograma automático a partir de metodología y fechas del proyecto.
   * Scrum → sprints de 2 semanas con actividades estándar.
   * RUP   → 4 fases proporcionales con actividades por fase.
   * @param {number} idProyecto
   * @param {string} metodologiaNombre  Nombre de la metodología (insensitive)
   * @param {string} fechaInicio        YYYY-MM-DD
   * @param {string} fechaFin           YYYY-MM-DD
   * @param {number|null} idMetodologia BD id para vincular fases
   * @returns {Promise<Array>} actividades creadas
   */
  async generarCronogramaAutomatico(idProyecto, metodologiaNombre, fechaInicio, fechaFin, idMetodologia) {
    if (!fechaInicio || !fechaFin) return [];

    const inicio = new Date(fechaInicio);
    const fin    = new Date(fechaFin);
    if (inicio >= fin) return [];

    // 1. Obtener fases de la metodología para vincularlas (y mapeo general)
    let fasesMap = {}; // nombre normalizado → id_fase
    if (idMetodologia) {
      const fasesRows = await query(`
        SELECT f.id_fase, f.nombre AS fase_nombre, e.nombre AS etapa_nombre
        FROM fases f
        JOIN etapas e ON f.id_etapa = e.id_etapa
        WHERE e.id_metodologia = ?
        ORDER BY e.orden ASC, f.orden ASC
      `, [idMetodologia]);
      fasesRows.forEach(f => {
        fasesMap[f.fase_nombre.toLowerCase()] = f.id_fase;
        fasesMap[f.etapa_nombre.toLowerCase()] = f.id_fase; // fallback a etapa
        if (f.etapa_nombre.toLowerCase() === 'iniciación') {
          fasesMap['inicio'] = f.id_fase;
        }
      });
    }

    const nombre = (metodologiaNombre || '').toLowerCase();
    const actividades = [];

    // 2. Intentar obtener los Elementos de Configuración (ECMs) reales de la base de datos
    let ecms = [];
    if (idMetodologia) {
      try {
        ecms = await query(`
          SELECT ecm.id_ecm, ecm.nombre AS ecm_nombre, ecm.tipo AS ecm_tipo, ecm.descripcion AS ecm_desc,
                 f.id_fase, f.nombre AS fase_nombre, e.id_etapa, e.nombre AS etapa_nombre, e.orden AS etapa_orden, f.orden AS fase_orden
          FROM elementos_config_metodologia ecm
          JOIN fases f ON ecm.id_fase = f.id_fase
          JOIN etapas e ON f.id_etapa = e.id_etapa
          WHERE e.id_metodologia = ?
          ORDER BY e.orden ASC, f.orden ASC, ecm.id_ecm ASC
        `, [idMetodologia]);
      } catch (err) {
        console.warn('⚠️ Error al consultar ECMs para cronograma dinámico:', err.message);
      }
    }

    if (ecms && ecms.length > 0) {
      // ── MODO DINÁMICO: Generar a partir de los ECMs de la base de datos ──
      const etapasUnicas = [];
      const ecmsPorEtapa = {};

      ecms.forEach(item => {
        const idEtapa = item.id_etapa;
        if (!ecmsPorEtapa[idEtapa]) {
          ecmsPorEtapa[idEtapa] = [];
          etapasUnicas.push({
            id_etapa: idEtapa,
            nombre: item.etapa_nombre,
            orden: item.etapa_orden
          });
        }
        ecmsPorEtapa[idEtapa].push(item);
      });

      // Ordenar las etapas únicas por su orden
      etapasUnicas.sort((a, b) => a.orden - b.orden);

      const totalMs = fin - inicio;
      const numEtapas = etapasUnicas.length;

      // Proporciones por etapa
      let proporcionesEtapas = {};
      if (nombre.includes('rup') && numEtapas === 4) {
        // RUP estándar: 10% Iniciación, 25% Elaboración, 50% Construcción, 15% Transición
        const props = [0.10, 0.25, 0.50, 0.15];
        etapasUnicas.forEach((et, idx) => {
          proporcionesEtapas[et.id_etapa] = props[idx];
        });
      } else {
        // Distribución equitativa
        etapasUnicas.forEach(et => {
          proporcionesEtapas[et.id_etapa] = 1.0 / numEtapas;
        });
      }

      let cursor = new Date(inicio);

      for (let idxEtapa = 0; idxEtapa < etapasUnicas.length; idxEtapa++) {
        const et = etapasUnicas[idxEtapa];
        const pct = proporcionesEtapas[et.id_etapa];
        const durMsEtapa = Math.round(totalMs * pct);

        const items = ecmsPorEtapa[et.id_etapa] || [];
        if (items.length === 0) continue;

        const durMsPorECM = Math.floor(durMsEtapa / items.length);
        let ecmCursor = new Date(cursor);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const isLast = (i === items.length - 1 && idxEtapa === etapasUnicas.length - 1);

          let ecmFin = isLast
            ? new Date(fin)
            : new Date(ecmCursor.getTime() + durMsPorECM - 86400000); // Terminar un día antes del siguiente

          if (ecmFin > fin) ecmFin = new Date(fin);
          if (ecmFin < ecmCursor) ecmFin = new Date(ecmCursor);

          // Prefijo dinámico según tipo
          let prefijo = 'Elaborar';
          const tipoLower = (item.ecm_tipo || '').toLowerCase();
          if (tipoLower === 'codigo' || tipoLower === 'código') {
            prefijo = 'Desarrollar';
          } else if (tipoLower === 'diagrama') {
            prefijo = 'Diseñar';
          } else if (tipoLower === 'prueba') {
            prefijo = 'Ejecutar pruebas de';
          }

          actividades.push({
            nombre: `[${et.nombre}] ${prefijo}: ${item.ecm_nombre}`,
            descripcion: item.ecm_desc || `Entregable de configuración: ${item.ecm_nombre}`,
            fechaInicio: ecmCursor.toISOString().split('T')[0],
            fechaFin: ecmFin.toISOString().split('T')[0],
            idFase: item.id_fase
          });

          ecmCursor = new Date(ecmFin.getTime() + 86400000);
        }

        cursor = new Date(cursor.getTime() + durMsEtapa);
      }
    } else {
      // ── MODO DE RESPALDO (FALLBACK): Estructura estática si no hay ECMs en BD ──
      if (nombre.includes('scrum')) {
        // ── SCRUM: sprints de 2 semanas ──────────────────────────────────────
        const SPRINT_DAYS = 14;
        let sprintNum = 1;
        let sprintInicio = new Date(inicio);

        while (sprintInicio < fin) {
          let sprintFin = new Date(sprintInicio);
          sprintFin.setDate(sprintFin.getDate() + SPRINT_DAYS - 1);
          if (sprintFin > fin) sprintFin = new Date(fin);

          const fi = sprintInicio.toISOString().split('T')[0];
          const ff = sprintFin.toISOString().split('T')[0];

          // Día 1 del sprint → Planning
          const planningFin = new Date(sprintInicio);
          planningFin.setDate(planningFin.getDate() + 1);
          actividades.push({
            nombre:      `Sprint ${sprintNum} — Sprint Planning`,
            descripcion: `Planificación del Sprint ${sprintNum}: definir objetivos y tareas del backlog a abordar.`,
            fechaInicio: fi,
            fechaFin:    planningFin.toISOString().split('T')[0],
            idFase:      fasesMap['sprint planning'] || fasesMap['planning'] || null,
          });

          // Cuerpo del sprint → Desarrollo
          const devInicio = new Date(sprintInicio);
          devInicio.setDate(devInicio.getDate() + 2);
          const devFin = new Date(sprintFin);
          devFin.setDate(devFin.getDate() - 2);
          if (devInicio <= devFin) {
            actividades.push({
              nombre:      `Sprint ${sprintNum} — Desarrollo e Implementación`,
              descripcion: `Ejecución de las tareas del Sprint ${sprintNum}: codificación, integración y pruebas unitarias.`,
              fechaInicio: devInicio.toISOString().split('T')[0],
              fechaFin:    devFin.toISOString().split('T')[0],
              idFase:      fasesMap['desarrollo'] || fasesMap['implementación'] || null,
            });
          }

          // Último día - 1 → Sprint Review
          const reviewFin = new Date(sprintFin);
          reviewFin.setDate(reviewFin.getDate() - 1);
          const reviewInicio = new Date(reviewFin);
          actividades.push({
            nombre:      `Sprint ${sprintNum} — Sprint Review`,
            descripcion: `Revisión del incremento del Sprint ${sprintNum} con el Product Owner y stakeholders.`,
            fechaInicio: reviewInicio.toISOString().split('T')[0],
            fechaFin:    reviewFin.toISOString().split('T')[0],
            idFase:      fasesMap['sprint review'] || fasesMap['review'] || null,
          });

          // Último día → Retrospectiva
          actividades.push({
            nombre:      `Sprint ${sprintNum} — Retrospectiva`,
            descripcion: `Retrospectiva del Sprint ${sprintNum}: analizar qué funcionó, qué mejorar y compromisos del equipo.`,
            fechaInicio: sprintFin.toISOString().split('T')[0],
            fechaFin:    sprintFin.toISOString().split('T')[0],
            idFase:      fasesMap['retrospectiva'] || null,
          });

          sprintInicio.setDate(sprintInicio.getDate() + SPRINT_DAYS);
          sprintNum++;
        }

      } else if (nombre.includes('rup')) {
        // ── RUP: 4 fases proporcionales ──────────────────────────────────────
        const totalMs = fin - inicio;
        const proporciones = [
          { pct: 0.10, etapa: 'iniciación',    label: 'Iniciación',    actividades: [
            { n: 'Definición del alcance',         d: 'Establecer la visión del proyecto, alcance inicial y viabilidad.' },
            { n: 'Análisis de riesgos iniciales',  d: 'Identificar y priorizar riesgos técnicos y de negocio.' },
            { n: 'Modelo de negocio',              d: 'Documentar los procesos y actores del negocio.' },
          ]},
          { pct: 0.25, etapa: 'elaboración',   label: 'Elaboración',   actividades: [
            { n: 'Arquitectura base del sistema',  d: 'Definir la arquitectura de referencia y patrones de diseño.' },
            { n: 'Refinamiento de requisitos',     d: 'Especificar casos de uso principales y requisitos no funcionales.' },
            { n: 'Prototipo arquitectónico',       d: 'Construir prototipo que valide decisiones de arquitectura.' },
            { n: 'Plan de iteraciones',            d: 'Planificar las iteraciones de construcción.' },
          ]},
          { pct: 0.50, etapa: 'construcción',  label: 'Construcción',  actividades: [
            { n: 'Implementación de componentes',  d: 'Codificación de módulos y componentes del sistema.' },
            { n: 'Integración y pruebas unitarias',d: 'Integración continua y ejecución de pruebas unitarias.' },
            { n: 'Pruebas de sistema',             d: 'Pruebas funcionales, de rendimiento y de regresión.' },
            { n: 'Documentación técnica',          d: 'Elaboración de manuales técnicos y de usuario.' },
          ]},
          { pct: 0.15, etapa: 'transición',    label: 'Transición',    actividades: [
            { n: 'Pruebas de aceptación (UAT)',    d: 'Validación del sistema con usuarios finales.' },
            { n: 'Despliegue en producción',       d: 'Instalación y configuración del sistema en ambiente productivo.' },
            { n: 'Capacitación de usuarios',       d: 'Entrenamiento a los usuarios finales del sistema.' },
          ]},
        ];

        let cursor = new Date(inicio);
        for (const fase of proporciones) {
          const durMs  = Math.round(totalMs * fase.pct);
          const faseInicio = new Date(cursor);
          const faseFin    = new Date(cursor.getTime() + durMs);
          if (faseFin > fin) faseFin.setTime(fin.getTime());

          const durAct = Math.floor(durMs / fase.actividades.length);
          let actCursor = new Date(faseInicio);

          const idFaseVinculada = fasesMap[fase.etapa] || fasesMap[fase.label.toLowerCase()] || null;

          for (let i = 0; i < fase.actividades.length; i++) {
            const act = fase.actividades[i];
            const actFin = i === fase.actividades.length - 1
              ? new Date(faseFin)
              : new Date(actCursor.getTime() + durAct);

            actividades.push({
              nombre:      `[${fase.label}] ${act.n}`,
              descripcion: act.d,
              fechaInicio: actCursor.toISOString().split('T')[0],
              fechaFin:    (actFin > fin ? new Date(fin) : actFin).toISOString().split('T')[0],
              idFase:      idFaseVinculada,
            });
            actCursor = new Date(actFin.getTime() + 86400000);
          }

          cursor = new Date(faseFin.getTime() + 86400000);
        }
      } else {
        // ── Metodología genérica: actividades semanales ───────────────────────
        const totalDays = Math.round((fin - inicio) / 86400000);
        const semanas   = Math.max(1, Math.ceil(totalDays / 7));
        let cur = new Date(inicio);

        for (let s = 1; s <= semanas; s++) {
          const sf = new Date(cur);
          sf.setDate(sf.getDate() + 6);
          if (sf > fin) sf.setTime(fin.getTime());
          actividades.push({
            nombre:      `Semana ${s} — Actividad de proyecto`,
            descripcion: `Actividad planificada para la semana ${s} del proyecto.`,
            fechaInicio: cur.toISOString().split('T')[0],
            fechaFin:    sf.toISOString().split('T')[0],
            idFase:      null,
          });
          cur.setDate(cur.getDate() + 7);
          if (cur > fin) break;
        }
      }
    }

    // Insertar todas las actividades en la BD
    const insertadas = [];
    for (const act of actividades) {
      const result = await this.create({
        idProyecto,
        idFase:    act.idFase,
        idUsuario: null,
        nombre:    act.nombre,
        descripcion: act.descripcion,
        fechaInicio: act.fechaInicio,
        fechaFin:    act.fechaFin,
        esReportable: true,
        idEntregable: null,
        porcentaje_avance: 0,
        estado: 'Pendiente',
      });
      insertadas.push(result);
    }
    return insertadas;
  }

  /** Sincronizar el avance de la actividad vinculada a un ticket */
  async syncAvanceConTicket(idSc, nuevoEstado, idUsuarioCambio, idProyecto) {
    const mapped = {
      'Solicitado':                { pct: 0,   estado: 'Pendiente' },
      'En Análisis':              { pct: 10,  estado: 'En Progreso' },
      'Pendiente de Aprobación':  { pct: 20,  estado: 'En Progreso' },
      'Aprobado':                  { pct: 30,  estado: 'En Progreso' },
      'En Desarrollo':             { pct: 50,  estado: 'En Progreso' },
      'En Pruebas QA':             { pct: 70,  estado: 'En Progreso' },
      'En Pruebas UAT':            { pct: 80,  estado: 'En Progreso' },
      'Listo para Integración':  { pct: 90,  estado: 'En Progreso' },
      'Liberado':                  { pct: 100, estado: 'Completado' },
      'Rechazado':                 { pct: 0,   estado: 'Bloqueado' },
      'Descartado':                { pct: 0,   estado: 'Pendiente' }
    }[nuevoEstado];

    if (!mapped) return null;

    // Buscar actividad vinculada al ticket — incluir id_usuario asignado
    const rows = await query(
      'SELECT id_actividad, id_usuario FROM cronograma_actividades WHERE id_entregable = ?',
      [idSc]
    );

    let idActividad;
    let idResponsable;

    if (rows.length === 0) {
      // Solo crear la actividad en el cronograma si el ticket ya ha sido aprobado o está en desarrollo/pruebas/liberado
      const estadosAprobados = ['Aprobado', 'En Desarrollo', 'En Pruebas QA', 'En Pruebas UAT', 'Listo para Integración', 'Liberado'];
      if (!estadosAprobados.includes(nuevoEstado)) {
        return null; // Aún no es parte del cronograma oficial del proyecto
      }

      // Auto-crear una actividad vinculada al ticket si no existe
      // 1. Obtener información del proyecto
      const projectRows = await query(
        'SELECT fecha_inicio, fecha_fin, id_metodologia FROM proyectos WHERE id_proyecto = ?',
        [idProyecto]
      );
      // 2. Obtener información del ticket
      const ticketRows = await query(
        'SELECT titulo, descripcion, id_desarrollador, ticket_id FROM solicitudes_cambio WHERE id_sc = ?',
        [idSc]
      );

      if (ticketRows.length === 0) return null;

      const ticket = ticketRows[0];
      const project = projectRows[0] || {};

      // 3. Buscar la primera fase de la metodología asociada, si existe
      let idFase = null;
      if (project.id_metodologia) {
        const phases = await query(
          `SELECT f.id_fase 
           FROM etapas e 
           JOIN fases f ON f.id_etapa = e.id_etapa 
           WHERE e.id_metodologia = ? 
           ORDER BY e.id_etapa ASC, f.id_fase ASC LIMIT 1`,
          [project.id_metodologia]
        );
        if (phases.length > 0) {
          idFase = phases[0].id_fase;
        }
      }

      // 4. Fechas por defecto (usar el día de hoy para que no inunde todo el calendario del proyecto)
      const hoy = new Date();
      const fechaInicio = hoy;
      const fechaFin = hoy;

      idResponsable = ticket.id_desarrollador || null;

      // 5. Insertar actividad
      const insertRes = await query(
        `INSERT INTO cronograma_actividades
          (id_proyecto, id_fase, id_usuario, nombre, descripcion, fecha_inicio, fecha_fin, es_reportable, id_entregable, porcentaje_avance, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          idProyecto,
          idFase,
          idResponsable,
          `${ticket.ticket_id}: ${ticket.titulo}`,
          ticket.descripcion || '',
          fechaInicio,
          fechaFin,
          idSc,
          mapped.pct,
          mapped.estado
        ]
      );
      idActividad = insertRes.insertId;
    } else {
      idActividad = rows[0].id_actividad;
      idResponsable = rows[0].id_usuario;

      // Actualizar avance de la actividad existente
      await query(
        'UPDATE cronograma_actividades SET porcentaje_avance = ?, estado = ? WHERE id_actividad = ?',
        [mapped.pct, mapped.estado, idActividad]
      );
    }

    // El reporte se registra a nombre del RESPONSABLE asignado (no de quien cambió el ticket)
    // Si la actividad no tiene responsable, usar quien hizo el cambio
    const idReportante = idResponsable || idUsuarioCambio;

    const sqlReport = `
      INSERT INTO reportes_avance (id_actividad, id_proyecto, id_usuario_reporta, porcentaje, comentario)
      VALUES (?, ?, ?, ?, ?)
    `;
    await query(sqlReport, [
      idActividad,
      idProyecto,
      idReportante,
      mapped.pct,
      `Avance automático: ticket pasó a "${nuevoEstado}".`
    ]);

    return { idActividad, ...mapped };
  }
}

module.exports = new CronogramaModel();
