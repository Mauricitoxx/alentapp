import { DisciplineDTO } from '@alentapp/shared';

export interface DisciplineRepository {
  create(data: Omit<DisciplineDTO, 'id'>): Promise<DisciplineDTO>;
  findById(id: string): Promise<DisciplineDTO | null>;
  findAll(): Promise<DisciplineDTO[]>;
}