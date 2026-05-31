import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

// 🌟 Seteamos la variable inmediatamente al leer el archivo
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';

// 1. Creamos el mock con todas las funciones que tu Caso de Uso va a usar
const { mockLockerRepo } = vi.hoisted(() => ({
    mockLockerRepo: {
        findAll: vi.fn(), 
        create: vi.fn(), 
        findById: vi.fn(), 
        findByNumber: vi.fn(), 
        update: vi.fn(), 
        delete: vi.fn(),
    },
}));

// 2. Interceptamos el archivo real de forma absoluta para que Vitest use el plástico
vi.mock('../infrastructure/PostgresLockerRepository', () => ({
    PostgresLockerRepository: class { constructor() { return mockLockerRepo; } },
}));

describe('LockerController Integration Tests', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // 🌟 IMPORT DINÁMICO: Forzamos a Node a cargar la app RECIÉN ACÁ,
        // garantizando que process.env.DATABASE_URL ya exista en memoria.
        const { buildApp } = await import('../app.js');
        
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    // =========================================================================
    // BLOQUE 1: ALTA DE CASILLEROS (POST)
    // =========================================================================
    describe('LockerController integration - alta (POST)', () => {
        const validBody = {
            number: 14,
            location: 'Vestuario Mujeres',
            status: 'Available',
        };

        it('1. devuelve 201 y crea el casillero cuando los datos son válidos', async () => {
            mockLockerRepo.findByNumber.mockResolvedValueOnce(null);
            
            mockLockerRepo.create.mockResolvedValueOnce({ 
                id: 'locker-1', 
                ...validBody, 
                member_id: null 
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: validBody,
            });

            expect(response.statusCode).toBe(201);
            expect(response.json().data.id).toBe('locker-1');
            expect(mockLockerRepo.create).toHaveBeenCalled();
        });

        it('2. devuelve 409 cuando el número de casillero ya se encuentra registrado', async () => {
            mockLockerRepo.findByNumber.mockResolvedValueOnce({
                id: 'locker-existente',
                number: 14,
                location: 'Gimnasio',
                status: 'Available',
                member_id: null
            });

            mockLockerRepo.create.mockRejectedValueOnce(
                new Error('Ya existe un casillero con ese número')
            );

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: validBody,
            });

            expect(response.statusCode).toBe(409);
            expect(response.json().error).toContain('Ya existe un casillero');
        });
    });

    // =========================================================================
    // BLOQUE 2: MODIFICACIÓN DE CASILLEROS (PUT)
    // =========================================================================
    describe('LockerController integration - modificación (PUT)', () => {
        const validUpdateBody = {
            number: 15,
            location: 'Vestuario Mujeres Modificado',
            status: 'Available'
        };

        it('3. devuelve 200 y el casillero modificado si los datos son correctos', async () => {
            mockLockerRepo.findById.mockResolvedValueOnce({ id: 'locker-1', number: 14, location: 'Vestuario Mujeres', status: 'Available', member_id: null });
            mockLockerRepo.findByNumber.mockResolvedValueOnce(null);
            mockLockerRepo.update.mockResolvedValueOnce({ id: 'locker-1', ...validUpdateBody, member_id: null });

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/locker-1',
                payload: validUpdateBody,
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().data.number).toBe(15);
            expect(mockLockerRepo.update).toHaveBeenCalled();
        });

        it('4. devuelve 400 si se intenta cambiar el estado a Maintenance con un socio asignado', async () => {
            mockLockerRepo.findById.mockResolvedValueOnce({ id: 'locker-1', number: 14, location: 'Vestuario', status: 'Available', member_id: null });

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/locker-1',
                payload: {
                    status: 'Maintenance',
                    member_id: 'socio-123'
                },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toContain('Maintenance');
            expect(mockLockerRepo.update).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // BLOQUE 3: ELIMINACIÓN DE CASILLEROS (DELETE)
    // =========================================================================
    describe('LockerController integration - eliminación (DELETE)', () => {
        it('5. devuelve 204 cuando el casillero existe, está vacío y se elimina con éxito', async () => {
            const mockLockerClean = {
                id: 'locker-a-eliminar',
                number: 20,
                location: 'Sector Norte',
                status: 'Available',
                member_id: null,
            };

            mockLockerRepo.findById.mockResolvedValueOnce(mockLockerClean);
            mockLockerRepo.delete.mockResolvedValueOnce(undefined);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/lockers/locker-a-eliminar',
            });

            expect(response.statusCode).toBe(204);
            expect(mockLockerRepo.delete).toHaveBeenCalledWith('locker-a-eliminar');
        });

        it('6. devuelve 400 Bad Request si el casillero viola la regla crítica TDD-012 (está ocupado)', async () => {
            const mockLockerOccupied = {
                id: 'locker-ocupado',
                number: 21,
                location: 'Sector Central',
                status: 'Occupied',
                member_id: 'socio-123',
            };

            mockLockerRepo.findById.mockResolvedValueOnce(mockLockerOccupied);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/lockers/locker-ocupado',
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toBeDefined(); 
            expect(mockLockerRepo.delete).not.toHaveBeenCalled();
        });
    });
});