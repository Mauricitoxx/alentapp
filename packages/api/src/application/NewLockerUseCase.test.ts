import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewLockerUseCase } from './NewLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { CreateLockerRequest } from '@alentapp/shared';

describe('NewLockerUseCase (unitarios - alta de casilleros)', () => {
    
    // 1. Creación de Mocks (Simuladores con funciones vacías vi.fn())
    const mockLockerRepo = {
        create: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumberFormat: vi.fn(),
        validateLocation: vi.fn(),
        validateNumberIsUnique: vi.fn(),
    } as unknown as LockerValidator;

    // 2. Inyección de dependencias simuladas al caso de uso
    const useCase = new NewLockerUseCase(mockLockerRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks(); // Limpia los espías antes de cada test
    });

    // ------------------------------------------------------------------------
    // TEST 1: CAMINO FELIZ (Creación Exitosa)
    // ------------------------------------------------------------------------
    it('1. debe crear un casillero exitosamente si pasa todas las validaciones', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 14,
            location: 'Vestuario Mujeres',
            status: 'Available'
        };

        // Entrenamos a los simuladores para que no tiren error (retornan void/undefined)
        vi.mocked(mockLockerValidator.validateNumberFormat).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateLocation).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateNumberIsUnique).mockResolvedValue(undefined);

        // Simulamos que el repositorio guarda el casillero y devuelve el DTO con sus valores por defecto
        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce({
            id: 'uuid-locker-123',
            number: 14,
            location: 'Vestuario Mujeres',
            status: 'Available',
            member_id: null
        });

        // Ejecutamos tu código real
        const result = await useCase.execute(mockRequest);

        // VERIFICACIONES: Comprobamos que el "cerebro" llamó a sus ayudantes correctamente
        expect(mockLockerValidator.validateNumberFormat).toHaveBeenCalledWith(mockRequest.number);
        expect(mockLockerValidator.validateLocation).toHaveBeenCalledWith(mockRequest.location);
        expect(mockLockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(mockRequest.number);

        // Comprobamos que se envió el comando de guardado con la estructura limpia
        expect(mockLockerRepo.create).toHaveBeenCalledWith({
            number: 14,
            location: 'Vestuario Mujeres',
            status: 'Available',
            member_id: null
        });

        // Validamos el retorno del caso de uso
        expect(result.id).toBe('uuid-locker-123');
        expect(result.status).toBe('Available');
    });

    // ------------------------------------------------------------------------
    // TEST 2: ERROR DE FORMATO EN EL NÚMERO (Menor o igual a cero)
    // ------------------------------------------------------------------------
    it('2. debe lanzar un error y NO guardar si el formato del número es inválido', async () => {
        const mockRequest: CreateLockerRequest = {
            number: -5,
            location: 'Pasillo Central'
        };

        // Forzamos al validador de formato a plantar bandera y escupir un Error
        vi.mocked(mockLockerValidator.validateNumberFormat).mockImplementationOnce(() => {
            throw new Error('El número de casillero debe ser mayor a cero');
        });

        // Ejecutamos esperando el rebotazo
        await expect(useCase.execute(mockRequest))
            .rejects.toThrow('El número de casillero debe ser mayor a cero');

        // PROTECCIÓN: Como falló la primera validación, el repositorio jamás debió ser llamado
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 3: ERROR EN LA UBICACIÓN (Vacía o inválida)
    // ------------------------------------------------------------------------
    it('3. debe lanzar un error y NO guardar si la ubicación está vacía', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 22,
            location: '' // Ubicación inválida
        };

        // El formato numérico pasa...
        vi.mocked(mockLockerValidator.validateNumberFormat).mockReturnValue(undefined);
        // ...pero el validador de ubicación se planta
        vi.mocked(mockLockerValidator.validateLocation).mockImplementationOnce(() => {
            throw new Error('La ubicación del casillero es requerida');
        });

        await expect(useCase.execute(mockRequest))
            .rejects.toThrow('La ubicación del casillero es requerida');

        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 4: ERROR DE NEGOCIO (Número ya existente en la base de datos)
    // ------------------------------------------------------------------------
    it('4. debe lanzar un error y NO guardar si el número de casillero ya está duplicado', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 14,
            location: 'Gimnasio'
        };

        // Los formatos de input están perfectos...
        vi.mocked(mockLockerValidator.validateNumberFormat).mockReturnValue(undefined);
        vi.mocked(mockLockerValidator.validateLocation).mockReturnValue(undefined);
        // ...pero al chequear contra los registros de la DB, salta que ya existe
        vi.mocked(mockLockerValidator.validateNumberIsUnique).mockRejectedValue(
            new Error('El número de casillero ya se encuentra registrado')
        );

        await expect(useCase.execute(mockRequest))
            .rejects.toThrow('El número de casillero ya se encuentra registrado');

        // Verificamos que se frenó el flujo antes de tocar la persistencia
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });
});