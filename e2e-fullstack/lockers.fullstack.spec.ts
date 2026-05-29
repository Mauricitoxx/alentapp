import { test, expect as playwrightExpect } from '@playwright/test';

test.describe('Lockers Full-Stack E2E', () => {

 // =========================================================================
  // ESCENARIO 1: ALTA DE CASILLERO (¡Ahora Dinámico!)
  // =========================================================================
  test('debe crear un casillero real desde la interfaz y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('http://localhost:5173/lockers');

    // 2. Hacemos clic en tu botón azul "+ Agregar Casillero"
    const btnAgregar = page.getByRole('button', { name: /Agregar Casillero/i });
    await playwrightExpect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    // 3. Esperamos a que el modal aparezca con su título real
    await playwrightExpect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    // 🌟 TRUCO DINÁMICO: Genera un número aleatorio entre 100 y 999 en cada ejecución
    const numeroAleatorio = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    const numeroLocker = numeroAleatorio.toString(); 
    
    const ubicacionLocker = `Pasillo Central E2E - ${numeroLocker}`; // Le sumamos el número a la ubicación para identificarlo al toque

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

  // =========================================================================
  // ESCENARIO 2: MODIFICACIÓN DE CASILLERO (Adaptado a tus pantallas reales)
  // =========================================================================
 test('debe editar un casillero existente desde la interfaz y ver los cambios reflejados', async ({ page }) => {
    // 1. Navegamos a tu pantalla de Gestión de Casilleros
    await page.goto('http://localhost:5173/lockers');

    // 🌟 NUEVA ESTRATEGIA: Buscamos la fila que dice "66" (el casillero disponible de tu captura)
    // y hacemos clic en el botón de edición (lápiz) que está ADENTRO de esa fila específica.
    const filaCasillero = page.locator('tr').filter({ hasText: '2' });
    const btnEditar = filaCasillero.getByRole('button').first(); 
    
    await playwrightExpect(btnEditar).toBeVisible();
    await btnEditar.click();

    // 3. Esperamos a que se abra el modal con el título real de tu captura
    await playwrightExpect(page.getByText('Modificar Casillero')).toBeVisible();

    const nuevaUbicacion = 'pasillo demujer Modificado E2E';

      // Buscamos el segundo input de la pantalla (.nth(1) porque empieza a contar desde 0)
    const inputUbicacion = page.locator('input[type="text"], input:not([type])').nth(1);
    await inputUbicacion.click();

    // Borramos lo que tenga y escribimos la nueva ubicación
    await inputUbicacion.press('Control+A');
    await inputUbicacion.press('Backspace');
    await inputUbicacion.fill(nuevaUbicacion);

    // 5. Hacemos clic en tu botón azul que confirma la acción: "Guardar Cambios"
    const btnGuardar = page.getByRole('button', { name: 'Guardar Cambios' });
    await playwrightExpect(btnGuardar).toBeVisible();
    await btnGuardar.click();

    // 6. VERIFICACIÓN E2E: El modal se cierra correctamente y los cambios impactan en la grilla
    await playwrightExpect(btnGuardar).toBeHidden({ timeout: 10000 });
    await playwrightExpect(page.getByText(nuevaUbicacion).first()).toBeVisible();
  });

});