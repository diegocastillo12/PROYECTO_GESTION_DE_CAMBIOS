/**
 * import-db.js — Script para importar la estructura y datos de 'base de datos 2.sql'
 * directamente en la base de datos configurada en el .env, ignorando la creación de
 * la base de datos 'Gestion_de_Cambios_catshelook' para usar la remota ('db_gestion_cambios').
 */

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importDb() {
  console.log('🔄 Conectando a la nueva base de datos para importar el script SQL...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   DB: ${process.env.DB_NAME}`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true // Habilitar ejecución de múltiples sentencias
    });

    console.log('✅ Conexión establecida. Leyendo archivo SQL...');
    const sqlFilePath = path.join(__dirname, 'base de datos 2.sql');
    let sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Remover las sentencias de CREATE DATABASE y USE para no intentar crear otra BD
    console.log('🧹 Limpiando sentencias de creación de base de datos del script...');
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS [`"'\w\s_-]+(\/\*.*?\*\/)?\s*;/gi, '-- CREATE DATABASE REMOVED');
    sql = sql.replace(/USE [`"'\w\s_-]+\s*;/gi, '-- USE DATABASE REMOVED');

    console.log('🚀 Ejecutando script de base de datos...');
    await connection.query(sql);
    console.log('🎉 ¡Estructura y datos de base de datos importados con éxito!');
  } catch (error) {
    console.error('❌ Error al importar la base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importDb();
