import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api/v1';

/**
 * Tests E2E Full-Stack para Préstamos de Equipamiento.
 * Playwright interactúa con el frontend en localhost:5173 y la API real en localhost:3001.
 */
test.describe('Equipment Loans - Full-Stack E2E', () => {
  const dni = '99991111';
  const memberName = 'Socio Préstamo E2E';
  
  test.beforeAll(async ({ request }) => {
    // Sembramos un socio real vía API para que exista en el combobox de los tests
    await request.post(`${API}/socios`, {
      data: {
        name: memberName,
        dni,
        email: `prestamo-${dni}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
  });

  test('1. debe crear un préstamo desde la UI y mostrarlo en la tabla', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5174'}/equipment-loans`);

    // Clic en Nuevo Préstamo
    await page.locator('button:has-text("Nuevo Préstamo")').click();
    await expect(page.getByText('Registrar Nuevo Préstamo')).toBeVisible();

    // Seleccionar el socio
    const socioField = page.getByRole('textbox', { name: 'Socio' });
    await expect(socioField).toBeVisible();
    await socioField.click();
    await socioField.fill('Socio Préstamo');
    
    // Esperamos un segundo para que busque y renderice el popover (combobox)
    await page.waitForTimeout(500); 
    const socioResult = page.getByText(memberName, { exact: true });
    await expect(socioResult).toBeVisible();
    await socioResult.click();

    // Completar datos del préstamo
    const fmt = (d: Date) => d.toISOString().slice(0, 16);
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 días a futuro

    await page.getByPlaceholder('Ej. Raqueta de Tenis').fill('Pelota Oficial E2E');
    await page.getByLabel(/Fecha de Devolución/i).fill(fmt(futureDate));

    // Guardar
    await page.getByRole('button', { name: 'Crear Préstamo' }).click();

    // Verificar que se haya cerrado el modal y aparezca en la tabla
    await expect(page.getByRole('button', { name: 'Crear Préstamo' })).toBeHidden();
    await expect(page.getByText('Pelota Oficial E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loaned')).toBeVisible();
  });

});
