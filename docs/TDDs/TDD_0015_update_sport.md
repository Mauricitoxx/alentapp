---
id: 0015
autor: Juan Cruz Caceres
fecha: 2026-05-01
titulo: Actualización de Deportes Existentes
---

# TDD-0015: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos corregir o modificar información de un deporte existente en el sistema.

### User Persona
*   **Nombre**: Luciana (Administrativa)
*   **Necesidad**: Modificar los datos de un deporte seleccionado en la interfaz visual. Por ejemplo, actualizar la descripción o su cupo.

### Criterios de Aceptación
* El sistema debe permitir actualizar solo descripción y cupo
* El sistema debe validar que si se modifica la capacidad máxima esta sea mayor a 0.
* El sistema debe validar que si se modifica la capacidad máxima esta supere al número de socios inscriptos
* Si se baja la capacidad máxima a un deporte que ya tiene muchos inscriptos, el sistema debe dar error
* El sistema debe ocultar la edición del nombre despues de su creación
* Si la edición es correcta, debe retornar los nuevos datos del deporte actualizados

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Se utilizará el paquete compartido para definir el cuerpo de la petición. Como la regla de negocio solo permite editar la descripción y el cupo, el atributo name no forma parte de este contrato para evitar modificaciones accidentales.

*   **Endpoint**: `PATCH /api/v1/sports/:id`
*   **Request Body**:
```ts
{
    description?: string;
    max_capacity?: number;
}
```

### Componentes de Arquitectura Hexagonal
1. **Puerto**: `SportRepository` (Método `update (id, data)`).
2. **Servicio de Dominio**: `SportValidator` (Encargado de validar que la capacidad máxima sea mayor a 0 y supero el numero de socios inscriptos).
3. **Caso de Uso**: `UpdateSportUseCase` (Orquesta la validación  para que el cupo maximo sea mayor al nùmero de socios inscriptos y llama al repositorio).
4. **Adaptador de Salida**: `PostgresSportRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id`  de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Deporte inexistente     | Mensaje: "El deporte no existe"       | 404   Not Found              |
| Capacidad máxima menor a 0 | Mensaje: "La capacidad máxima debe ser mayor a 0"              | 400 Bad Request           |
| Capacidad máxima menor a número de socios inscriptos | Mensaje: "La capacidad máxima debe ser mayor al número de socios inscriptos"              | 400 Bad Request           |
| Error con la conexión a DB    | Mensaje: "Error interno, reintente más tarde" |   500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `alentapp/shared` (`UpdateSportRequest`).
2. Ampliar el `SportRepository` con el método `update`.
3. Implementar la lógica en `UpdateSportUseCase` utilizando el `SportValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.
