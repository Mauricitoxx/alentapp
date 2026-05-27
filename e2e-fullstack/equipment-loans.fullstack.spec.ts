import { test, expect as playwrightExpect } from '@playwright/test';

test.describe('Equipment Loans Full-Stack E2E', () => {

  test('debe permitir crear y luego actualizar un préstamo de equipo', async ({ page }) => {
    
    // Primero, creamos un miembro para garantizar que haya uno para el préstamo
    await page.goto('http://localhost:5173/socios');
    const btnAgregarSocio = page.getByRole('button', { name: /Agregar Socio/i });
    if (await btnAgregarSocio.isVisible()) {
        await btnAgregarSocio.click();
        await page.getByPlaceholder('Ej: 12345678').fill('99999999');
        await page.getByPlaceholder('Ej: Juan Pérez').fill('Socio Préstamo E2E');
        await page.getByPlaceholder('ejemplo@correo.com').fill('prestamo@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('2000-01-01');
        await page.getByRole('button', { name: 'Crear Socio' }).click();
        await playwrightExpect(btnAgregarSocio).toBeVisible({ timeout: 5000 }); // esperar a que el modal cierre
    }

    // Navegar a préstamos de equipos
    await page.goto('http://localhost:5173/equipment-loans');

    // 1. Alta del préstamo
    const btnAgregar = page.getByRole('button', { name: /Nuevo Préstamo/i });
    await playwrightExpect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    await playwrightExpect(page.getByText('Registrar Nuevo Préstamo')).toBeVisible();

    const itemName = 'Pelota de Básquet E2E';
    
    // Seleccionamos el primer miembro del Combobox
    const comboboxInput = page.getByRole('combobox');
    await comboboxInput.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByPlaceholder('Ej. Raqueta de Tenis').fill(itemName);
    
    // Llenar fecha de devolución (un día después)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().slice(0, 16); // Formato YYYY-MM-DDThh:mm
    await page.locator('input[type="datetime-local"]').fill(dateString);

    const btnCrear = page.getByRole('button', { name: 'Crear Préstamo' });
    await btnCrear.click();

    // Verificar que se creó y aparece en la tabla
    await playwrightExpect(page.getByText(itemName, { exact: true }).first()).toBeVisible();

    // 2. Edición del préstamo
    // Hacemos click en el botón de editar (lapiz)
    const row = page.locator('tr', { hasText: itemName }).first();
    await row.getByRole('button').first().click(); 

    await playwrightExpect(page.getByText('Editar Préstamo')).toBeVisible();

    // Cambiar estado a 'Returned'
    await page.locator('select').selectOption('Returned');

    const btnGuardar = page.getByRole('button', { name: 'Guardar Cambios' });
    await btnGuardar.click();

    // Verificar actualización: el modal debe cerrarse
    await playwrightExpect(page.getByText('Editar Préstamo')).toBeHidden();
    
    // En la tabla, la fila ahora debería decir "Returned" en vez de "Loaned"
    const updatedRow = page.locator('tr', { hasText: itemName }).first();
    await playwrightExpect(updatedRow.getByText('Returned')).toBeVisible();
  });
});
