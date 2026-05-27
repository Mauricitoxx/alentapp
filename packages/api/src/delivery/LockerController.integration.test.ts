import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

// 1. Creamos el mock con todas las funciones que tu Caso de Uso va a usar
const { mockLockerRepo } = vi.hoisted(() => ({
    mockLockerRepo: {
        findAll: vi.fn(), 
        create: vi.fn(), 
        findById: vi.fn(), 
        findByNumber: vi.fn(), // 🌟 ¡Clave! Tu validador necesita esta función
        update: vi.fn(), 
        delete: vi.fn(),
    },
}));

// 2. Interceptamos el archivo real de forma absoluta para que Vitest use el plástico

vi.mock('../infrastructure/PostgresLockerRepository', () => ({
    PostgresLockerRepository: class { constructor() { return mockLockerRepo; } },
}));

describe('LockerController integration - alta (POST)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const validBody = {
        number: 14,
        location: 'Vestuario Mujeres',
        status: 'Available',
    };

    // ------------------------------------------------------------------------
    // TEST 1: CAMINO FELIZ (201 Created)
    // ------------------------------------------------------------------------
    it('1. devuelve 201 y crea el casillero cuando los datos son válidos', async () => {
        // Para el camino feliz, findByNumber tiene que decir que NO existe (null)
        mockLockerRepo.findByNumber.mockResolvedValueOnce(null);
        
        mockLockerRepo.create.mockResolvedValueOnce({ 
            id: 'locker-1', 
            ...validBody, 
            member_id: null 
        });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload: validBody,
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().data.id).toBe('locker-1');
        expect(mockLockerRepo.create).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 2: REGLA DE NEGOCIO / DUPLICADO (409 Conflict)
    // ------------------------------------------------------------------------
    it('2. devuelve 409 cuando el número de casillero ya se encuentra registrado', async () => {
        // Forzamos a que findByNumber devuelva que YA existe un casillero con ese número
        mockLockerRepo.findByNumber.mockResolvedValueOnce({
            id: 'locker-existente',
            number: 14,
            location: 'Gimnasio',
            status: 'Available',
            member_id: null
        });

        // También por las dudas entrenamos al create por si tu código lanza el error ahí
        mockLockerRepo.create.mockRejectedValueOnce(
            new Error('Ya existe un casillero con ese número')
        );

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload: validBody,
        });

        expect(response.statusCode).toBe(409);
        expect(response.json().error).toContain('Ya existe un casillero');
    });
});