import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanDTO, CreateEquipmentLoanRequest } from '@alentapp/shared';

export class CreateEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository,
        private readonly memberRepository: MemberRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator
    ) {}

    async execute(data: CreateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {
        // 1. Validaciones de negocio puras
        this.equipmentLoanValidator.validateDueDateIsFuture(data.due_date);

        // 2. Verificar existencia del socio
        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            const error = new Error('El socio no existe');
            (error as any).status = 404; // Propiedad custom para el controlador
            throw error;
        }

        // 3. Verificar estado del socio
        if (member.status !== 'Activo') {
            const error = new Error('El socio debe estar Activo para solicitar prestamos');
            (error as any).status = 403;
            throw error;
        }

        // 4. Verificar categoría del socio (Regla de negocio estricta del TDD)
        if (member.category === 'Cadete') {
            const error = new Error('Los socios Cadet tienen prohibido solicitar material');
            (error as any).status = 403;
            throw error;
        }

        // 5. Persistir el nuevo préstamo
        const nuevoPrestamo = await this.equipmentLoanRepository.create({
            item_name: data.item_name,
            due_date: data.due_date,
            member_id: data.member_id,
            status: 'Loaned', // Estado por defecto
            loan_date: new Date().toISOString(),
        });

        return nuevoPrestamo;
    }
}
