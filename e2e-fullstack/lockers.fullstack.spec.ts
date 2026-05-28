import { test, expect as playwrightExpect } from '@playwright/test';

test.describe('Lockers Full-Stack E2E', () => {

  test('debe crear un casillero real desde la interfaz y mostrarlo en la tabla', async ({ page }) => {
    // 🌟 CORRECCIÓN CLAVE: Cambiamos al puerto 5174 que descubrimos en tu UI
    await page.goto('http://localhost:5173/lockers');

    // 2. Hacemos clic en tu botón azul "+ Agregar Casillero"
    const btnAgregar = page.getByRole('button', { name: /Agregar Casillero/i });
    await playwrightExpect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    // 3. Esperamos a que el modal aparezca con su título real
    await playwrightExpect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    const numeroLocker = '15';
    const ubicacionLocker = 'Pasillo Central E2E';

    // 4. Llenamos usando tus placeholders exactos
    await page.getByPlaceholder('Ej: 14').fill(numeroLocker);
    await page.getByPlaceholder('Ej: Vestuario Masculino').fill(ubicacionLocker);

    // 5. Hacemos clic en el botón azul interno que confirma el Alta
    const btnCrear = page.getByRole('button', { name: 'Crear Casillero' });
    await btnCrear.click();

    // 6. VERIFICACIÓN E2E
    await playwrightExpect(btnCrear).toBeHidden({ timeout: 10000 });
    await playwrightExpect(page.getByText(numeroLocker, { exact: true }).first()).toBeVisible();
    await playwrightExpect(page.getByText(ubicacionLocker).first()).toBeVisible();
  });
});

// =========================================================================
// BLOQUE 3: ELIMINACIÓN DE CASILLEROS (DELETE)
// =========================================================================
test.describe('Lockers Delete - Full-Stack E2E', () => {

  test('debe eliminar un casillero libre desde la UI y hacerlo desaparecer de la tabla', async ({ page }) => {
    // 🌟 GENERACIÓN DINÁMICA: Creamos un número único para cada ejecución (entre 100 y 999)
    const numeroAleatorio = Math.floor(100 + Math.random() * 900).toString();
    const ubicacionDinamica = `Pasillo E2E - ${numeroAleatorio}`;

    // 1. Primero navegamos para crear el casillero en esta misma ejecución
    await page.goto('http://localhost:5173/lockers');

    // 2. Flujo rápido de Alta para asegurarnos de que el casillero SÍ exista antes de borrarlo
    const btnAgregar = page.getByRole('button', { name: /Agregar Casillero/i });
    await btnAgregar.click();
    await page.getByPlaceholder('Ej: 14').fill(numeroAleatorio);
    await page.getByPlaceholder('Ej: Vestuario Masculino').fill(ubicacionDinamica);
    await page.getByRole('button', { name: 'Crear Casillero' }).click();

    // 3. Esperamos a que impacte en la UI y sea visible en la tabla
    await playwrightExpect(page.getByText(ubicacionDinamica).first()).toBeVisible({ timeout: 10000 });

    // 4. Localizamos la fila exacta usando nuestro texto dinámico e irrepetible
    const filaLocker = page.locator('tr', { hasText: ubicacionDinamica }).first();
      
    // 5. Hacemos clic en el tacho de basura de ESA fila específica
    await filaLocker.locator('button').last().click();

    // 6. Validamos el modal de confirmación
    await playwrightExpect(page.getByText('Eliminar Casillero')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Eliminación' }).click();

    // 7. VERIFICACIÓN FINAL: El modal se cierra y la fila se destruye por completo
    await playwrightExpect(page.getByText('Eliminar Casillero')).toBeHidden();
    await playwrightExpect(filaLocker).toBeHidden({ timeout: 10000 });
  });
});