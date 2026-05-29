import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';

describe('DeleteLockerUseCase (unitarios - eliminación de casilleros)', () => {
    
    // 1. Creación de Mocks (Simuladores con funciones vacías vi.fn())
    const mockLockerRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as LockerRepository;

    // 2. Inyección de dependencias simuladas al caso de uso
    const useCase = new DeleteLockerUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks(); // Limpia los espías antes de cada test para no arrastrar basura
    });

    // ------------------------------------------------------------------------
    // TEST 1: ERROR - CASILLERO INEXISTENTE
    // ------------------------------------------------------------------------
    it('1. debe lanzar un error si el casillero que se intenta eliminar no existe', async () => {
        // Entrenamos al simulador para que retorne null (no encontró nada en el sistema)
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(null);

        // Ejecutamos esperando el rebotazo de la validación inicial
        await expect(useCase.execute('invalid-id'))
            .rejects.toThrow('El casillero no existe');

        // VERIFICACIONES: Comprobamos que el cerebro buscó por ID pero JAMÁS llamó al borrado
        expect(mockLockerRepo.findById).toHaveBeenCalledWith('invalid-id');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 2: REGLA CRÍTICA TDD-012 - BLOQUEADO POR SOCIO ASIGNADO (member_id)
    // ------------------------------------------------------------------------
    it('2. debe lanzar un error y NO borrar si el casillero tiene un socio vinculado (member_id)', async () => {
        const mockLockerWithMember = {
            id: 'uuid-locker-111',
            number: 14,
            location: 'Vestuario Mujeres',
            status: 'Available',
            member_id: 'socio-999' // Tiene un socio asignado (rompe la regla)
        };

        // Entrenamos al repositorio para que devuelva el casillero con el socio usando un casteo 'as any'
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(mockLockerWithMember as any);

        // Ejecutamos esperando el rechazo por regla de negocio
        await expect(useCase.execute('uuid-locker-111'))
            .rejects.toThrow('No se puede eliminar un casillero que está ocupado por un socio');

        // PROTECCIÓN: Verificamos que se frenó el flujo y la persistencia no fue afectada
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 3: REGLA CRÍTICA TDD-012 - BLOQUEADO POR ESTADO OCCUPIED
    // ------------------------------------------------------------------------
    it('3. debe lanzar un error y NO borrar si el estado del casillero es Occupied', async () => {
        const mockOccupiedLocker = {
            id: 'uuid-locker-222',
            number: 15,
            location: 'Pasillo Central',
            status: 'Occupied', // El estado es Occupied (rompe la regla)
            member_id: null
        };

        // Entrenamos al repositorio para que devuelva el casillero ocupado usando un casteo 'as any'
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(mockOccupiedLocker as any);

        // Ejecutamos esperando el rechazo por estado inconsistente
        await expect(useCase.execute('uuid-locker-222'))
            .rejects.toThrow('No se puede eliminar un casillero que está ocupado por un socio');

        // PROTECCIÓN: Comprobamos que el repositorio jamás ejecutó la sentencia de borrado
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 4: CAMINO FELIZ (Borrado Físico Exitoso)
    // ------------------------------------------------------------------------
    it('4. debe eliminar el casillero permanentemente (Hard Delete) si no tiene socio y está disponible', async () => {
        const mockCleanLocker = {
            id: 'uuid-locker-333',
            number: 16,
            location: 'Vestuario Varones',
            status: 'Available',
            member_id: null // Sin socio y disponible (pasa todas las reglas)
        };

        // Entrenamos al repositorio para que encuentre el casillero y procese el borrado con casteos limpios
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(mockCleanLocker as any);
        vi.mocked(mockLockerRepo.delete).mockResolvedValue(undefined);

        // Ejecutamos el caso de uso real esperando que resuelva exitosamente
        await expect(useCase.execute('uuid-locker-333')).resolves.not.toThrow();

        // VERIFICACIONES: Comprobamos el ciclo completo de la persistencia
        expect(mockLockerRepo.findById).toHaveBeenCalledWith('uuid-locker-333');
        expect(mockLockerRepo.delete).toHaveBeenCalledWith('uuid-locker-333');
    });
});