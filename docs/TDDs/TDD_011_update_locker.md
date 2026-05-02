---
id: 011
estado: Propúesto
autor: Oriana Acosta
fecha: 2026-05-02
titulo: Actualización de Lockers Existentes
---

# TDD-011: Actualización de Lockers Existentes

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos modificar la información de los casilleros existentes, gestionar su disponibilidad y, fundamentalmente, controlar la asignación segura de socios a las unidades físicas del club.

### User Persona
- **Nombre**: Alberto (Administrativo / Tesorero).
- **Necesidad**: Actualizar el estado de un locker (ej. pasarlo a mantenimiento) o asignar un socio a un casillero disponible de forma rápida y sin errores de validación.

### Criterios de Aceptación
- El sistema debe permitir actualizar la ubicación, el estado y el socio asignado.
- **Regla Crítica**: El sistema **NO debe permitir** asignar un socio (`member_id`) si el estado del casillero es `Maintenance`.
- Si se modifica el `number`, el sistema debe validar que no pertenezca ya a otro locker (unicidad).
- Si la edición es correcta, debe retornar los nuevos datos del locker actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Se utilizará una actualización parcial mediante el método PUT. Todos los campos son opcionales.

- **Endpoint**: `PUT /api/v1/lockers/:id`
- **Request Body (UpdateLockerRequest)**:

```ts
{
    number?: number;
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null; // UUID del socio o null para liberar
}

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Método update(id, data)).  

2. Caso de Uso: UpdateLockerUseCase (Orquesta la validación de la regla de mantenimiento y llama al repositorio).  

3. Adaptador de Salida: PrismaLockerRepository (Actualización física en la base de datos PostgreSQL).  

4. Adaptador de Entrada: LockerController (Ruta HTTP que extrae el id y gestiona las respuestas).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                                   | Código HTTP actual       |
| -------------------------- | -------------------------------------------------------------------- | -------------------------|
| Asignación en Mantenimiento| Mensaje: "Un casillero no puede asignarse si su status esMaintenance"| 400 Bad Request          |
| Locker inexistente         | Mensaje: "El casillero no existe"                                    | 404 Not Found            |
| Número ya registrado       | Mensaje: "Ya existe un casillero con ese número"                     | 409 Conflict             |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"                        | 500 Internal Server Error|

## Plan de Implementación
1. Definir la interfaz UpdateLockerRequest en el paquete @alentapp/shared.
2. Implementar la validación de estado en el UpdateLockerUseCase (verificar que status != 'Maintenance' si hay un member_id).
3. Ampliar el controlador para manejar la ruta PUT y conectar con el servicio.
4. Actualizar la interfaz de usuario en React para permitir la edición desde la grilla de casilleros.
