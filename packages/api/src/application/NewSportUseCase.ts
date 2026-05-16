import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        // 1. Validaciones de negocio (centralizadas)
        await this.sportValidator.validateNameIsUnique(data.name);

        this.sportValidator.validateMaxCapacity(data.max_capacity);
   

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoSport = await this.sportRepository.create({
            name: data.name,
            description: data.description,
            max_capacity: data.max_capacity,
            additional_price: data.additional_price,
            requires_medical_certificate: data.requires_medical_certificate,
            created_at: new Date().toISOString(),
        });

        return nuevoSport;
    }
}
