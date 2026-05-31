import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteEquipmentLoanUseCase } from './DeleteEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanDTO } from '@alentapp/shared';

describe('DeleteEquipmentLoanUseCase', () => {
    let useCase: DeleteEquipmentLoanUseCase;
    let repository: ReturnType<typeof vi.mocked<EquipmentLoanRepository>>;

    const mockLoan: EquipmentLoanDTO = {
        id: 'loan-123',
        item_name: 'Pelota de Fútbol',
        status: 'Loaned',
        loan_date: '2026-05-27T10:00:00Z',
        due_date: '2026-05-28T10:00:00Z',
        member_id: 'member-123'
    };

    beforeEach(() => {
        repository = {
            create: vi.fn(),
            findById: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        };
        useCase = new DeleteEquipmentLoanUseCase(repository);
    });

    it('deberia eliminar el prestamo correctamente si existe y esta en estado Loaned', async () => {
        repository.findById.mockResolvedValue(mockLoan);
        repository.delete.mockResolvedValue();

        await useCase.execute('loan-123');

        expect(repository.findById).toHaveBeenCalledWith('loan-123');
        expect(repository.delete).toHaveBeenCalledWith('loan-123');
    });

    it('deberia lanzar un error si el prestamo no existe', async () => {
        repository.findById.mockResolvedValue(null);

        await expect(useCase.execute('loan-123'))
            .rejects
            .toThrow('El préstamo no existe');
        
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deberia lanzar un error si el prestamo ya no esta en estado Loaned (ej. Returned)', async () => {
        repository.findById.mockResolvedValue({ ...mockLoan, status: 'Returned' });

        await expect(useCase.execute('loan-123'))
            .rejects
            .toThrow('No se puede eliminar un préstamo con historial de devolución');
        
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deberia lanzar un error si el prestamo esta dañado (Damaged)', async () => {
        repository.findById.mockResolvedValue({ ...mockLoan, status: 'Damaged' });

        await expect(useCase.execute('loan-123'))
            .rejects
            .toThrow('No se puede eliminar un préstamo con historial de devolución');
        
        expect(repository.delete).not.toHaveBeenCalled();
    });
});
