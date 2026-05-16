import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export class CreateMemberUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        // 1. Validaciones de negocio (centralizadas)
        await this.sportValidator.validateNameIsUnique(data.name);

        this.sportValidator.validateMaxCapacity(data.maxCapacity);
   

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoSport = await this.sportRepository.create({
            name: data.name,
            description: data.description,
            max_capacity: data.maxCapacity,
            additional_price: data.additionalPrice,
            requires_medical_certificate: data.requiresMedicalCertificate
           
        });

        return nuevoSport;
    }
}
