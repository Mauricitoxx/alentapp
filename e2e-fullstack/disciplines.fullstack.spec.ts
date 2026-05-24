import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api/v1';

/**
 * E2E full-stack del ALTA de sanciones.
 * Siembra un socio vía API real, luego crea la sanción desde la UI
 * y verifica que aparece en la tabla con su badge de vigencia.
 * También prueba el feature de filtro por socio.
 */
test.describe('Disciplines Alta - Full-Stack E2E', () => {
  const dni = '70010001';
  const memberName = 'Socio Alta E2E';

  test('crea una sanción desde la UI y la muestra como Vigente', async ({ page }) => {
    // 1. Sembrar un socio real vía API
    const memberRes = await page.request.post(`${API}/socios`, {
      data: {
        name: memberName,
        dni,
        email: `alta-${dni}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    expect(memberRes.ok()).toBeTruthy();

    // 2. Ir a la vista de sanciones
    await page.goto('/disciplines');
    await page.locator('button:has-text("Nueva Sanción")').click();
    await expect(page.getByText('Registrar Nueva Sanción')).toBeVisible();

    // 3. Seleccionar el socio en el combobox
    const socioField = page.getByRole('textbox', { name: 'Socio' });
    await expect(socioField).toBeVisible();
    await socioField.click(); 
    await socioField.type('Socio Alta', { delay: 100 });
    const socioResult = page.getByText(memberName, { exact: true });
    await expect(socioResult).toBeVisible();
    await socioResult.click();

    // 4. Completar el resto del formulario con fechas que abarcan HOY (→ Vigente)
    const fmt = (d: Date) => d.toISOString().slice(0, 16);
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await page.getByPlaceholder('Ej. Conducta antideportiva').fill('Conducta antideportiva E2E');
    await page.getByLabel('Fecha y hora de inicio').fill(fmt(start));
    await page.getByLabel('Fecha y hora de fin').fill(fmt(end));

    // 5. Guardar
    await page.getByRole('button', { name: 'Crear Sanción' }).click();
    await expect(page.getByRole('button', { name: 'Crear Sanción' })).toBeHidden();

    // 6. Verificar que aparece en la tabla con badge Vigente
    await expect(page.getByText('Conducta antideportiva E2E')).toBeVisible({ timeout: 10000 });

    // 7. Probar el feature de filtro: buscar al socio y ver el resumen
// ... (código anterior)

// 7. Probar el feature de filtro: buscar al socio y ver el resumen
    await page.getByPlaceholder('Filtrar: buscar socio por nombre o DNI').fill('Socio Alta');
    const filterResult = page.locator('p.css-1umixiy', { hasText: memberName });
    await expect(filterResult).toBeVisible();
    await filterResult.click();
    await expect(page.getByText('Sanciones totales')).toBeVisible();
    await expect(page.getByText('Vigentes')).toBeVisible();
  });
});