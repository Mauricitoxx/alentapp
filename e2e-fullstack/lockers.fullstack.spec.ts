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