import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './NewSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { CreateSportRequest } from '@alentapp/shared';
import { mock } from 'node:test';

describe('CreateSportUseCase', () => {
    //Creacion de Moks de nuestras dependencias
    const mockSportRepo = { //simula acceso a la base de datos (repositorio)  para crear deporte
        create: vi.fn(),
    } as unknown as SportRepository; //para que lo conozca como SportRepository

    //simula las validaciones para el deporte
    const mockSportValidator = {
        validateNameIsUnique: vi.fn(),
        validateMaxCapacity: vi.fn(),
    } as unknown as SportValidator; //para que lo conozca como SportValidator

    //Instanciamos el caso de uso inyectando los mocks
    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks(); //limpia los mocks antes de cada test para evitar interferencias
    });

    //Test Unitario para el caso de uso de creacion de deporte exitoso
    it ('debe crear un deporte exitosamente si pasa validaciones', async () => {
        const mockRequest: CreateSportRequest = { //datos de entrada para crear un deporte
            name: 'Futbol',
            description: 'Deporte de 11 vs 11',
            max_capacity: 20,
            additional_price: 500,
            requires_medical_certificate: true
        };

        //simulamos que el nombre del deporte es unico
        vi.mocked(mockSportValidator.validateNameIsUnique).mockResolvedValue(undefined);
        
        //simulamos que la capacidad es valida
        vi.mocked(mockSportValidator.validateMaxCapacity).mockReturnValue(undefined); 
        
        //usamos undefinded porque la validacion no retorna nada si es exitosa
    
        //Simulamos respuesta de exito de la base de datos
        vi.mocked(mockSportRepo.create).mockResolvedValueOnce({
            id: 'uuid-sport-123',
            ...mockRequest,
            created_at: '2026-04-28T00:00:00.000Z'
        });

        const result = await useCase.execute(mockRequest); //ejecutamos el caso de uso con los datos de entrada
    
        //VERIFICACIONES
        
        //Comprobamos que se llamo al validador con los datos correctos
        expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith(mockRequest.name);
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(mockRequest.max_capacity);

        //Comprobamos que se intento persistir los datos con el repositorio
        expect(mockSportRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Futbol',
            max_capacity: 20,
            requires_medical_certificate: true
        })); //no colocamos todos los campos para no duplicar codigo y nos enfocamos en los mas relevantes para la logica de negocio
        

        //Comprobamos el retorno del caso de uso
        expect(result.id).toBe('uuid-sport-123');
        expect(result.name).toBe('Futbol');
    });

    //Test Unitario para el caso de uso de creacion de deporte con error por nombre no unico
    it('debe lanzar un error si el nombre del deporte no es unico', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Golf',
            description: 'Deporte de campo',
            max_capacity: 15,
            additional_price: 1500,
            requires_medical_certificate: false
        };

        //simulamos que el validador lanza error porque el nombre no es único
        vi.mocked(mockSportValidator.validateNameIsUnique).mockRejectedValue(new Error('El nombre del deporte ya existe'));

        //Ejecutamos esperando que lance el error
        await expect(useCase.execute(mockRequest)).rejects.toThrow('El nombre del deporte ya existe');

        //Verificamos que nunca se haya llamado al repositorio para guardar en la DB
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    //Test Unitario para el caso de uso de creacion de deporte con error por capacidad maxima invalida
    it('debe lanzar un error si la capacidad maxima es invalida', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Tenis',
            description: 'Deporte de raqueta',
            max_capacity: -5, //capacidad invalida
            additional_price: 300,
            requires_medical_certificate: false
        };

        //Simulamos que el nombre del deporte es unico para llegar a la validacion de capacidad
        vi.mocked(mockSportValidator.validateNameIsUnique).mockResolvedValue(undefined);
        
        //Simulamos que el validador lanza error por capacidad maxima invalida
        vi.mocked(mockSportValidator.validateMaxCapacity).mockImplementation(() => {
            throw new Error('La capacidad máxima debe ser mayor a cero');
        });

        //Ejecutamos esperando que lance el error
        await expect(useCase.execute(mockRequest)).rejects.toThrow('La capacidad máxima debe ser mayor a cero');


        //Verificamos que nunca se haya llamado al repositorio para guardar en la DB
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });


});