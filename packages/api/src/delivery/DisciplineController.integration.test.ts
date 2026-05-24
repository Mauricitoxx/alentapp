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