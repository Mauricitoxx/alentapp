import type { SportDTO, CreateSportRequest } from '@alentapp/shared';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const sportsService = {
  //se obtienen todos los deportes desde el backend
  async getAll(): Promise<SportDTO[]> {
    
    const response = await fetch(`${API_URL}/sports`);
    
    if (!response.ok) {
      throw new Error('Error al obtener los deportes');
    }
    
    const result = await response.json();
    return result.data;
  },

  //se crea un nuevo deporte
  async create(data: CreateSportRequest): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Captura errores específicos como "Ya existe un deporte con ese nombre" 
      // o validaciones de capacidad.
      throw new Error(errorData.error || 'Error al crear el deporte');
    }

    const result = await response.json();
    return result.data;
  },
};