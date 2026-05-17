import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEquipmentLoanUseCase } from '../application/NewEquipmentLoanUseCase.js';
import { GetEquipmentLoansUseCase } from '../application/GetEquipmentLoansUseCase.js';
import { UpdateEquipmentLoanUseCase } from '../application/UpdateEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest, UpdateEquipmentLoanRequest } from '@alentapp/shared';

export class EquipmentLoanController {
    constructor(
        private readonly createEquipmentLoanUseCase: CreateEquipmentLoanUseCase,
        private readonly getEquipmentLoansUseCase: GetEquipmentLoansUseCase,
        private readonly updateEquipmentLoanUseCase: UpdateEquipmentLoanUseCase,
    ) {}

    // Obtiene lista de préstamos registrados
    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const prestamos = await this.getEquipmentLoansUseCase.execute();
            return reply.status(200).send({ data: prestamos });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error al obtener los prestamos de equipo" });
        }
    }

    // Procesa el alta de un nuevo préstamo
    async create(
        request: FastifyRequest<{ Body: CreateEquipmentLoanRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const nuevoPrestamo = await this.createEquipmentLoanUseCase.execute(request.body);
            return reply.status(201).send({ data: nuevoPrestamo });
        } catch (error: any) {
            // Manejo estricto de códigos HTTP según TDD-0019
            
            if (error.status) {
                // Errores de negocio arrojados por el UseCase (ej. 403 o 404)
                return reply.status(error.status).send({ error: error.message });
            }

            if (error.message.includes('posterior a la fecha actual')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error al crear el préstamo" });
        }
    }

    // Procesa la actualización de un préstamo existente (TDD-0020)
    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateEquipmentLoanRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const prestamoActualizado = await this.updateEquipmentLoanUseCase.execute(id, request.body);
            return reply.status(200).send({ data: prestamoActualizado, message: "Prestamo actualizado correctamente" });
        } catch (error: any) {
            if (error.message === 'El prestamo no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'Estado de prestamo invalido') {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'Fecha de devolucion invalida') {
                return reply.status(409).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}
