import { test, expect } from '@playwright/test';

test.describe('Sports View - Full-Stack E2E', () => {
  // Evitamos colisiones de nombres usando una marca de tiempo única
  const uniqueId = Date.now();
  const initialSportName = `Pádel E2E ${uniqueId}`;
  const updatedDescription = 'Descripción modificada en tiempo real por el test E2E';

  test('debe completar el ciclo de vida de un deporte (creación, edición y posterior eliminación)', async ({ page }) => {
    
    // 1. Navegar a la vista de deportes
    await page.goto('/sports');
    await expect(page.getByRole('heading', { name: 'Gestión de Deportes' })).toBeVisible();

    /* ==========================================================================
       FLUJO 1: ALTA DE DEPORTE
       ========================================================================== */
    
    // Abrir el modal de creación
    await page.getByRole('button', { name: 'Agregar Deporte' }).click();
    await expect(page.getByText('Registrar Nuevo Deporte')).toBeVisible();

    // Rellenar campos del formulario
    await page.getByPlaceholder('Ej. Básquet', { exact: true }).fill(initialSportName);
    await page.getByPlaceholder('Detalles de la disciplina', { exact: true }).fill('Descripción inicial de prueba automatizada');
    await page.locator('input[type="number"]').first().fill('15'); // Capacidad Máxima
    await page.locator('input[type="number"]').last().fill('2500');  // Precio Adicional

    // Marcar el checkbox (Chakra UI expone la etiqueta nativa o el texto asociado)
    await page.getByText('Requiere Certificado Médico').click();

    // Enviar formulario
    await page.getByRole('button', { name: 'Crear Deporte' }).click();
    
    // Comprobar que el modal se cierra con éxito
    await expect(page.getByText('Registrar Nuevo Deporte')).toBeHidden();

    // Validar que el nuevo registro aparece renderizado físicamente en la tabla
    const row = page.locator('tr', { hasText: initialSportName });
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row.getByText('15')).toBeVisible();
    await expect(row.getByText('$2500')).toBeVisible();
    await expect(row.getByText('SÍ')).toBeVisible();

    /* ==========================================================================
       FLUJO 2: EDICIÓN DEL DEPORTE RECIÉN CREADO
       ========================================================================== */

    // Hacemos clic en el botón de editar (LuPencil) específico de la fila que creamos
    await row.getByRole('button', { name: 'Editar deporte' }).click();
    
    // Validamos la regla de negocio visual: el título cambia y el nombre debe estar bloqueado
    await expect(page.getByText(`Editar Deporte: ${initialSportName}`)).toBeVisible();
    await expect(page.getByLabel('Nombre del Deporte')).toBeDisabled();
    
    // Validamos que el campo no pueda modificarse
    await expect(page.getByLabel('Precio Adicional')).toBeDisabled();
    
    // Modificamos la descripción y la capacidad (Campos permitidos por tu UpdateSportRequest)
    await page.getByPlaceholder('Detalles de la disciplina', { exact: true }).fill(updatedDescription);
    await page.locator('input[type="number"]').first().fill('30');

    // Guardamos las modificaciones
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Comprobamos el cierre del modal de edición
    await expect(page.getByText(`Editar Deporte:`)).toBeHidden();

    // Verificación final en la tabla: los cambios deben verse reflejados de inmediato
    await expect(row.getByText(updatedDescription)).toBeVisible();
    await expect(row.getByText('30')).toBeVisible();

    /* ==========================================================================
       FLUJO 3: ELIMINACIÓN DEL DEPORTE 
       ========================================================================== */

    // 1. Preparamos el interceptor para el diálogo nativo de confirmación (confirm)
    page.once('dialog', async (dialog) => {
      // Verificamos que el texto de alerta sea el esperado por negocio
      expect(dialog.message()).toContain(`¿Estás seguro de que deseas eliminar el deporte "${initialSportName}"?`);
      
      // Simulamos que el usuario hace clic en "Aceptar" / "OK"
      await dialog.accept();
    });

    // 2. Hacemos clic en el botón de eliminación de nuestra fila específica por su rol o etiqueta
    await row.getByRole('button', { name: 'Eliminar deporte' }).click();

    // 3. Verificación final: La fila debe desaparecer por completo de la grilla de la UI
    await expect(row).toBeHidden({ timeout: 5000 });
  });
});