import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

// Seteamos una variable de entorno falsa para que no falle la importación de repositorios reales
vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgres://dummy:dummy@localhost:5432/dummy';
});

import { buildApp } from '../app.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';

// Mockeamos el repositorio de Préstamos
vi.mock('../infrastructure/PostgresEquipmentLoanRepository.js', () => {
    return {
        PostgresEquipmentLoanRepository: class {
            async findAll() { return []; }
            async findById(id: string) { return null; }
            async create(data: any) { 
                return { 
                    id: 'loan-1', 
                    ...data, 
                    status: 'Loaned', 
                    loan_date: new Date().toISOString() 
                }; 
            }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

// Mockeamos el repositorio de Socios (Member)
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) { 
                // Simulamos que el socio 1 existe y es válido
                if (id === '1') {
                    return { id: '1', name: 'Socio Valido', status: 'Activo', category: 'Pleno' };
                }
                return null; // Cualquier otro no existe
            }
            async findByDni(dni: string) { return null; }
            async create(data: any) { return data; }
            async update(id: string, data: any) { return data; }
            async delete(id: string) { return; }
        }
    };
});

describe('EquipmentLoan API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // Esperamos a que cargue la app (plugins, rutas, etc)
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/equipment-loans', () => {
        it('debe retornar 201 y crear el préstamo si los datos son válidos', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Pelota de Basquet',
                due_date: '2026-12-31', // Aseguramos que sea futura
                member_id: '1' // Socio válido (mockeado arriba)
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.item_name).toBe('Pelota de Basquet');
            expect(body.data.id).toBe('loan-1');
            expect(body.data.status).toBe('Loaned');
        });

        it('debe retornar 404 si el socio solicitado no existe', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Conos',
                due_date: '2026-12-31',
                member_id: '99' // Socio inexistente
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio no existe');
        });
    });
});
