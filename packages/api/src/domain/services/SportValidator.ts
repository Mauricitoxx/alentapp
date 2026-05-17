import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

   //valida que el nombre del deporte sea unico
    async validateNameIsUnique(name: string, excludeSportId?: string): Promise<void> {
        const sportWithSameName = await this.sportRepo.findByName(name);
        
        if (sportWithSameName && sportWithSameName.id !== excludeSportId) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }

    //valida capacidad máxima de sport
    validateMaxCapacity(maxCapacity: number): void {
        if (maxCapacity <= 0) {
            throw new Error('La capacidad máxima debe ser un número mayor a cero');
        }
    }

}