import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        // 1. Validar existencia del casillero en el sistema
        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('El casillero no existe');
        }

        // 2. REGLA CRÍTICA TDD-012: Comprobar si tiene un socio vinculado o si su estado es Occupied
        const tieneSocioAsignado = locker.member_id !== null && locker.member_id !== undefined && locker.member_id !== "";
        const estaOcupado = locker.status === 'Occupied';

        if (tieneSocioAsignado || estaOcupado) {
            throw new Error('No se puede eliminar un casillero que está ocupado por un socio');
        }

        // 3. Borrado físico definitivo (Hard Delete)
        await this.lockerRepository.delete(id);
    }
}