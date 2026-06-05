/**
 * config/db.js — Conexión MySQL2 para GestioCambios G04
 * Motor: HeidiSQL / MySQL local
 * Base de datos: gestiocambios_db
 */

'use strict';

const mysql = require('mysql2/promise');

// ─── POOL DE CONEXIONES ───────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             parseInt(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',        // ← cambia si tienes password en MySQL
  database:         process.env.DB_NAME     || 'gestiocambios_db',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  charset:          'utf8mb4',
  timezone:         '-05:00',
});

// ─── HELPER DE QUERIES ────────────────────────────────────────────────────────
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ─── CONSTANTES DEL SISTEMA (Importadas de constants.js) ──────────────────────
const { ROLES, ESTADOS, TIPOS_CAMBIO, IMPACTOS } = require('./constants');

// ─── TEST DE CONEXIÓN ─────────────────────────────────────────────────────────
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('  ✅ Conexión MySQL establecida correctamente.');
    
    // Auto-crear/modificar tabla versiones_ecs si es necesario
    try {
      // 1. Crear la tabla si no existe
      await conn.query(`
        CREATE TABLE IF NOT EXISTS versiones_ecs (
          id_version int(11) NOT NULL AUTO_INCREMENT,
          id_actividad int(11) NOT NULL,
          id_proyecto int(11) NOT NULL,
          version_numero varchar(20) NOT NULL,
          descripcion_cambio text DEFAULT NULL,
          id_usuario_autor int(11) NOT NULL,
          fecha_version timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      // 2. Verificar/agregar columnas archivo_ruta, archivo_nombre, contenido_texto y commit_sha
      const [columns] = await conn.query('SHOW COLUMNS FROM versiones_ecs');
      const hasRuta = columns.some(c => c.Field === 'archivo_ruta');
      const hasNombre = columns.some(c => c.Field === 'archivo_nombre');
      const hasContenido = columns.some(c => c.Field === 'contenido_texto');
      const hasSha = columns.some(c => c.Field === 'commit_sha');
      
      if (!hasRuta) {
        await conn.query('ALTER TABLE versiones_ecs ADD COLUMN archivo_ruta varchar(255) DEFAULT NULL');
        console.log('  🔧 Columna archivo_ruta agregada a versiones_ecs.');
      }
      if (!hasNombre) {
        await conn.query('ALTER TABLE versiones_ecs ADD COLUMN archivo_nombre varchar(255) DEFAULT NULL');
        console.log('  🔧 Columna archivo_nombre agregada a versiones_ecs.');
      }
      if (!hasContenido) {
        await conn.query('ALTER TABLE versiones_ecs ADD COLUMN contenido_texto longtext DEFAULT NULL');
        console.log('  🔧 Columna contenido_texto agregada a versiones_ecs.');
      }
      if (!hasSha) {
        await conn.query('ALTER TABLE versiones_ecs ADD COLUMN commit_sha varchar(40) DEFAULT NULL');
        console.log('  🔧 Columna commit_sha agregada a versiones_ecs.');
      }

      // 3. Verificar/agregar github_token en usuarios
      const [userCols] = await conn.query('SHOW COLUMNS FROM usuarios');
      const hasToken = userCols.some(c => c.Field === 'github_token');
      if (!hasToken) {
        await conn.query('ALTER TABLE usuarios ADD COLUMN github_token text DEFAULT NULL');
        console.log('  🔧 Columna github_token agregada a usuarios.');
      }

      // 4. Verificar/agregar github_repo en proyectos
      const [projCols] = await conn.query('SHOW COLUMNS FROM proyectos');
      const hasRepo = projCols.some(c => c.Field === 'github_repo');
      if (!hasRepo) {
        await conn.query('ALTER TABLE proyectos ADD COLUMN github_repo varchar(255) DEFAULT NULL');
        console.log('  🔧 Columna github_repo agregada a proyectos.');
      }
    } catch (dbErr) {
      console.warn('  ⚠️ Advertencia al verificar/inicializar tablas de GitHub:', dbErr.message);
    }

    conn.release();
    return true;
  } catch (err) {
    console.error('  ❌ Error al conectar con MySQL:', err.message);
    console.error('     Verifica host, puerto, usuario y contraseña en config/db.js');
    return false;
  }
}

module.exports = { pool, query, testConnection, ROLES, ESTADOS, TIPOS_CAMBIO, IMPACTOS };
