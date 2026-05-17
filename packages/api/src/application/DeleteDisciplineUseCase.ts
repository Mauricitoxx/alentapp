import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DeleteDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly memberRepo: MemberRepository,
    ) {}

    async execute(id: string): Promise<void> {
        if (!UUID_REGEX.test(id)) {
            throw new Error('Formato de ID invalido');
        }

        const existing = await this.disciplineRepo.findById(id);
        if (!existing) {
            throw new Error('El registro disciplinario no existe');
        }

        const now = new Date();
        const wasActiveTotalSuspension =
            existing.is_total_suspension &&
            new Date(existing.start_date) <= now &&
            now <= new Date(existing.end_date);

        await this.disciplineRepo.delete(id);

        if (wasActiveTotalSuspension) {
            await this.memberRepo.update(existing.member_id, { status: 'Activo' });
        }
    }
}