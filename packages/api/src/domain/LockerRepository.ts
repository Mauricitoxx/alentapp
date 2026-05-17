import { LockerDTO } from '@alentapp/shared';

export interface LockerRepository {
  /**
   * Guarda un nuevo casillero en el sistema.
   * Usamos Omit sobre el LockerDTO para no exigir el ID en el Alta,
   * tal cual lo hace el profesor con los miembros.
   */
  create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO>;

  /**
   * Busca un casillero por su número único.
   * Devuelve el LockerDTO completo si ya existe, o null si está disponible.
   */
  findByNumber(number: number): Promise<LockerDTO | null>;
}