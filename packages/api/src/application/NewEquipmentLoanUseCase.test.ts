import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { CreateEquipmentLoanUseCase } from './NewEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';

describe('CreateEquipmentLoanUseCase', () => {
    let useCase: CreateEquipmentLoanUseCase;
    let equipmentLoanRepoMock: Mocked<EquipmentLoanRepository>;
    let memberRepoMock: Mocked<MemberRepository>;
    let validatorMock: Mocked<EquipmentLoanValidator>;

    beforeEach(() => {
        equipmentLoanRepoMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as Mocked<EquipmentLoanRepository>;

        memberRepoMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByDni: vi.fn(),
            findByEmail: vi.fn(),
        } as unknown as Mocked<MemberRepository>;

        validatorMock = {
            validateDueDateIsFuture: vi.fn(),
            validateStatus: vi.fn(),
        } as unknown as Mocked<EquipmentLoanValidator>;

        useCase = new CreateEquipmentLoanUseCase(
            equipmentLoanRepoMock,
            memberRepoMock,
            validatorMock
        );
    });

    it('debe crear el prestamo exitosamente si cumple todas las validaciones', async () => {
        const req: CreateEquipmentLoanRequest = {
            item_name: 'Pelota',
            due_date: '2026-12-31',
            member_id: '1',
        };

        memberRepoMock.findById.mockResolvedValue({
            id: '1',
            name: 'Juan Perez',
            dni: '12345678',
            email: 'juan@test.com',
            birthdate: '1990-01-01',
            status: 'Activo',
            category: 'Pleno',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        equipmentLoanRepoMock.create.mockResolvedValue({
            id: 'loan-1',
            item_name: 'Pelota',
            due_date: new Date('2026-12-31'),
            member_id: '1',
            status: 'Loaned',
            loan_date: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        const result = await useCase.execute(req);

        expect(validatorMock.validateDueDateIsFuture).toHaveBeenCalledWith('2026-12-31');
        expect(memberRepoMock.findById).toHaveBeenCalledWith('1');
        expect(equipmentLoanRepoMock.create).toHaveBeenCalled();
        expect(result.id).toBe('loan-1');
        expect(result.status).toBe('Loaned');
    });

    it('debe fallar si el socio no existe', async () => {
        const req: CreateEquipmentLoanRequest = {
            item_name: 'Pelota',
            due_date: '2026-12-31',
            member_id: '99',
        };

        memberRepoMock.findById.mockResolvedValue(null);

        await expect(useCase.execute(req)).rejects.toThrow('El socio no existe');
        expect(equipmentLoanRepoMock.create).not.toHaveBeenCalled();
    });

    it('debe fallar si el socio no está Activo', async () => {
        const req: CreateEquipmentLoanRequest = {
            item_name: 'Pelota',
            due_date: '2026-12-31',
            member_id: '1',
        };

        memberRepoMock.findById.mockResolvedValue({
            id: '1',
            name: 'Juan Perez',
            dni: '12345678',
            email: 'juan@test.com',
            birthdate: '1990-01-01',
            status: 'Suspendido', // No Activo
            category: 'Pleno',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await expect(useCase.execute(req)).rejects.toThrow('El socio debe estar Activo para solicitar prestamos');
        expect(equipmentLoanRepoMock.create).not.toHaveBeenCalled();
    });

    it('debe fallar si el socio es de categoria Cadete', async () => {
        const req: CreateEquipmentLoanRequest = {
            item_name: 'Pelota',
            due_date: '2026-12-31',
            member_id: '1',
        };

        memberRepoMock.findById.mockResolvedValue({
            id: '1',
            name: 'Juan Perez',
            dni: '12345678',
            email: 'juan@test.com',
            birthdate: '1990-01-01',
            status: 'Activo',
            category: 'Cadete', // Categoría no permitida
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await expect(useCase.execute(req)).rejects.toThrow('Los socios Cadet tienen prohibido solicitar material');
        expect(equipmentLoanRepoMock.create).not.toHaveBeenCalled();
    });
});
