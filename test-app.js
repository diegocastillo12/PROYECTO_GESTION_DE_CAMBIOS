/**
 * test-app.js — Script de prueba para validar login y endpoints con las claves hasheadas
 */

'use strict';

async function testApp() {
  console.log('🧪 Iniciando pruebas de integración local...');

  try {
    // 1. Intentar hacer Login con clave hasheada (docente@upt.pe, clave: 123)
    console.log('🔄 1. Probando inicio de sesión (POST /login)...');
    const loginResp = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        correo: 'docente@upt.pe',
        password: '123',
      }),
      redirect: 'manual', // Evita seguir la redirección automática para obtener la cookie de sesión
    });

    const cookie = loginResp.headers.get('set-cookie');
    if (loginResp.status === 302 && cookie) {
      console.log('  ✅ Inicio de sesión exitoso. Redirección recibida y cookie de sesión obtenida.');
    } else {
      console.error(`  ❌ Error de login. Status: ${loginResp.status}`);
      process.exit(1);
    }

    // 2. Consumir el endpoint de la API con la cookie de sesión
    console.log('🔄 2. Solicitando listado de tickets filtrados (GET /api/tickets)...');
    const apiResp = await fetch('http://localhost:3000/api/tickets', {
      headers: {
        'Cookie': cookie,
      },
    });

    if (apiResp.ok) {
      const result = await apiResp.json();
      console.log(`  ✅ Listado obtenido. Éxito: ${result.success}`);
      console.log(`  📊 Cantidad de tickets visibles para Solicitante: ${result.data.length}`);
      if (result.data.length > 0) {
        console.log(`     Primer ticket: ${result.data[0].id} — "${result.data[0].titulo}" (Estado: ${result.data[0].estado})`);
      }
    } else {
      console.error(`  ❌ Error al llamar a la API. Status: ${apiResp.status}`);
      process.exit(1);
    }

    console.log('\n🎉 Todas las pruebas locales finalizaron con éxito.');
  } catch (err) {
    console.error('❌ Error de conexión o ejecución del test:', err.message);
    process.exit(1);
  }
}

testApp();
