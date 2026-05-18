import { FastifyRequest, FastifyReply } from 'fastify';
import { NewLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js'; 
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js'; // 🌟 1. AGREGAMOS ESTE IMPORT
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared'; // 🌟 2. SUMAMOS UpdateLockerRequest

export class LockerController {
    constructor(
        private readonly newLockerUseCase: NewLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase // 🌟 3. INYECTAMOS EL USE CASE ACÁ
    ) {}

    /**
     * Endpoint: POST /api/v1/lockers
     * Maneja el Alta de un casillero físico en el sistema (TDD-010).
     */
    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.newLockerUseCase.execute(request.body);
            
            // 🌟 MODIFICACIÓN: Ya NO destruimos member_id, lo mandamos entero para que React lo use
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            const message = error.message;

            if (message.includes('Ya existe un casillero')) {
                return reply.status(409).send({ error: message });
            }

            if (message.includes('entero positivo')) {
                return reply.status(400).send({ error: message });
            }

            if (message.includes('obligatoria')) {
                return reply.status(400).send({ error: message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async getAll(
        _request: FastifyRequest,
        reply: FastifyReply,
    ) {
        try {
            const lockers = await this.getLockersUseCase.execute();
            
            // 🌟 MODIFICACIÓN: Enviamos los lockers enteros (con su member_id) para que la grilla dibuje los socios vinculados
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            console.error("Error real capturado:", error);
            return reply.status(500).send({ 
                error: error.message || "Error interno al obtener los casilleros",
                details: error.toString()
            });
        }
    }

    /**
     * 🌟 4. NUEVO MÉTODO AGREGADO: Endpoint: PUT /api/v1/lockers/:id
     * Maneja la Modificación y asignación de casilleros (TDD-011).
     */
    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const { id } = request.params;

        try {
            const updatedLocker = await this.updateLockerUseCase.execute(id, request.body);
            return reply.status(200).send({ data: updatedLocker });
        } catch (error: any) {
            // Respeta tu misma lógica pura: extrae el statusCode que le inyectó el UseCase
            const statusCode = error.statusCode || 500;
            const message = statusCode === 500 ? 'Error interno, reintente más tarde' : error.message;
            
            return reply.status(statusCode).send({ error: message });
        }
    }
}