import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';

/**
 * Tests E2E Full-Stack para Préstamos de Equipamiento.
 * Playwright interactúa con el frontend (configurado en baseURL) y la API real en localhost:3000.
 */
test.describe('Equipment Loans - Full-Stack E2E', () => {
  const dni = '99991111';
  const memberName = 'Socio Préstamo E2E';
  let memberId = '';

  test.beforeAll(async ({ request }) => {
    // Sembramos un socio real vía API para que exista en el combobox de los tests
    const memberRes = await request.post(`${API}/socios`, {
      data: {
        name: memberName,
        dni,
        email: `prestamo-${dni}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });

    // Guardamos el ID del socio creado porque el test de Update lo necesita para crear el préstamo
    if (memberRes.ok()) {
      const memberData = await memberRes.json();
      memberId = memberData.data.id;
    }
  });

  test('debe permitir dar de alta un préstamo de equipo desde la UI', async ({ page }) => {
    const itemName = 'Raqueta de Tenis Alta E2E';

    await page.goto('http://localhost:5173/equipment-loans');

    // 1. Alta del préstamo
    const btnAgregar = page.getByRole('button', { name: /Nuevo Préstamo/i });
    await expect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    await expect(page.getByText('Registrar Nuevo Préstamo')).toBeVisible();

    // Seleccionamos el socio del Combobox
    const socioField = page.getByRole('textbox', { name: 'Socio' });
    await socioField.click();
    await page.keyboard.type(memberName);
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
    const row = page.locator('tr', { hasText: itemName }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByText('Loaned')).toBeVisible();
  });

  test('debe permitir actualizar el estado de un préstamo de equipo a Devuelto', async ({ page, request }) => {
    const itemName = 'Pelota de Básquet Update E2E';

    // 1. Sembrar un préstamo real vía API asociado al socio creado en beforeAll
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const loanRes = await request.post(`${API}/equipment-loans`, {
      data: {
        item_name: itemName,
        due_date: tomorrow.toISOString(),
        member_id: memberId,
      },
    });
    expect(loanRes.ok()).toBeTruthy();

    // 2. Ir a la vista de préstamos de equipos
    await page.goto('http://localhost:5173/equipment-loans');

    // 3. Verificar que el préstamo sembrado aparece en la tabla con estado 'Loaned'
    const row = page.locator('tr', { hasText: itemName }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByText('Loaned')).toBeVisible();

    // 4. Hacer clic en el botón de Editar (icono de lápiz) en esa fila
    await row.getByRole('button').first().click();

    // 5. Verificar que se abrió el modal de edición
    await expect(page.getByText('Editar Préstamo')).toBeVisible();

    // 6. Cambiar el estado a 'Returned'
    await page.locator('select').selectOption('Returned');

    // 7. Guardar los cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // 8. Verificar que el modal se cerró
    await expect(page.getByText('Editar Préstamo')).toBeHidden();

    // 9. Verificar que en la tabla ahora dice 'Returned' en vez de 'Loaned'
    await expect(row.getByText('Returned')).toBeVisible();
  });
});