import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js'; 
import type { FastifyInstance } from 'fastify';
import type { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

// 1. Declaramos el mock de nuestro repositorio 
const { mockSportRepo } = vi.hoisted(() => ({
    mockSportRepo: {
        create: vi.fn(),
        findByName: vi.fn(), // Lo necesitamos para simular el chequeo de duplicados
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
}));

// 2. Interceptamos el repositorio real de infraestructura para que devuelva nuestro mock

vi.mock('../infrastructure/PostgresSportRepository.js', () => ({
    PostgresSportRepository: class { constructor() { return mockSportRepo; } },
}));

describe('SportController integration - alta (POST)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const validBody: CreateSportRequest = {
        name: 'Fútbol 5',
        description: 'Torneo nocturno en cancha sintética',
        max_capacity: 10,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    it('1. devuelve 201 y crea el deporte correctamente', async () => {
        // Simulamos que el deporte NO existe previamente 
        mockSportRepo.findByName.mockResolvedValueOnce(null);
        // Simulamos que la base de datos guarda con éxito y le asigna un ID 'sport-1'
        mockSportRepo.create.mockResolvedValueOnce({ id: 'sport-1', ...validBody });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports', 
            payload: validBody,
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().data.id).toBe('sport-1');
        expect(mockSportRepo.create).toHaveBeenCalled();
    });

    it('2. devuelve 400 cuando el nombre del deporte ya existe', async () => {
        // Simulamos que al buscar por nombre SI encuentra un deporte ya registrado
        mockSportRepo.findByName.mockResolvedValueOnce({ id: 'sport-existente', name: 'Fútbol 5' });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload: validBody,
        });

        
        expect(response.statusCode).toBe(409); 
        expect(response.json().error).toContain('Ya existe un deporte con ese nombre');
        expect(mockSportRepo.create).not.toHaveBeenCalled(); 
    });

    it('3. devuelve 400 cuando la capacidad máxima es inválida (menor o igual a cero)', async () => {
        const invalidBody = { ...validBody, max_capacity: -5 };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload: invalidBody,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toContain('La capacidad máxima debe ser un número mayor a cero');
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    it('4. devuelve 200 y actualiza el deporte exitosamente', async () => {
        const sportId = 'sport-123';
        const updatePayload: UpdateSportRequest = {
            description: 'Nueva descripción actualizada',
            max_capacity: 12
        };

        const mockExistingSport = { id: sportId, ...validBody };
        const mockUpdatedSport = { ...mockExistingSport, ...updatePayload };

        // Simulamos que el deporte sí existe cuando el controlador lo busca por ID
        mockSportRepo.findById.mockResolvedValueOnce(mockExistingSport);
        // Simulamos que el repositorio realiza la actualización de manera exitosa
        mockSportRepo.update.mockResolvedValueOnce(mockUpdatedSport);

        const response = await app.inject({
            method: 'PUT', 
            url: `/api/v1/sports/${sportId}`,
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data.description).toBe(updatePayload.description);
        expect(response.json().data.max_capacity).toBe(updatePayload.max_capacity);
        expect(mockSportRepo.update).toHaveBeenCalled();
    });

    it('5. devuelve 404 cuando se intenta actualizar un deporte que no existe', async () => {
        const nonExistingId = 'sport-falso';
        const updatePayload: UpdateSportRequest = {
            description: 'Intentando editar algo fantasma'
        };

        // Simulamos que al buscar el deporte por ID, la base de datos devuelve null
        mockSportRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'PUT', // 
            url: `/api/v1/sports/${nonExistingId}`,
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('El deporte especificado no existe');
        expect(mockSportRepo.update).not.toHaveBeenCalled(); // Seguridad: No debió persistir nada
    });

});

//Integración para la funcionalidad de eliminación (DELETE)
describe('SportController integration - eliminación (DELETE)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('1. devuelve 204 No Content cuando el deporte existe y es eliminado exitosamente', async () => {
        // Simulamos que el deporte si existe en el sistema
        mockSportRepo.findById.mockResolvedValueOnce({ 
            id: 'sport-123', 
            name: 'Básquet' 
        });
        // Simulamos la resolución exitosa del delete en persistencia
        mockSportRepo.delete.mockResolvedValueOnce(undefined);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/sports/sport-123',
        });

        // Al eliminar de forma correcta, la API REST estándar debe retornar un estado 204 sin cuerpo
        expect(response.statusCode).toBe(204);
        expect(mockSportRepo.findById).toHaveBeenCalledWith('sport-123');
        expect(mockSportRepo.delete).toHaveBeenCalledWith('sport-123');
    });

});