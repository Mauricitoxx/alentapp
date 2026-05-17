import type { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const lockersService = {
  // Únicamente el método POST para cumplir con el alcance del Alta (TDD-010)
  async create(data: CreateLockerRequest): Promise<LockerDTO> {
    const response = await fetch(`${API_URL}/lockers`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el casillero');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<LockerDTO[]> {
    const response = await fetch(`${API_URL}/lockers`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener la lista de casilleros');
    }

    const result = await response.json();
    // Retornamos el array de lockers (asumiendo que viene dentro de result.data igual que el create)
    return result.data;
  },
};