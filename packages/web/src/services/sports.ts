import type { SportDTO, CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
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

  //se actualiza un deporte existente
  async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
    // Concatenamos el ID en la URL de manera dinámica
    const response = await fetch(`${API_URL}/sports/${id}`, {
      method: 'PUT', // Coincide con la ruta del servidor Fastify
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Enviamos sólo los campos modificados (description y max_capacity)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el deporte');
    }

    const result = await response.json();
    return result.data; // Retorna el SportDTO con los datos actualizados
  },

  // Elimina un deporte por su ID
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/sports/${id}`, {
      method: 'DELETE', 
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Captura el error 404 (si no existe) o 500 (si tiene restricciones de clave foránea)
      throw new Error(errorData.error || 'Error al intentar eliminar el deporte');
    }
    
    // Al ser una respuesta 204 (No Content), no hacemos response.json() 
    // ya que el cuerpo viene vacío y rompería el flujo.
  },

};