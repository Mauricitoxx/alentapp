import { FastifyRequest, FastifyReply } from 'fastify';
import { NewLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js'; // 
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly newLockerUseCase: NewLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase //
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
            
         
            const { member_id, ...lockerParaAlberto } = locker;
            
            // 3. 201 Created: El casillero se creó con éxito y cumple con tu contrato técnico
            return reply.status(201).send({ data: lockerParaAlberto });
        } catch (error: any) {
            const message = error.message;

            // 409 Conflict: El número de casillero ya está registrado en el sistema
            if (message.includes('Ya existe un casillero')) {
                return reply.status(409).send({ error: message });
            }

            // 400 Bad Request: El número ingresado es negativo o cero (Error de formato)
            if (message.includes('entero positivo')) {
                return reply.status(400).send({ error: message });
            }

            // 400 Bad Request: Datos faltantes (Falta la ubicación física)
            if (message.includes('obligatoria')) {
                return reply.status(400).send({ error: message });
            }

            // 500 Internal Server Error: Errores de infraestructura (Postgres o Docker caídos)
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    
    async getAll(
        _request: FastifyRequest,
        reply: FastifyReply,
    ) {
        try {
        
            const lockers = await this.getLockersUseCase.execute();
            
            const lockersParaAlberto = lockers.map(locker => {
                const { member_id, ...resto } = locker;
                return resto;
            });
            
           
            return reply.status(200).send({ data: lockersParaAlberto });
        } catch (error: any) {
            
            console.error("Error real capturado:", error);
            
            return reply.status(500).send({ 
                error: error.message || "Error interno al obtener los casilleros",
                details: error.toString()
            });
        }
    }
}