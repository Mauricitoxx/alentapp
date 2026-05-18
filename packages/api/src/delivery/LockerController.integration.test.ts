import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../app.js';
import { LockerRepository } from '../domain/LockerRepository.js';

const { mockLockerRepository } = vi.hoisted(() => ({
    mockLockerRepository: {
        findById: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn(),
        findByNumber: vi.fn(),
    }
}));

vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            constructor() { return mockLockerRepository; }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            findById = vi.fn();
            findAll = vi.fn();
            create = vi.fn();
            update = vi.fn();
            delete = vi.fn();
        }
    };
});

describe('LockerController integration', () => {
    let request: supertest.SuperTest<supertest.Test>;

    beforeEach(async () => {
        vi.clearAllMocks();
        const app = await buildApp();
        await app.ready(); // Fastify necesita esto para usar supertest
        request = supertest(app.server);
    });

    afterEach(async () => {
        // Nothing to cleanup for mocked integration tests.
    });

    it('devuelve 204 cuando el casillero existe y se elimina', async () => {
        mockLockerRepository.findById.mockResolvedValueOnce({
            id: 'uuid-locker',
            number: 12,
            location: 'Planta Baja',
            status: 'Available',
            member_id: null,
        });

        mockLockerRepository.delete.mockResolvedValueOnce();

        const response = await request.delete('/api/v1/lockers/uuid-locker');

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
        expect(mockLockerRepository.delete).toHaveBeenCalledWith('uuid-locker');
    });

    it('devuelve 404 cuando el casillero no existe', async () => {
        mockLockerRepository.findById.mockResolvedValueOnce(null);

        const response = await request.delete('/api/v1/lockers/uuid-inexistente');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'El casillero no existe' });
    });

    it('devuelve 400 cuando el casillero está ocupado por un socio', async () => {
        mockLockerRepository.findById.mockResolvedValueOnce({
            id: 'uuid-locked',
            number: 34,
            location: 'Sector D',
            status: 'Available',
            member_id: 'member-1',
        });

        const response = await request.delete('/api/v1/lockers/uuid-locked');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'No se puede eliminar un casillero que está ocupado por un socio' });
    });
});
