---
id: 0020
estado: Propuesto
autor: Mauro Lista
fecha: 2026-05-02
titulo: Actualización de Equipamientos prestados
---

# TDD-0002: Actualización de Socios Existentes

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos modificar el estado de un préstamo existente o registrar su finalización en el sistema.

### User Persona

- Nombre: Luciana (Administrativo).
- Necesidad: Actualizar el registro cuando un socio devuelve el material para liberar la responsabilidad del socio y auditar el estado del equipo.

### Criterios de Aceptación

*   El sistema debe permitir actualizar únicamente los campos `status` y `due_date`.
*   El sistema debe validar que el préstamo exista antes de proceder con la actualización.
*   Los atributos `item_name` y `member_id` son inmutables tras la creación para asegurar la integridad de la auditoría.
*   Al finalizar correctamente, el sistema debe retornar los nuevos datos del préstamo actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se 

*   **Endpoint**: `PUT /api/v1/equipment-loans/:id`
*   **Request Body**:
```ts
{
    status?: "Loaned" | "Returned" | "Damaged";
    due_date?: string; // ISO Date String (YYYY-MM-DD)
}
```
### Componentes de Arquitectura Hexagonal

1. **Puerto**: Entidad EquipmentLoan y Puerto EquipmentLoanRepository (Interfaz en el Dominio que define el método update).
2. **Servicio de Dominio**: `EquipmentLoanValidator` (Encargado de reutilizar validaciones de status y due_date).
3. **Caso de Uso**: `UpdateEquipmentLoanUseCase` (Orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `EquipmentLoanController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                     | Resultado Esperado                                   | Código HTTP actual            |
| ----------------------------- | ---------------------------------------------------- | ----------------------------- |
| Prestamo inexistente          | Mensaje: "El prestamo no existe"                   | 404 Not Found                 |
| Estado de prestamo invalido   | Mensaje: "Estado de prestamo invalido"             | 400 Bad Request               |
| Actualización Exitosa         | Mensaje: "Prestamo actualizado correctamente"    | 200 OK                      |
| Fecha de devolucion invalida   | Mensaje: "Fecha de devolucion invalida"              | 409 Conflict                  |
| Error de conexión a DB        | Mensaje: "Error interno, reintente más tarde"      | 500 Internal Server Error     |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateEquipmentLoanRequest`).
2. Ampliar el `EquipmentLoanRepository` con el método `update`.
3. Implementar la lógica en `UpdateEquipmentLoanUseCase` utilizando el `EquipmentLoanValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend
