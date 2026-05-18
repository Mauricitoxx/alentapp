import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSportRequest,UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
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

    //METODO ALTA
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

    //METODO UPDATE
    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            
            const deporteActualizado = await this.updateSportUseCase.execute(id, request.body);
            
            return reply.status(200).send({ data: deporteActualizado });
        } catch (error: any) {
            // Manejo de error si el deporte no existe (Error 404)
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            
            // Manejo de errores de validación de negocio (ej: capacidad inválida) (Error 400)
            if (error.message.includes('capacidad') || error.message.includes('inválido')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno al actualizar el deporte" });
        }
    }

    //METODO DELETE
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            
            
            await this.deleteSportUseCase.execute(id);
            
            
            return reply.status(204).send();
        } catch (error: any) {
            // Manejo de error si el deporte no existe (Error 404)
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }

            // Error genérico del servidor
            return reply.status(500).send({ error: "Error interno al intentar eliminar el deporte" });
        }
    }
}