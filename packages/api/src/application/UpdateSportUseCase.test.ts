import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
    // Creación de Mocks de nuestras dependencias
    const mockSportRepo = { // Simula el acceso a la base de datos (repositorio) para actualizar deporte
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as SportRepository; // Para que lo conozca como SportRepository

    // Simula las validaciones para el deporte
    const mockSportValidator = {
        validateMaxCapacity: vi.fn(),
    } as unknown as SportValidator; // Para que lo conozca como SportValidator

    // Instanciamos el caso de uso inyectando los mocks
    const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);

    // Deporte base simulado que "ya existe" en la base de datos
    const mockExistingSport: SportDTO = {
        id: 'sport-123',
        name: 'Tenis',
        description: 'Cancha de polvo de ladrillo',
        max_capacity: 4,
        additional_price: 500,
        requires_medical_certificate: false,
        created_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks(); // Limpia los mocks antes de cada test para evitar interferencias
    });

    // Test Unitario para la actualización exitosa de un deporte
    it('debe actualizar exitosamente la descripción y la capacidad de un deporte', async () => {
        const mockRequest: UpdateSportRequest = { // Datos de entrada para modificar el deporte
            description: 'Nueva descripción para el deporte',
            max_capacity: 8,
        };

        const expectedUpdatedSport: SportDTO = {
            ...mockExistingSport,
            description: mockRequest.description!,
            max_capacity: mockRequest.max_capacity!,
        };

        // Simulamos que el repositorio encuentra el deporte existente
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(mockExistingSport);
        
        // Simulamos que la validación de capacidad pasa sin problemas (retorna undefined)
        vi.mocked(mockSportValidator.validateMaxCapacity).mockReturnValue(undefined);

        // Simulamos respuesta de éxito de la persistencia
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce(expectedUpdatedSport);

        const result = await useCase.execute('sport-123', mockRequest); // Ejecutamos el caso de uso

        // VERIFICACIONES
        
        // Comprobamos que se buscó correctamente por ID
        expect(mockSportRepo.findById).toHaveBeenCalledWith('sport-123');

        // Comprobamos que se llamó al validador con la capacidad enviada
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(8);

        // Comprobamos que se envió el objeto mutado respetando la regla de negocio
        expect(mockSportRepo.update).toHaveBeenCalledWith('sport-123', {
            description: 'Nueva descripción para el deporte',
            max_capacity: 8,
        });

        // Comprobamos el retorno del caso de uso
        expect(result).toEqual(expectedUpdatedSport);
    });

    // Test Unitario para error cuando el deporte a modificar no existe
    it('debe lanzar un error si el deporte especificado no existe', async () => {
        const mockRequest: UpdateSportRequest = {
            description: 'Cambio de descripción',
        };

        // Simulamos que el repositorio no encuentra el deporte (retorna null)
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        // Ejecutamos esperando que lance el error de existencia
        await expect(useCase.execute('id-inexistente', mockRequest)).rejects.toThrow('El deporte especificado no existe');

        // Verificamos que el flujo se cortó y nunca llamó al validador ni al método update
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled();
        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    // Test Unitario para comprobar que se mantengan datos previos si no se envían campos opcionales
    it('debe mantener los valores previos si el request no envía modificaciones', async () => {
        const mockRequest: UpdateSportRequest = {}; // Request vacío

        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(mockExistingSport);
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce(mockExistingSport);

        await useCase.execute('sport-123', mockRequest);

        // Verificamos que la regla de negocio filtró y asignó los valores que ya tenía almacenados
        expect(mockSportRepo.update).toHaveBeenCalledWith('sport-123', {
            description: mockExistingSport.description,
            max_capacity: mockExistingSport.max_capacity,
        });

        // Comprobamos que como no se envió max_capacity, el validador síncrono no se ejecutó
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled();
    });

    // Test Unitario para error si la capacidad enviada viola las reglas de dominio
    it('debe propagar el error si la validación de capacidad máxima falla', async () => {
        const mockRequest: UpdateSportRequest = {
            max_capacity: -10, // Capacidad inválida
        };

        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(mockExistingSport);
        
        // Simulamos que el validador lanza la excepción de dominio
        vi.mocked(mockSportValidator.validateMaxCapacity).mockImplementation(() => {
            throw new Error('La capacidad máxima debe ser mayor a cero');
        });

        // Ejecutamos esperando que la excepción sea propagada por el caso de uso
        await expect(useCase.execute('sport-123', mockRequest)).rejects.toThrow('La capacidad máxima debe ser mayor a cero');

        // Verificamos que el error impidió que el repositorio guardara los cambios
        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });
});