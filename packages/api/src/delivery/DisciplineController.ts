import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const sanctions = await this.getDisciplinesUseCase.execute();
            return reply.status(200).send({ data: sanctions });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const body: CreateDisciplineRequest = request.body;

            if (
                !body?.reason ||
                !body?.start_date ||
                !body?.end_date ||
                !body?.member_id ||
                body?.is_total_suspension === undefined
            ) {
                return reply.status(400).send({ error: 'Faltan campos requeridos' });
            }

            const sanction = await this.createDisciplineUseCase.execute(body);
            return reply.status(201).send({ data: sanction });
        } catch (error: any) {
            if (error.message.includes('socio especificado no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('fecha de fin')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
    
    async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
    reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const sanction = await this.updateDisciplineUseCase.execute(id, request.body);
            return reply.status(200).send({ data: sanction });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('ID invalido') ||
                error.message.includes('fecha de fin')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}