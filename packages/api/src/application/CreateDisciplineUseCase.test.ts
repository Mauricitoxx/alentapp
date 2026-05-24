import {describe, it, expect, vi, beforeEach} from 'vitest'
import {CreateDisciplineUseCase} from './CreateDisciplineUseCase.js'
import {DisciplineRepository} from '../domain/DisciplineRepository.js'
import {MemberRepository} from '../domain/MemberRepository.js'
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js'
import {DisciplineDTO} from '@alentapp/shared'
import { CreateDisciplineRequest } from '../../../shared/index.js'

describe('CreateDisciplineUseCase (unitarios - alta)', () => {
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validate: vi.fn(),
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

    it('1. crea una sancion si el socio existe y las fechas son validas', async () => {
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({
            id: 'uuid-1', ...validRequest, created_at: '2026-05-23T00:00:00.000Z',
        });

        const result = await useCase.execute(validRequest);

        expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
        expect(mockValidator.validateDates).toHaveBeenCalledWith(validRequest.start_date, validRequest.end_date);
        expect(mockDisciplineRepo.create).toHaveBeenCalledWith();
        expect(result.id).toBe('uuid-1');
    });

    it('2. lanza error si el socio no existe', async() => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validRequest)).rejects.toThrow('Socio no encontrado');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    })
});
