import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        // 1. Validar existencia del deporte
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte especificado no existe');
        }

        // 2. Aplicar regla de negocio: Filtrar solo los campos permitidos para edición
        // Aunque el DTO compartido permita otros campos opcionales, el caso de uso
        // restringe la mutación solo a descripción y capacidad máxima.
        const finalData: UpdateSportRequest = {
            description: data.description !== undefined ? data.description : existingSport.description,
            max_capacity: data.max_capacity !== undefined ? data.max_capacity : existingSport.max_capacity,
        };

        // 3. Validar la capacidad máxima si se envió en el request
        if (data.max_capacity !== undefined) {
            this.sportValidator.validateMaxCapacity(finalData.max_capacity!);
        }

        // 4. Persistencia a través del repositorio de dominio
        return this.sportRepo.update(id, finalData);
    }
}