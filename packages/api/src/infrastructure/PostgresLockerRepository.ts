import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, LockerStatus } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Inicializamos la conexión a la base de datos de Docker
const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

// Tipo local para representar la estructura exacta de la tabla en Postgres
type DBLocker = {
    id: string;
    number: number;
    location: string;
    status: LockerStatus;
    member_id: string | null;
};

export class PostgresLockerRepository implements LockerRepository {
    
 
    async create(data: Omit<LockerDTO, 'id'>): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                number: data.number,
                location: data.location,
                status: data.status,
                member_id: data.member_id, // Nace como null desde el Use Case
            },
        });

        return this.mapToDTO(locker);
    }

  
    async findByNumber(number: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { number },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    /**
     * Busca un casillero por su UUID (Esencial para el PUT del TDD-011)
     */
    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

   
    async update(id: string, data: Partial<LockerDTO>): Promise<LockerDTO> {
        const locker = await prisma.locker.update({
            where: { id },
            data: {
                ...(data.number && { number: data.number }),
                ...(data.location && { location: data.location }),
                ...(data.status && { status: data.status }),
                // Evaluamos si la propiedad existe para permitir desvincular mandando null
                ...('member_id' in data && { member_id: data.member_id }),
            },
        });

        return this.mapToDTO(locker);
    }

   
    async findAll(): Promise<LockerDTO[]> {
        // Hace el equivalente a un SELECT * FROM locker ORDER BY number ASC
        const lockers = await prisma.locker.findMany({
            orderBy: { number: 'asc' },
        });

        // Recorremos el array que devuelve Prisma y transformamos cada uno al formato DTO
        return lockers.map(locker => this.mapToDTO(locker));
    }

  
    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id,
        };
    }
}