import { test, expect, type Locator } from '@playwright/test';

// Configuramos el archivo para que ejecute los bloques en orden secuencial estricto
test.describe.configure({ mode: 'serial' });

test.describe('Sports View - Full-Stack E2E', () => {
  // Compartimos las variables del recurso a lo largo de los bloques de prueba
  const uniqueId = Date.now();
  const initialSportName = `Pádel E2E ${uniqueId}`;
  const updatedDescription = 'Descripción modificada en tiempo real por el test E2E';
  
  // Declaramos la referencia de la fila para reutilizar el localizador
  let row: Locator;

  /* ==========================================================================
     BLOQUE 1: ANTES DE CADA TEST (Garantizar navegación base)
     ========================================================================== */
  test.beforeEach(async ({ page }) => {
    await page.goto('/sports');
    await expect(page.getByRole('heading', { name: 'Gestión de Deportes' })).toBeVisible();
    
    // Inicializamos el localizador de la fila basado en el nombre único
    row = page.locator('tr', { hasText: initialSportName });
  });

  /* ==========================================================================
     FLUJO 1: ALTA DE DEPORTE
     ========================================================================== */
  test.describe('Alta (POST)', () => {
    test('debe registrar un nuevo deporte correctamente desde el formulario', async ({ page }) => {
      // Abrir el modal de creación
      await page.getByRole('button', { name: 'Agregar Deporte' }).click();
      await expect(page.getByText('Registrar Nuevo Deporte')).toBeVisible();

      // Rellenar campos del formulario
      await page.getByPlaceholder('Ej. Básquet', { exact: true }).fill(initialSportName);
      await page.getByPlaceholder('Detalles de la disciplina', { exact: true }).fill('Descripción inicial de prueba automatizada');
      await page.locator('input[type="number"]').first().fill('15'); // Capacidad Máxima
      await page.locator('input[type="number"]').last().fill('2500');  // Precio Adicional

      // Marcar el checkbox
      await page.getByText('Requiere Certificado Médico').click();

      // Enviar formulario
      await page.getByRole('button', { name: 'Crear Deporte' }).click();
      
      // Comprobar cierre con éxito
      await expect(page.getByText('Registrar Nuevo Deporte')).toBeHidden();

      // Validar renderizado físico en la tabla
      await expect(row).toBeVisible({ timeout: 8000 });
      await expect(row.getByText('15')).toBeVisible();
      await expect(row.getByText('$2500')).toBeVisible();
      await expect(row.getByText('SÍ')).toBeVisible();
    });
  });

  /* ==========================================================================
     FLUJO 2: EDICIÓN DEL DEPORTE
     ========================================================================== */
  test.describe('Edición (PUT)', () => {
    test('debe modificar la descripción y capacidad bloqueando campos no mutables', async ({ page }) => {
      // Asegurar que el elemento creado en el test anterior está visible
      await expect(row).toBeVisible();

      // Hacemos clic en el botón de editar
      await row.getByRole('button', { name: 'Editar deporte' }).click();
      
      // Validamos reglas de negocio de la interfaz
      await expect(page.getByText(`Editar Deporte: ${initialSportName}`)).toBeVisible();
      await expect(page.getByLabel('Nombre del Deporte')).toBeDisabled();
      await expect(page.getByLabel('Precio Adicional')).toBeDisabled();
      
      // Modificamos los campos permitidos
      await page.getByPlaceholder('Detalles de la disciplina', { exact: true }).fill(updatedDescription);
      await page.locator('input[type="number"]').first().fill('30');

      // Guardamos las modificaciones
      await page.getByRole('button', { name: 'Guardar Cambios' }).click();

      // Comprobamos el cierre del modal
      await expect(page.getByText(`Editar Deporte:`)).toBeHidden();

      // Verificación final en la tabla
      await expect(row.getByText(updatedDescription)).toBeVisible();
      await expect(row.getByText('30')).toBeVisible();
    });
  });

  /* ==========================================================================
     FLUJO 3: ELIMINACIÓN DEL DEPORTE
     ========================================================================== */
  test.describe('Eliminación (DELETE)', () => {
    test('debe confirmar el diálogo nativo y remover la fila del sistema', async ({ page }) => {
      // Asegurar que el elemento modificado está visible en la grilla
      await expect(row).toBeVisible();

      // 1. Preparamos el interceptor para el diálogo nativo de confirmación
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain(`¿Estás seguro de que deseas eliminar el deporte "${initialSportName}"?`);
        await dialog.accept();
      });

      // 2. Hacemos clic en el botón de eliminación de nuestra fila
      await row.getByRole('button', { name: 'Eliminar deporte' }).click();

      // 3. Verificación de remoción completa del DOM
      await expect(row).toBeHidden({ timeout: 5000 });
    });
  });
});