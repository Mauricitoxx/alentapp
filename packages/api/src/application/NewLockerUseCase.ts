import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

export class NewLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator // <-- Inyectamos el validador de dominio
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        // 1. Delegamos las validaciones al servicio de dominio (adiós a los if sueltos acá)
        this.lockerValidator.validateNumberFormat(data.number);
        this.lockerValidator.validateLocation(data.location);
        await this.lockerValidator.validateNumberIsUnique(data.number);

        // 2. Persistencia pura: Si el validador no tiró ningún error, guardamos el registro
        return await this.lockerRepository.create({
            number: data.number,
            location: data.location,
            status: data.status || 'Available', // Regla: Nace por defecto como Disponible
            member_id: null,                  // Nace sin socio vinculado (nullable)
        });
    }
}