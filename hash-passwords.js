/**
 * hash-passwords.js — Script de Migración de Claves Semilla a Bcrypt
 * Ejecutar una sola vez para hashear las contraseñas en la base de datos.
 */

'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('./config/db');

async function migratePasswords() {
  console.log('🏁 Iniciando migración de contraseñas a Bcrypt...');
  
  try {
    const users = await query('SELECT id_usuario, nombre_completo, correo, password_hash FROM usuarios');
    console.log(`🔍 Se encontraron ${users.length} usuarios en la base de datos.`);
    
    let migrados = 0;
    for (const u of users) {
      const isHashed = u.password_hash.startsWith('$2a$') || u.password_hash.startsWith('$2b$');
      
      if (!isHashed) {
        console.log(`  🔑 Hasheando clave para: ${u.correo} (actual: "${u.password_hash}")`);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password_hash, salt);
        
        await query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [hash, u.id_usuario]);
        migrados++;
      } else {
        console.log(`  ✅ Usuario ${u.correo} ya tiene su contraseña hasheada.`);
      }
    }
    
    console.log(`\n🎉 Migración finalizada con éxito.`);
    console.log(`   Total migrados: ${migrados}`);
  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
  } finally {
    // Cerrar el pool de conexiones para permitir que el script termine
    await pool.end();
    process.exit(0);
  }
}

migratePasswords();
