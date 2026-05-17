---
id: 0014
autor: Juan Cruz Caceres
fecha: 2026-05-01
titulo: Eliminación de Deporte
---

# TDD-0014: Eliminación de Deporte

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos dar de baja un deporte en el sistema.

### User Persona
*   **Nombre**: Luciana (Administrativa)
*   **Necesidad**: Dar de baja un deporte

### Criterios de Aceptación
* El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado.
* El sistema debe validar que el deporte exista antes de intentar borrarlo.
* El sistema debe realizar un borrado físico de la base de datos.
* Si el borrado es exitoso, la tabla debe actualizrse automáticamente.

## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)
Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

*   **Endpoint**: `DELETE /api/v1/sports/:id`
*   **Request Body**: `None`
*   **Response**: `204 No Content` en caso de éxito.


### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteSportUseCase` (Comprueba existencia previa vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresSportRepository` (Eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Deporte inexistente     | Mensaje: "El deporte no existe"       | 404 Not Found              |
| Error de conexión a DB| Mensaje: "Error del motor de base de datos"              | 500 Internal Server Error           |
| Eliminación exitosa   | Respuesta vacía   | 204 No Content    |

## Plan de Implementación
1. Ampliar el  `SportRepository` y `PostgresSportRepository` con el método `delete`.
2. Crear la lógica de negocio en  `DeleteSportUseCase`.
3. Crear el endpoint `DELETE /api/v1/sports/:id` en el `SportController` y registrarlo en `app.ts`
4. Añadir el método `delete` al servicio Frontend (`sports.ts`).
5. Enlazar el botón de eliminación en `SportView.tsx` agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada.
