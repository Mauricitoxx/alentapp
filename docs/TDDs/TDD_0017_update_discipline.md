---
id: 0017
estado: Propuesto
autor: Thiago Daniel Perez
fecha: 2026-05-02
titulo: Modificacion de Sancion
---

# TDD-0017: Modificacion de Sancion

## Contexto de Negocio (PRD)

### Objetivo

Permitir al Tribunal de Disciplina corregir o actualizar un registro disciplinario existente, ya sea para enmendar un error de tipeo en el motivo, reducir una pena por buen comportamiento, o extender la sanción.

### User Persona

- Nombre: Pablo (Tribunal de Disciplina/Administrativo).
- Necesidad: Poder ajustar las fechas de vigencia de una sanción o corregir detalles del castigo sin tener que eliminar el registro y volver a cargarlo desde cero.

### Criterios de Aceptación

- El sistema debe permitir modificar el motivo, las fechas y la totalidad de la suspensión.
- Al modificar las fechas, se debe validar nuevamente que la fecha de fin sea estrictamente posterior a la fecha de inicio.
- Al finalizar, el sistema debe mostrar un mensaje confirmando los cambios.

## Diseño Técnico (RFC)

### Modelo de Datos

Se actualizará un registro existente de la entidad `Discipline`.


### Contrato de API (@alentapp/shared)

- Endpoint: `PUT /api/v1/disciplines/:id`
- Request Body (UpdateDisciplineRequest):

```ts
{
    reason?: string;
    start_date?: string; // ISO 8601 datetime
    end_date?: string; // ISO 8601 datetime
    is_total_suspension?: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Interface con método update).
2. Caso de Uso: UpdateDiscipline (Lógica que busca el registro, valida cruzando datos nuevos con los existentes, y verifica coherencia de fechas).
3. Adaptador de Salida: DB persistence adapter.
4. Adaptador de Entrada: DisciplineController (Ruta HTTP PUT).


## Casos de Borde y Errores


| Escenario                  | Resultado Esperado                                                           | Código HTTP               |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| Sanción no encontrada      | Mensaje: "El registro disciplinario no existe"                               | 404 Not Found             |
| Fechas incongruentes       | Mensaje: "La fecha de fin debe ser estrictamente posterior a la de inicio"   | 400 Bad Request           |
| ID malformado.             | Mensaje: "Formato de ID invalido."                                           | 400 Bad Request           |


## Plan de Implementación

1. Definir los tipos parciales (DTO) en shared.
2. Implementar el método de actualización en el repositorio.
3. Desarrollar el caso de uso UpdateDiscipline con la re-validación de fechas.
4. Conectar la vista de detalle en React para permitir la edición.