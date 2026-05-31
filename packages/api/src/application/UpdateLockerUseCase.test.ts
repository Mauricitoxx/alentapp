import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

describe('UpdateLockerUseCase (unitarios - modificación de casilleros)', () => {
    
    const mockLockerRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumberFormat: vi.fn(),
        validateLocation: vi.fn(),
        validateNumberIsUnique: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new UpdateLockerUseCase(mockLockerRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const existingLocker: LockerDTO = {
        id: 'uuid-locker-123',
        number: 14,
        location: 'Vestuario Mujeres',
        status: 'Available',
        member_id: null
    };

    // ------------------------------------------------------------------------
    // TEST 1: CAMINO FELIZ
    // ------------------------------------------------------------------------
    it('1. debe actualizar un casillero exitosamente si existe y pasa todas las validaciones', async () => {
        const mockRequest: UpdateLockerRequest = {
            number: 15,
            location: 'Vestuario Mujeres Modificado',
            status: 'Available'
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker);
        vi.mocked(mockLockerValidator.validateNumberFormat).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateLocation).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateNumberIsUnique).mockResolvedValue(undefined);

        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...existingLocker,
            number: 15,
            location: 'Vestuario Mujeres Modificado'
        });

        const result = await useCase.execute('uuid-locker-123', mockRequest);

        expect(mockLockerRepo.findById).toHaveBeenCalledWith('uuid-locker-123');
        expect(mockLockerRepo.update).toHaveBeenCalledWith('uuid-locker-123', mockRequest);
        expect(result.number).toBe(15);
    });

    // ------------------------------------------------------------------------
    // TEST 2: ERROR SI NO EXISTE
    // ------------------------------------------------------------------------
    it('2. debe lanzar un error y NO guardar si el casillero a modificar no existe', async () => {
        const mockRequest: UpdateLockerRequest = { number: 20, location: 'Gimnasio' };
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-no-existe', mockRequest))
            .rejects.toThrow('El casillero no existe');

        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 3: ERROR DE DUPLICADO
    // ------------------------------------------------------------------------
    it('3. debe lanzar un error y NO actualizar si el número ya está ocupado por otro casillero', async () => {
        const mockRequest: UpdateLockerRequest = { number: 99, location: 'Sector Norte' };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker);
        vi.mocked(mockLockerValidator.validateNumberFormat).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateLocation).mockReturnValue(undefined);
        
        vi.mocked(mockLockerValidator.validateNumberIsUnique).mockRejectedValueOnce(
            new Error('El número de casillero ya se encuentra registrado')
        );

        await expect(useCase.execute('uuid-locker-123', mockRequest))
            .rejects.toThrow('El número de casillero ya se encuentra registrado');

        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 4: REGLA CRÍTICA TDD-011
    // ------------------------------------------------------------------------
    it('4. debe lanzar un error si se intenta cambiar el estado a Maintenance pero tiene un socio asignado', async () => {
        const mockRequest: UpdateLockerRequest = {
            status: 'Maintenance',
            member_id: 'member-123'
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker);

        await expect(useCase.execute('uuid-locker-123', mockRequest))
            .rejects.toThrow('Un casillero no puede asignarse si su status es Maintenance');

        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });
});