import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly memberRepo: MemberRepository,
        private readonly validator: DisciplineValidator,
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        // 1. Verificar que el socio exista (criterio del TDD-0016)
        const member = await this.memberRepo.findById(data.member_id);
        if (!member) {
            throw new Error('El socio especificado no existe');
        }

        // 2. Validar coherencia de fechas
        this.validator.validateDates(data.start_date, data.end_date);

        // 3. Crear el registro
        const created = await this.disciplineRepo.create({
            reason: data.reason,
            start_date: data.start_date,
            end_date: data.end_date,
            is_total_suspension: data.is_total_suspension,
            member_id: data.member_id,
            created_at: new Date().toISOString(),
        });

        // 4. Si la sanción es total y está vigente hoy, suspender al socio
        const now = new Date();
        const isActiveNow =
            new Date(data.start_date) <= now && now <= new Date(data.end_date);
        if (data.is_total_suspension && isActiveNow) {
            await this.memberRepo.update(data.member_id, { status: 'Suspendido' });
        }

        return created;
    }
}