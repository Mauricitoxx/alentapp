import { EquipmentLoanDTO, UpdateEquipmentLoanRequest } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida" para la gestión de préstamos de equipos.
export interface EquipmentLoanRepository {
  create(loan: Omit<EquipmentLoanDTO, 'id'>): Promise<EquipmentLoanDTO>;
  findById(id: string): Promise<EquipmentLoanDTO | null>;
  findAll(): Promise<EquipmentLoanDTO[]>;
  update(id: string, data: UpdateEquipmentLoanRequest): Promise<EquipmentLoanDTO>;
  delete(id: string): Promise<void>;
}
