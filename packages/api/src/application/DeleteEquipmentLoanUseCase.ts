import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

export class DeleteEquipmentLoanUseCase {
    constructor(private readonly equipmentLoanRepository: EquipmentLoanRepository) {}

    async execute(id: string): Promise<void> {
        const existingLoan = await this.equipmentLoanRepository.findById(id);
        
        if (!existingLoan) {
            throw new Error('El préstamo no existe');
        }

        if (existingLoan.status !== 'Loaned') {
            throw new Error('No se puede eliminar un préstamo con historial de devolución');
        }

        await this.equipmentLoanRepository.delete(id);
    }
}
