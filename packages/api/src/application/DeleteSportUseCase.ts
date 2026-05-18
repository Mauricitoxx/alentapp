import { SportRepository } from '../domain/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(id: string): Promise<void> {
        // 1. Validar existencia del deporte antes de intentar eliminarlo
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte especificado no existe');
        }

        // 2. Ejecutar la eliminación en la base de datos a través de la interfaz de dominio
        await this.sportRepo.delete(id);
    }
}