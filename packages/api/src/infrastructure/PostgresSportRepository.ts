import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, CreateSportRequest,UpdateSportRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}


const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

// Definimos el tipo basado en el modelo del schema.prisma
type DBSport = {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
    created_at: Date;
};

export class PostgresSportRepository implements SportRepository {
    
    async create(data: CreateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description,
                max_capacity: data.max_capacity, 
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });

        return this.mapToDTO(sport);
    }


    async findById(id: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { id },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { name },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async findAll(): Promise<SportDTO[]> {
        const sports = await prisma.sport.findMany({
            orderBy: { name: 'asc' }, // Ordenamos alfabéticamente por deporte
        });

        return sports.map(sport => this.mapToDTO(sport));
    }

    async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: {

                // sólo se actualizarán los campos provistos (ej. description y max_capacity)
                ...(data.name && { name: data.name }),
                ...(data.description && { description: data.description }),
                ...(data.max_capacity !== undefined && { max_capacity: data.max_capacity }),
                ...(data.additional_price !== undefined && { additional_price: data.additional_price }),
                ...(data.requires_medical_certificate !== undefined && { requires_medical_certificate: data.requires_medical_certificate }),
            },
        });

        return this.mapToDTO(sport);
    }

    async delete(id: string): Promise<void> {
        await prisma.sport.delete({
            where: {
                id: id,
            },
        });
    }

    //mapea el objeto de la base de datos al DTO que se usará en el resto de la aplicación
    private mapToDTO(sport: DBSport): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
            created_at: sport.created_at.toISOString(),
        };
    }
}