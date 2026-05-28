import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

const { mockDisciplineRepo, mockMemberRepo } = vi.hoisted(() => ({
    mockDisciplineRepo: {
        findAll: vi.fn(), create: vi.fn(), findById: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
    mockMemberRepo: {
        findById: vi.fn(), update: vi.fn(), findAll: vi.fn(), create: vi.fn(), delete: vi.fn(), findByDni: vi.fn(),
    },
}));

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({
    PostgresDisciplineRepository: class { constructor() { return mockDisciplineRepo; } },
}));
vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({
    PostgresMemberRepository: class { constructor() { return mockMemberRepo; } },
}));

describe('DisciplineController integration - alta (POST)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const validBody = {
        reason: 'Conducta antideportiva',
        start_date: '2030-01-01T00:00:00.000Z',
        end_date: '2030-02-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'member-1',
    };

    it('1. devuelve 201 y crea la sanción cuando el socio existe', async () => {
        mockMemberRepo.findById.mockResolvedValueOnce({ id: 'member-1', status: 'Activo' });
        mockDisciplineRepo.create.mockResolvedValueOnce({ id: 'd1', ...validBody, created_at: '2026-05-23T00:00:00.000Z' });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload: validBody,
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().data.id).toBe('d1');
        expect(mockDisciplineRepo.create).toHaveBeenCalled();
    });

    it('2. devuelve 404 cuando el socio especificado no existe', async () => {
        mockMemberRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload: { ...validBody, member_id: 'inexistente' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('no existe');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });
});

describe('DisciplineController integration - update (PUT)', () => {
    let app: FastifyInstance;
    const validUuid = '11111111-2222-3333-4444-555555555555';

    const existing = {
        id: validUuid,
        reason: 'Motivo original',
        start_date: '2030-01-01T00:00:00.000Z',
        end_date: '2030-02-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'm-1',
        created_at: '2026-05-23T00:00:00.000Z',
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('1. devuelve 200 y actualiza la sanción existente', async () => {
        mockDisciplineRepo.findById.mockResolvedValueOnce(existing);
        mockDisciplineRepo.update.mockResolvedValueOnce({ ...existing, reason: 'Editado' });

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplines/${validUuid}`,
            payload: { reason: 'Editado' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data.reason).toBe('Editado');
    });

    it('2. devuelve 404 cuando la sanción no existe', async () => {
        mockDisciplineRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplines/${validUuid}`,
            payload: { reason: 'X' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('no existe');
    });
});

describe('DisciplineController integration - delete (DELETE)', () => {
    let app: FastifyInstance;
    const validUuid = '11111111-2222-3333-4444-555555555555';

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('1. devuelve 204 cuando la sanción existe y se elimina', async () => {
        mockDisciplineRepo.findById.mockResolvedValueOnce({
            id: validUuid, reason: 'x',
            start_date: '2030-01-01T00:00:00.000Z', end_date: '2030-02-01T00:00:00.000Z',
            is_total_suspension: false, member_id: 'm-1', created_at: '2026-05-23T00:00:00.000Z',
        });
        mockDisciplineRepo.delete.mockResolvedValueOnce(undefined);

        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${validUuid}`,
        });

        expect(response.statusCode).toBe(204);
        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith(validUuid);
    });

    it('2. devuelve 404 cuando la sanción no existe', async () => {
        mockDisciplineRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${validUuid}`,
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('no existe');
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });
});
