import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Validar existencia del casillero (404 Not Found si no existe)
        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker) {
            throw new Error('El casillero no existe');
        }

        // 2. Validar formatos si Alberto envió cambios en número o ubicación
        if (data.number !== undefined) {
            this.lockerValidator.validateNumberFormat(data.number);
        }
        if (data.location !== undefined) {
            this.lockerValidator.validateLocation(data.location);
        }

        // 3. Validar duplicidad de número usando el excludeLockerId (409 Conflict)
        if (data.number !== undefined && data.number !== existingLocker.number) {
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        // 4. Calcular el estado final combinando lo que había con lo nuevo
        const finalStatus = data.status !== undefined ? data.status : existingLocker.status;
        const finalMemberId = data.member_id !== undefined ? data.member_id : existingLocker.member_id;

        // 🔥 REGLA CRÍTICA TDD-011: Bloquear asignación si está en Mantenimiento (400 Bad Request)
        if (finalStatus === 'Maintenance' && finalMemberId !== null && finalMemberId !== undefined) {
            throw new Error('Un casillero no puede asignarse si su status es Maintenance');
        }

        // 5. Enviar la actualización limpia a la base de datos
        return await this.lockerRepository.update(id, data);
    }
}