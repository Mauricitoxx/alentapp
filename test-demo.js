// Script para demostrar que el flujo end-to-end funciona
const API_URL = 'http://localhost:3000/api/v1';

async function testEquipmentLoans() {
  console.log('--- INICIANDO DEMO END-TO-END ---');

  // 1. Intentar crear un prestamo con un socio inexistente (Debe fallar con 404)
  console.log('\n[1] Intentando crear préstamo para socio inexistente...');
  try {
    const res = await fetch(`${API_URL}/equipment-loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: 'Raqueta',
        due_date: '2099-12-31T00:00:00.000Z',
        member_id: '00000000-0000-0000-0000-000000000000'
      })
    });
    console.log('HTTP Status:', res.status);
    console.log('Respuesta:', await res.json());
  } catch (error) {
    console.error('Error de red:', error.message);
  }

  // 2. Crear un socio real primero para poder prestarle
  console.log('\n[2] Creando un socio real "Pleno" para probar...');
  let realMemberId = '';
  try {
    const memberRes = await fetch(`${API_URL}/socios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: `DEMO-${Date.now()}`,
        name: 'Socio Demo',
        email: `demo-${Date.now()}@club.com`,
        birthdate: '1990-01-01',
        category: 'Pleno'
      })
    });
    const memberData = await memberRes.json();
    realMemberId = memberData.data.id;
    console.log('Socio creado exitosamente con ID:', realMemberId);
  } catch (error) {
    console.error('No se pudo crear el socio:', error.message);
    return;
  }

  // 3. Crear préstamo con el socio real y fechas válidas (Debe funcionar con 201)
  console.log('\n[3] Creando préstamo para el socio real (Validación Exitosa)...');
  try {
    const res = await fetch(`${API_URL}/equipment-loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: 'Raqueta de Tenis Profesional',
        due_date: '2099-12-31T00:00:00.000Z',
        member_id: realMemberId
      })
    });
    console.log('HTTP Status:', res.status);
    console.log('Respuesta:', await res.json());
  } catch (error) {
    console.error('Error de red:', error.message);
  }

  // 4. Obtener todos los préstamos para ver que persistió en PostgreSQL
  console.log('\n[4] Solicitando al backend todos los préstamos registrados (GET)...');
  try {
    const res = await fetch(`${API_URL}/equipment-loans`);
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log(`Se encontraron ${data.data.length} préstamos en la base de datos.`);
    console.log('Último préstamo:', data.data[0]); // Por el orderBy desc
  } catch (error) {
    console.error('Error de red:', error.message);
  }

  console.log('\n--- DEMO FINALIZADA ---');
}

testEquipmentLoans();
