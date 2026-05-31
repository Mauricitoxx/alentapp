import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase (unitarios - delete)', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        update: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo, mockMemberRepo);
    const validUuid = '11111111-2222-3333-4444-555555555555';

    beforeEach(() => { vi.clearAllMocks(); });

    it('1. lanza error si el ID tiene formato inválido', async () => {
        await expect(useCase.execute('no-es-uuid')).rejects.toThrow('Formato de ID invalido');
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('2. lanza error si la sanción no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validUuid)).rejects.toThrow('El registro disciplinario no existe');
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('3. elimina sin tocar al socio si la sanción no era una suspensión total vigente', async () => {
        const sancion: DisciplineDTO = {
            id: validUuid, reason: 'algo',
            start_date: '2030-01-01T00:00:00.000Z', end_date: '2030-02-01T00:00:00.000Z',
            is_total_suspension: false, member_id: 'm-1', created_at: '2026-05-23T00:00:00.000Z',
        };
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(sancion);

        await useCase.execute(validUuid);

        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith(validUuid);
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });

    it('4. restituye al socio (Activo) si la sanción borrada era total y vigente', async () => {
        const now = new Date();
        const sancion: DisciplineDTO = {
            id: validUuid, reason: 'falta grave',
            start_date: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
            end_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            is_total_suspension: true, member_id: 'm-1', created_at: '2026-05-23T00:00:00.000Z',
        };
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(sancion);

        await useCase.execute(validUuid);

        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith(validUuid);
        expect(mockMemberRepo.update).toHaveBeenCalledWith('m-1', { status: 'Activo' });
    });
});