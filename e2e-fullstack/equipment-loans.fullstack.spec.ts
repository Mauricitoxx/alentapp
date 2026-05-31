import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api/v1';

test.describe('Equipment Loans Update - Full-Stack E2E', () => {
  const dni = '88888888';
  const memberName = 'Socio Update E2E';
  let memberId = '';
  const itemName = 'Pelota de Básquet Update E2E';

  test('debe permitir actualizar el estado de un préstamo de equipo a Devuelto', async ({ page }) => {
    // 1. Sembrar un socio real vía API
    const memberRes = await page.request.post(`${API}/socios`, {
      data: {
        name: memberName,
        dni,
        email: `update-${dni}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    expect(memberRes.ok()).toBeTruthy();
    const memberData = await memberRes.json();
    memberId = memberData.data.id;

    // 2. Sembrar un préstamo real vía API asociado a ese socio
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const loanRes = await page.request.post(`${API}/equipment-loans`, {
      data: {
        item_name: itemName,
        due_date: tomorrow.toISOString(),
        member_id: memberId,
      },
    });
    expect(loanRes.ok()).toBeTruthy();

    // 3. Ir a la vista de préstamos de equipos
    await page.goto('http://localhost:5173/equipment-loans');

    // 4. Verificar que el préstamo aparece en la tabla con estado 'Loaned'
    const row = page.locator('tr', { hasText: itemName }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByText('Loaned')).toBeVisible();

    // 5. Hacer clic en el botón de Editar (icono de lápiz) en esa fila
    await row.getByRole('button').first().click();

    // 6. Verificar que se abrió el modal de edición
    await expect(page.getByText('Editar Préstamo')).toBeVisible();

    // 7. Cambiar el estado a 'Returned'
    await page.locator('select').selectOption('Returned');

    // 8. Guardar los cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // 9. Verificar que el modal se cerró
    await expect(page.getByText('Editar Préstamo')).toBeHidden();

    // 10. Verificar que en la tabla ahora dice 'Returned' en vez de 'Loaned'
    await expect(row.getByText('Returned')).toBeVisible();
  });

  test('debe permitir eliminar un préstamo de equipo en estado Loaned', async ({ page }) => {
    // 1. Sembrar socio vía API
    const memberRes = await page.request.post(`${API}/socios`, {
      data: {
        name: 'Socio Delete E2E',
        dni: '77777777',
        email: 'delete-7777@e2e.com',
        birthdate: '1995-01-01',
        category: 'Pleno',
      },
    });
    expect(memberRes.ok()).toBeTruthy();
    const memberData = await memberRes.json();
    const deleteMemberId = memberData.data.id;

    // 2. Sembrar préstamo vía API
    const itemNameDelete = 'Raqueta de Tenis Delete E2E';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const loanRes = await page.request.post(`${API}/equipment-loans`, {
      data: {
        item_name: itemNameDelete,
        due_date: tomorrow.toISOString(),
        member_id: deleteMemberId,
      },
    });
    expect(loanRes.ok()).toBeTruthy();

    // 3. Navegar a préstamos
    await page.goto('http://localhost:5173/equipment-loans');

    // 4. Buscar la fila y darle al botón de eliminar (el de la papelera / LuTrash, que es el segundo botón en la celda o el de clase destructivo)
    const row = page.locator('tr', { hasText: itemNameDelete }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    // Configurar listener para aceptar el alert nativo (window.confirm)
    page.on('dialog', dialog => dialog.accept());

    // Hacer click en el basurero (suponiendo que es el último botón de la fila)
    await row.getByRole('button').last().click();

    // 5. Verificar que la fila ya no existe en la tabla
    await expect(page.locator('tr', { hasText: itemNameDelete })).toBeHidden({ timeout: 5000 });
  });
});
