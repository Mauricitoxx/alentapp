import { LockerRepository } from '../LockerRepository.js';

export class LockerValidator {
    constructor(private readonly lockerRepo: LockerRepository) {}

    /**
     * Valida que el número sea un entero positivo (400 Bad Request)
     */
    validateNumberFormat(number: number): void {
        if (number <= 0 || !Number.isInteger(number)) {
            throw new Error('El número de casillero debe ser un entero positivo');
        }
    }

    /**
     * Valida que la ubicación no venga vacía (400 Bad Request)
     */
    validateLocation(location: string): void {
        if (!location || location.trim() === '') {
            throw new Error('La ubicación del casillero es obligatoria');
        }
    }

    /**
     * Valida la unicidad del número (409 Conflict)
     * El parámetro 'excludeLockerId' es la clave para la Modificación.
     */
    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        const existingLocker = await this.lockerRepo.findByNumber(number);
        
        // Si existe un casillero con ese número, pero tiene un ID DISTINTO al que estoy editando,
        // significa que Alberto está intentando usar un número que ya le pertenece a OTRO casillero.
        if (existingLocker && existingLocker.id !== excludeLockerId) {
            throw new Error('Ya existe un casillero con el número proporcionado');
        }
    }
}