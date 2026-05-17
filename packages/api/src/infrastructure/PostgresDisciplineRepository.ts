import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBDiscipline = {
    id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    member_id: string;
    created_at: Date;
};

export class PostgresDisciplineRepository implements DisciplineRepository {
    async create(data: Omit<DisciplineDTO, 'id'>): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.create({
            data: {
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
                member_id: data.member_id,
            },
        });
        return this.mapToDTO(discipline);
    }

    async findById(id: string): Promise<DisciplineDTO | null> {
        const discipline = await prisma.discipline.findUnique({ where: { id } });
        return discipline ? this.mapToDTO(discipline) : null;
    }

    async findAll(): Promise<DisciplineDTO[]> {
        const list = await prisma.discipline.findMany({
            orderBy: { created_at: 'desc' },
        });
        return list.map(this.mapToDTO);
    }

    async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
    const discipline = await prisma.discipline.update({
        where: { id },
        data: {
            ...(data.reason !== undefined && { reason: data.reason }),
            ...(data.start_date !== undefined && { start_date: new Date(data.start_date) }),
            ...(data.end_date !== undefined && { end_date: new Date(data.end_date) }),
            ...(data.is_total_suspension !== undefined && {
                is_total_suspension: data.is_total_suspension,
            }),
        },
    });
    return this.mapToDTO(discipline);
    }
    
    private mapToDTO(d: DBDiscipline): DisciplineDTO {
        return {
            id: d.id,
            reason: d.reason,
            start_date: d.start_date.toISOString(),
            end_date: d.end_date.toISOString(),
            is_total_suspension: d.is_total_suspension,
            member_id: d.member_id,
            created_at: d.created_at.toISOString(),
        };
    }
}