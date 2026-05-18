import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

describe('DeleteLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new DeleteLockerUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el casillero no existe', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute('uuid-no-existe')).rejects.toThrow('El casillero no existe');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el casillero está ocupado por un socio', async () => {
        const locker: LockerDTO = {
            id: 'uuid-1',
            number: 101,
            location: 'Planta Baja',
            status: 'Available',
            member_id: 'member-123',
        };
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(locker);

        await expect(useCase.execute('uuid-1')).rejects.toThrow('No se puede eliminar un casillero que está ocupado por un socio');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el casillero está en estado Occupied', async () => {
        const locker: LockerDTO = {
            id: 'uuid-2',
            number: 102,
            location: 'Planta Alta',
            status: 'Occupied',
            member_id: null,
        };
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(locker);

        await expect(useCase.execute('uuid-2')).rejects.toThrow('No se puede eliminar un casillero que está ocupado por un socio');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el casillero cuando está libre', async () => {
        const locker: LockerDTO = {
            id: 'uuid-3',
            number: 103,
            location: 'Sector C',
            status: 'Available',
            member_id: null,
        };
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(locker);

        await useCase.execute('uuid-3');

        expect(mockLockerRepo.delete).toHaveBeenCalledWith('uuid-3');
    });
});
