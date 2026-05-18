// 🌟 Sumamos UpdateLockerRequest adentro de las llaves del import
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export interface LockerRepository {

  create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO>;

  findByNumber(number: number): Promise<LockerDTO | null>;
  
  findAll(): Promise<LockerDTO[]>;
  findById(id: string): Promise<LockerDTO | null>;
  update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>;
}