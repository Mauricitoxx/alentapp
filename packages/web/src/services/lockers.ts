// 🌟 1. Sumamos UpdateLockerRequest al import de tipos
import type { LockerDTO, CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';

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
    return result.data;
  },

  // 🌟 2. NUEVO MÉTODO AGREGADO para la modificación (TDD-011)
  async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
    const response = await fetch(`${API_URL}/lockers/${id}`, {
      method: 'PUT', // Usamos el método PUT que expusimos en Fastify
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Captura el mensaje descriptivo (ej: "Un casillero no puede asignarse si su status es Maintenance")
      throw new Error(errorData.error || 'Error al actualizar el casillero');
    }

    const result = await response.json();
    // Retorna el casillero actualizado que viene envuelto en result.data
    return result.data;
  },

  // 🌟 NUEVO MÉTODO AGREGADO para la eliminación
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/lockers/${id}`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Error al eliminar el casillero');
    }
  },
};