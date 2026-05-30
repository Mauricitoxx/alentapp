import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportsView } from './Sports'; // Asegúrate de ajustar la ruta real de tu vista
import { sportsService } from '../services/sports';
import { Provider } from '../components/ui/provider';
import type { SportDTO } from '@alentapp/shared';

// Mockeamos el servicio que hace el fetch real para aislar el componente
vi.mock('../services/sports', () => ({
  sportsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

describe('SportsView - Actualización de Deportes', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  // Limpiamos los mocks antes de cada test para evitar interferencias
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir abrir el modal de edición cargando los valores correspondientes y bloqueando los campos inmutables', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    const mockSports = [
      { 
        id: 'sport-abc', 
        name: 'Básquet', 
        description: 'Liga interna de fin de semana', 
        max_capacity: 15, 
        additional_price: 1200, 
        requires_medical_certificate: true 
      }
    ] as SportDTO[];

    vi.mocked(sportsService.getAll).mockResolvedValue(mockSports);

    renderWithProviders(<SportsView />);

    // Esperamos que el deporte se liste en la tabla principal
    await waitFor(() => {
      expect(screen.getByText('Básquet')).toBeInTheDocument();
    });

    // Buscamos y hacemos click en el botón de edición por su aria-label
    const editButton = screen.getByLabelText(/Editar deporte/i);
    await user.click(editButton);

    // 1. Verificamos que el título del diálogo cambió correctamente reflejando el estado dinámico
    expect(screen.getByText('Editar Deporte: Básquet')).toBeInTheDocument();

    // 2. Verificamos que los datos actuales ya se inyectaron como valores de los inputs
    const descriptionInput = screen.getByPlaceholderText('Detalles de la disciplina');
    const capacityInput = screen.getByPlaceholderText('0');
    const nameInput = screen.getByPlaceholderText('Ej. Básquet');
    const priceInput = screen.getByPlaceholderText('0.00');

    expect(descriptionInput).toHaveValue('Liga interna de fin de semana');
    expect(capacityInput).toHaveValue(15);

    // 3. Verificamos el cumplimiento de las Reglas de Negocio en la UI (Campos bloqueados)
    expect(nameInput).toBeDisabled();
    expect(priceInput).toBeDisabled();
    // El checkbox de Chakra utiliza la etiqueta del campo como nombre accesible
    expect(screen.getByRole('checkbox', { name: /Requisitos de ingreso/i })).toBeDisabled();
  });

  it('debe enviar la petición de actualización mapeando estrictamente solo los campos modificables y refrescar la grilla', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    const mockSports = [
      { 
        id: 'sport-abc', 
        name: 'Básquet', 
        description: 'Liga interna de fin de semana', 
        max_capacity: 15, 
        additional_price: 1200, 
        requires_medical_certificate: true 
      }
    ] as SportDTO[];

    // getAll se llamará al inicio y tras el submit exitoso para refrescar la grilla
    vi.mocked(sportsService.getAll).mockResolvedValue(mockSports);
    vi.mocked(sportsService.update).mockResolvedValueOnce({
      ...mockSports[0],
      description: 'Liga interna MODIFICADA',
      max_capacity: 25
    });

    renderWithProviders(<SportsView />);

    await waitFor(() => {
      expect(screen.getByText('Básquet')).toBeInTheDocument();
    });

    // Abrimos el modal de edición
    const editButton = screen.getByLabelText(/Editar deporte/i);
    await user.click(editButton);

    // Modificamos la Descripción (Campo permitido)
    const descriptionInput = screen.getByPlaceholderText('Detalles de la disciplina');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Liga interna MODIFICADA');

    // Modificamos la Capacidad Máxima (Campo permitido)
    const capacityInput = screen.getByPlaceholderText('0');
    await user.clear(capacityInput);
    await user.type(capacityInput, '25');

    // Hacemos click en guardar cambios
    const saveButton = screen.getByText('Guardar Cambios');
    await user.click(saveButton);

    // Verificamos que el servicio update haya sido invocado con el ID y el cuerpo correcto (UpdateSportRequest)
    expect(sportsService.update).toHaveBeenCalledWith('sport-abc', {
      description: 'Liga interna MODIFICADA',
      max_capacity: 25
    });

    // Verificamos que se haya ejecutado el re-fetch para actualizar el listado visual
    expect(sportsService.getAll).toHaveBeenCalledTimes(2);
  });
});