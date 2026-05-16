import { SportDTO } from '@alentapp/shared';


 //Esta interfaz es el "Puerto de Salida" para la entidad Sport.

export interface SportRepository {
  //Crea deporte 
  create(sport: Omit<SportDTO, 'id'>): Promise<SportDTO>;
  //Busca deporte por su id
  findById(id: string): Promise<SportDTO | null>;
  //Busca un deporte por su nombre. 
  findByName(name: string): Promise<SportDTO | null>;

  //recupera lista completa de deportes
  findAll(): Promise<SportDTO[]>;

}