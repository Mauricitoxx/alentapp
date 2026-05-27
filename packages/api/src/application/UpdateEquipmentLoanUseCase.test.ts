import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateEquipmentLoanUseCase } from './UpdateEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanDTO } from '@alentapp/shared';

describe('UpdateEquipmentLoanUseCase', () => {
    let useCase: UpdateEquipmentLoanUseCase;
    let repository: ReturnType<typeof vi.mocked<EquipmentLoanRepository>>;
    let validator: EquipmentLoanValidator;

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
        validator = new EquipmentLoanValidator();
        useCase = new UpdateEquipmentLoanUseCase(repository, validator);
    });

    it('deberia actualizar el prestamo correctamente si todo es valido', async () => {
        repository.findById.mockResolvedValue(mockLoan);
        const updateData = { status: 'Returned' as const };
        const updatedLoan = { ...mockLoan, ...updateData };
        repository.update.mockResolvedValue(updatedLoan);

        const result = await useCase.execute('loan-123', updateData);

        expect(repository.findById).toHaveBeenCalledWith('loan-123');
        expect(repository.update).toHaveBeenCalledWith('loan-123', updateData);
        expect(result).toEqual(updatedLoan);
    });

    it('deberia fallar si el prestamo no existe', async () => {
        repository.findById.mockResolvedValue(null);

        await expect(useCase.execute('loan-123', { status: 'Returned' }))
            .rejects
            .toThrow('El prestamo no existe');
        
        expect(repository.update).not.toHaveBeenCalled();
    });

    it('deberia fallar si se envia una fecha de devolucion en el pasado o presente', async () => {
        repository.findById.mockResolvedValue(mockLoan);

        await expect(useCase.execute('loan-123', { due_date: '2000-01-01' }))
            .rejects
            .toThrow('La fecha de devolución debe ser posterior a la fecha actual');
        
        expect(repository.update).not.toHaveBeenCalled();
    });

    it('deberia fallar si se envia un estado invalido', async () => {
        repository.findById.mockResolvedValue(mockLoan);

        await expect(useCase.execute('loan-123', { status: 'Invalido' as any }))
            .rejects
            .toThrow('Estado de prestamo invalido');
        
        expect(repository.update).not.toHaveBeenCalled();
    });
});
