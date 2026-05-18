import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Validar existencia del casillero (404 Recurso Inexistente)
        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker) {
            const error = new Error('El casillero no existe');
            (error as any).statusCode = 404;
            throw error;
        }

        // 2. Validar formatos físicos (400 Datos Faltantes / Malformados)
        try {
            if (data.number !== undefined) this.lockerValidator.validateNumberFormat(data.number);
            if (data.location !== undefined) this.lockerValidator.validateLocation(data.location);
        } catch (err: any) {
            err.statusCode = 400;
            throw err;
        }

        // 3. Validar duplicidad de número excluyendo el casillero actual (409 Conflicto)
        if (data.number !== undefined && data.number !== existingLocker.number) {
            try {
                await this.lockerValidator.validateNumberIsUnique(data.number, id);
            } catch (err: any) {
                err.statusCode = 409;
                throw err;
            }
        }

        // --- Lógica de Estados por Software ---
        let statusFinal = data.status !== undefined ? data.status : existingLocker.status;
        let memberIdFinal = data.member_id !== undefined ? data.member_id : existingLocker.member_id;

        // Transición automática: si se vincula un socio, pasa a Occupied
        if (data.member_id !== undefined && data.member_id !== null) {
            statusFinal = 'Occupied';
        } 
        // Transición automática: si se desvincula enviando null, regresa a Available
        else if (data.member_id === null && statusFinal === 'Occupied') {
            statusFinal = 'Available';
        }

        // 4. 🔥 REGLA CRÍTICA TDD-011: Bloquear asignación en Mantenimiento (400 Bad Request)
        if (statusFinal === 'Maintenance' && memberIdFinal !== null && memberIdFinal !== undefined) {
            const error = new Error('Un casillero no puede asignarse si su status es Maintenance');
            (error as any).statusCode = 400;
            throw error;
        }

        // Estructuramos el payload limpio final calculado
        const payloadLimpio: UpdateLockerRequest = {
            ...data,
            status: statusFinal,
            member_id: memberIdFinal
        };

        return await this.lockerRepository.update(id, payloadLimpio);
    }
}