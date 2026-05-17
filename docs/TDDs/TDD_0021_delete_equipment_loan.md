---
id: 0021
estado: Propuesto
autor: Mauro Lista
fecha: 2026-05-02
titulo: Eliminación de prestamos de equipamientos
---

## Contexto de Negocio (PRD)

### Objetivo
Permitir la eliminación de un registro de préstamo en el sistema, ya sea por error de carga o anulación del proceso[cite: 2].

### User Persona

- Nombre: Luciana (Administrativo).
- Necesidad: Eliminar un registro de préstamo que fue ingresado por error para mantener la base de datos limpia y sin registros falsos.

### Criterios de Aceptación

*   El sistema debe validar la existencia del préstamo mediante su `id` antes de proceder con la eliminación.
*   Debe realizarse un borrado físico de la base de datos.
*   Solo se permite la eliminación si el préstamo se encuentra en estado "Loaned".
*   Al finalizar correctamente, el sistema debe confirmar la eliminación del recurso.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/socios/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Interfaz en el Dominio que define el método `delete`)
2. **Caso de Uso**: `DeleteEquipmentLoan` (Verifica la existencia vía `findById`, comprueba que el estado sea "Loaned" y delega la eliminación)
3. **Adaptador de Salida**: `PrismaEquipmentLoanRepository` (Implementación de la eliminación física usando Prisma)
4. **Adaptador de Entrada**: `EquipmentLoanController` (Ruta HTTP que extrae el `id` de la URL y mapea la respuesta)

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                                           | Código HTTP               |
| --------------------------- | ------------------------------------------------------------ | ------------------------- |
| Préstamo inexistente        | Mensaje: "El préstamo no existe"                             | 404 Not Found             |
| Préstamo ya devuelto/dañado | Mensaje: "No se puede eliminar un préstamo con historial de devolución" | 400 Bad Request           |
| Eliminación exitosa         | Respuesta vacía                                              | 204 No Content            |
| Error de conexión a DB      | Mensaje: "Error interno, reintente más tarde"                | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar la interfaz en el paquete `@alentapp/shared` (`DeleteEquipmentLoanRequest`).
2. Ampliar el `EquipmentLoanRepository` con el método `delete`.
3. Implementar la lógica en `DeleteEquipmentLoanUseCase` utilizando el `EquipmentLoanValidator` centralizado.
4. Crear la ruta `DELETE` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend
