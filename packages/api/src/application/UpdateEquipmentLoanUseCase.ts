import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanDTO, UpdateEquipmentLoanRequest } from '@alentapp/shared';

export class UpdateEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator
    ) {}

    async execute(id: string, data: UpdateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {
        // 1. Validar si el préstamo existe
        const existingLoan = await this.equipmentLoanRepository.findById(id);
        if (!existingLoan) {
            throw new Error('El prestamo no existe');
        }

        // 2. Validar que la nueva fecha de devolución sea futura (si se provee)
        if (data.due_date) {
            this.equipmentLoanValidator.validateDueDateIsFuture(data.due_date);
        }

        // 3. Validar el estado (si se provee)
        if (data.status) {
            this.equipmentLoanValidator.validateStatus(data.status);
        }

        // 4. Ejecutar la actualización a través del puerto
        return this.equipmentLoanRepository.update(id, data);
    }
}
