import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly validator: DisciplineValidator,
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        if (!UUID_REGEX.test(id)) {
            throw new Error('Formato de ID invalido');
        }

        const existing = await this.disciplineRepo.findById(id);
        if (!existing) {
            throw new Error('El registro disciplinario no existe');
        }

        const newStart = data.start_date ?? existing.start_date;
        const newEnd = data.end_date ?? existing.end_date;
        this.validator.validateDates(newStart, newEnd);

        return this.disciplineRepo.update(id, data);
    }
}