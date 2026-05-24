import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

describe('CreateDisciplineUseCase (unitarios - alta)', () => {
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(mockDisciplineRepo, mockMemberRepo, mockValidator);

    const validRequest: CreateDisciplineRequest = {
        reason: 'Conducta antideportiva',
        start_date: '2030-01-01T00:00:00.000Z',
        end_date: '2030-02-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'member-uuid-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockMemberRepo.findById).mockResolvedValue({ id: 'member-uuid-1' } as any);
    });

    it('1. crea una sanción si el socio existe y las fechas son válidas', async () => {
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({
            id: 'uuid-1', ...validRequest, created_at: '2026-05-23T00:00:00.000Z',
        });

        const result = await useCase.execute(validRequest);

        expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
        expect(mockValidator.validateDates).toHaveBeenCalledWith(validRequest.start_date, validRequest.end_date);
        expect(mockDisciplineRepo.create).toHaveBeenCalled();
        expect(result.id).toBe('uuid-1');
    });

    it('2. lanza error si el socio no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validRequest)).rejects.toThrow('El socio especificado no existe');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('3. propaga el error si las fechas son inválidas', async () => {
        vi.mocked(mockValidator.validateDates).mockImplementationOnce(() => {
            throw new Error('La fecha de fin debe ser estrictamente posterior a la de inicio');
        });
        await expect(useCase.execute(validRequest)).rejects.toThrow('La fecha de fin debe ser estrictamente posterior');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('4. suspende al socio si is_total_suspension=true y la sanción está vigente', async () => {
        const now = new Date();
        const reqVigente: CreateDisciplineRequest = {
            ...validRequest,
            is_total_suspension: true,
            start_date: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
            end_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        };
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({ id: 'uuid-2', ...reqVigente } as any);

        await useCase.execute(reqVigente);

        expect(mockMemberRepo.update).toHaveBeenCalledWith('member-uuid-1', { status: 'Suspendido' });
    });
});