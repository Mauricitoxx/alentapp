import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('UpdateDisciplineUseCase (unitarios - update)', () => {
    const mockRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockValidator = {
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockRepo, mockValidator);
    const validUuid = '11111111-2222-3333-4444-555555555555';

    const existing: DisciplineDTO = {
        id: validUuid,
        reason: 'Motivo original',
        start_date: '2030-01-01T00:00:00.000Z',
        end_date: '2030-02-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'm-1',
        created_at: '2026-05-23T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRepo.findById).mockResolvedValue(existing);
    });

    it('1. lanza error si el ID tiene formato inválido', async () => {
        await expect(useCase.execute('no-es-uuid', {})).rejects.toThrow('Formato de ID invalido');
        expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('2. lanza error si la sanción no existe', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validUuid, {})).rejects.toThrow('El registro disciplinario no existe');
        expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('3. re-valida fechas combinando la nueva con la existente', async () => {
        vi.mocked(mockRepo.update).mockResolvedValueOnce(existing);
        await useCase.execute(validUuid, { start_date: '2030-03-01T00:00:00.000Z' });
        expect(mockValidator.validateDates).toHaveBeenCalledWith('2030-03-01T00:00:00.000Z', existing.end_date);
    });

    it('4. actualiza correctamente cuando todo es válido', async () => {
        const updated = { ...existing, reason: 'Motivo editado' };
        vi.mocked(mockRepo.update).mockResolvedValueOnce(updated);
        const result = await useCase.execute(validUuid, { reason: 'Motivo editado' });
        expect(result.reason).toBe('Motivo editado');
        expect(mockRepo.update).toHaveBeenCalledWith(validUuid, { reason: 'Motivo editado' });
    });
});