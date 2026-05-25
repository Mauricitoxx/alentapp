import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '../generated/client/client.js';
import { buildApp } from '../app.js'; 
import { CreateSportRequest } from '@alentapp/shared';

const prisma = new PrismaClient();

describe('SportController integration - alta (POST)', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = await buildApp();
        await app.ready();

        //LIMPIEZA: Vaciamos la tabla antes de cada test para evitar colisiones de nombres duplicados
        await prisma.sport.deleteMany();
    });

    afterEach(async () => {
        // Cerramos la app para liberar los sockets y conexiones de Prisma a la DB de prueba
        await app.close();
    });

    //REGISTRO EXITOSO
    it('debe registrar un deporte exitosamente y persistirlo en la base de datos', async () => {
        // 1. Preparar la petición válida (cumpliendo las reglas del frontend que modificamos)
        const requestBody: CreateSportRequest = {
            name: 'Fútbol 5',
            description: 'Torneo nocturno en cancha sintética',
            max_capacity: 10,
            additional_price: 1500,
            requires_medical_certificate: true
        };

        // 2. Ejecutar la petición HTTP virtual usando el método inject de Fastify
        const response = await app.inject({
            method: 'POST',
            url: '/sports', 
            payload: requestBody
        });

        // 3. Verificaciones de la respuesta de la API (Capa Delivery)
        expect(response.statusCode).toBe(201); // Created
        
        const responseData = JSON.parse(response.body);
        expect(responseData).toHaveProperty('id');
        expect(responseData.name).toBe(requestBody.name);
        expect(responseData.max_capacity).toBe(requestBody.max_capacity);

        // 4. Consultar a la base de datos real con Prisma
        const savedSport = await prisma.sport.findUnique({
            where: { name: 'Fútbol 5' }
        });

        expect(savedSport).not.toBeNull();
        expect(savedSport?.description).toBe(requestBody.description);
        expect(savedSport?.max_capacity).toBe(requestBody.max_capacity);
        expect(savedSport?.requires_medical_certificate).toBe(true);
    });

    //CASO NOMBRE DUPLICADO
    it('debe retornar un error si el nombre del deporte ya se encuentra registrado', async () => {
        // 1. Preparamos el escenario insertando un deporte idéntico directamente en la base de datos
        await prisma.sport.create({
            data: {
                name: 'Tenis',
                description: 'Cancha de polvo de ladrillo',
                max_capacity: 4,
                additional_price: 800,
                requires_medical_certificate: false
            }
        });

        // 2. Intentamos registrar el mismo deporte a través del endpoint público de la API
        const duplicateRequestBody: CreateSportRequest = {
            name: 'Tenis', // Mismo nombre
            description: 'Otra descripción distinta',
            max_capacity: 2,
            additional_price: 1000,
            requires_medical_certificate: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/sports',
            payload: duplicateRequestBody
        });

        // 3. Verificaciones: Debería fallar por la validación del caso de uso real
    
        expect(response.statusCode).toBe(409); 
        
        const responseData = JSON.parse(response.body);
        expect(responseData.message).toContain('Ya existe un deporte con ese nombre');
    });

    //CASO CAPACIDAD MÁXIMA INVÁLIDA
    it('debe retornar un error si la capacidad máxima enviada es inválida', async () => {
        // 1. Enviamos un valor negativo 
        const invalidRequestBody = {
            name: 'Natación',
            description: 'Pileta olímpica',
            max_capacity: -5, // Valor inválido para el caso de uso
            additional_price: 0,
            requires_medical_certificate: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/sports',
            payload: invalidRequestBody
        });

        // 2. Verificaciones: El validador síncrono debe interceptar esto
        expect(response.statusCode).toBe(400);
        
        const responseData = JSON.parse(response.body);
        expect(responseData.message).toContain('La capacidad máxima debe ser un número mayor a cero');

        // 3. Verificación extra: Nos aseguramos de que NO se haya guardado nada en la DB
        const checkDb = await prisma.sport.findUnique({
            where: { name: 'Natación' }
        });
        expect(checkDb).toBeNull();
    });
});