import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

// 1. Creamos el mock con todas las funciones
const { mockEquipmentLoanRepo, mockMemberRepo } = vi.hoisted(() => ({
    mockEquipmentLoanRepo: {
        findAll: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    mockMemberRepo: {
        findById: vi.fn(),
    }
}));

// 2. Interceptamos el archivo real de forma absoluta para que Vitest use el mock
vi.mock('../infrastructure/PostgresEquipmentLoanRepository', () => ({
    PostgresEquipmentLoanRepository: class { constructor() { return mockEquipmentLoanRepo; } },
}));

vi.mock('../infrastructure/PostgresMemberRepository', () => ({
    PostgresMemberRepository: class { constructor() { return mockMemberRepo; } },
}));

describe('EquipmentLoanController integration - creación (POST)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const newLoanPayload = {
        item_name: 'Pelota de Fútbol',
        member_id: 'member-123',
        due_date: '2030-01-01T10:00:00Z'
    };

    it('1. devuelve 201 y crea el préstamo cuando los datos son válidos', async () => {
        mockMemberRepo.findById.mockResolvedValueOnce({ id: 'member-123', status: 'Activo', category: 'Pleno' });

        mockEquipmentLoanRepo.create.mockResolvedValueOnce({
            id: 'loan-123',
            ...newLoanPayload,
            status: 'Loaned',
            loan_date: new Date().toISOString()
        });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/equipment-loans',
            payload: newLoanPayload,
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().data.item_name).toBe('Pelota de Fútbol');
        expect(mockEquipmentLoanRepo.create).toHaveBeenCalled();
    });
});

describe('EquipmentLoanController integration - actualización (PUT)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const existingLoan = {
        id: 'loan-123',
        item_name: 'Pelota de Fútbol',
        status: 'Loaned',
        loan_date: '2026-05-27T10:00:00Z',
        due_date: '2026-05-28T10:00:00Z',
        member_id: 'member-123'
    };

    // ------------------------------------------------------------------------
    // TEST 1: CAMINO FELIZ (200 OK)
    // ------------------------------------------------------------------------
    it('1. devuelve 200 y actualiza el préstamo cuando los datos son válidos', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(existingLoan);

        const updatePayload = { status: 'Returned', due_date: '2026-06-01T10:00:00Z' };
        mockEquipmentLoanRepo.update.mockResolvedValueOnce({
            ...existingLoan,
            ...updatePayload
        });

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/equipment-loans/loan-123',
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().message).toBe('Prestamo actualizado correctamente');
        expect(response.json().data.status).toBe('Returned');
        expect(mockEquipmentLoanRepo.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 2: REGLA DE NEGOCIO / NO EXISTE (404 Not Found)
    // ------------------------------------------------------------------------
    it('2. devuelve 404 cuando el préstamo no existe', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/equipment-loans/loan-999',
            payload: { status: 'Returned' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('El prestamo no existe');
    });

    // ------------------------------------------------------------------------
    // TEST 3: REGLA DE NEGOCIO / ESTADO INVÁLIDO (400 Bad Request)
    // ------------------------------------------------------------------------
    it('3. devuelve 400 cuando el estado enviado es inválido', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(existingLoan);

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/equipment-loans/loan-123',
            payload: { status: 'RotoTotalmente' },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toContain('Estado de prestamo invalido');
    });

    // ------------------------------------------------------------------------
    // TEST 4: REGLA DE NEGOCIO / FECHA DE DEVOLUCIÓN EN EL PASADO (409 Conflict)
    // ------------------------------------------------------------------------
    it('4. devuelve 409 cuando la fecha de devolución no es en el futuro', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(existingLoan);

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/equipment-loans/loan-123',
            payload: { due_date: '2020-01-01' },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json().error).toContain('Fecha de devolucion invalida');
    });

    // ------------------------------------------------------------------------
    // TEST 5: REGLA DE NEGOCIO / FECHA DE DEVOLUCIÓN INVÁLIDA (409 Conflict)
    // ------------------------------------------------------------------------
    it('5. devuelve 409 cuando la fecha de devolución tiene formato inválido', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(existingLoan);

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/equipment-loans/loan-123',
            payload: { due_date: 'no-es-una-fecha' },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json().error).toContain('Fecha de devolucion invalida');
    });
});

describe('EquipmentLoanController integration - eliminación (DELETE)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const existingLoan = {
        id: 'loan-123',
        item_name: 'Pelota de Fútbol',
        status: 'Loaned',
        loan_date: '2026-05-27T10:00:00Z',
        due_date: '2026-05-28T10:00:00Z',
        member_id: 'member-123'
    };

    // ------------------------------------------------------------------------
    // TEST 1: CAMINO FELIZ (204 No Content)
    // ------------------------------------------------------------------------
    it('1. devuelve 204 y elimina el préstamo cuando es válido y está en Loaned', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(existingLoan);
        mockEquipmentLoanRepo.delete.mockResolvedValueOnce(undefined);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/equipment-loans/loan-123',
        });

        expect(response.statusCode).toBe(204);
        expect(response.payload).toBe('');
        expect(mockEquipmentLoanRepo.delete).toHaveBeenCalledWith('loan-123');
    });

    // ------------------------------------------------------------------------
    // TEST 2: REGLA DE NEGOCIO / NO EXISTE (404 Not Found)
    // ------------------------------------------------------------------------
    it('2. devuelve 404 cuando el préstamo a eliminar no existe', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/equipment-loans/loan-999',
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toContain('El préstamo no existe');
        expect(mockEquipmentLoanRepo.delete).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 3: REGLA DE NEGOCIO / ESTADO INVÁLIDO (400 Bad Request)
    // ------------------------------------------------------------------------
    it('3. devuelve 400 cuando el préstamo ya fue devuelto', async () => {
        mockEquipmentLoanRepo.findById.mockResolvedValueOnce({ ...existingLoan, status: 'Returned' });

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/equipment-loans/loan-123',
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toContain('No se puede eliminar un préstamo con historial de devolución');
        expect(mockEquipmentLoanRepo.delete).not.toHaveBeenCalled();
    });
});
