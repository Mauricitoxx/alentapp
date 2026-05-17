import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { CreateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
    ) {}

    //obtiene lista de deportes registrados
    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const deportes = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: deportes });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error al obtener los deportes" });
        }
    }

    //procesa el alta de un nuevo deporte, validando que el nombre sea único y que la capacidad máxima sea mayor a 0
    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
          
            const nuevoDeporte = await this.createSportUseCase.execute(request.body);
            
            return reply.status(201).send({ data: nuevoDeporte });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                return reply.status(409).send({ error: error.message });
            }

          
            if (error.message.includes('capacidad') || error.message.includes('inválido')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno al crear el deporte" });
        }
    }
}