---
id: 012
estado: Propuesto
autor: Oriana Acosta
fecha: 2026-05-02
titulo: Eliminación de Lockers Existentes
---

# TDD-012: Eliminación de Lockers Existentes

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos dar de baja casilleros del sistema, ya sea por retiro físico de las instalaciones, daño permanente o error en la carga inicial, manteniendo el inventario de infraestructura actualizado.

### User Persona
- **Nombre**: Alberto (Administrativo / Tesorero).
- **Necesidad**: Eliminar un registro de locker de forma definitiva cuando este ya no está operativo. Requiere una validación de seguridad para no borrar accidentalmente un casillero que está siendo usado por un socio.

### Criterios de Aceptación
- El sistema debe solicitar una confirmación visual antes de realizar la eliminación.
- El sistema debe validar que el locker no tenga un socio asignado (`member_id` debe ser null) antes de permitir el borrado.
- El sistema debe realizar un borrado físico de la base de datos (hard delete).
- Si la eliminación es exitosa, la interfaz debe reflejar el cambio inmediatamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Operación destructiva que identifica el recurso mediante el ID en la URL. No requiere cuerpo en la petición.

- **Endpoint**: `DELETE /api/v1/lockers/:id`
- **Request Body**: `None`
- **Response**: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal
1. **Puerto**: `LockerRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteLockerUseCase` (Verifica existencia y comprueba que el estado no sea 'Occupied' antes de borrar).
3. **Adaptador de Salida**: `PrismaLockerRepository` (Ejecución del comando `delete` en PostgreSQL).
4. **Adaptador de Entrada**: `LockerController` (Ruta HTTP que gestiona la petición y devuelve el estado 204).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| :--- | :--- | :--- |
| **Locker con socio asignado** | Mensaje: "No se puede eliminar un casillero que está ocupado por un socio" | 400 Bad Request |
| Locker inexistente | Mensaje: "El casillero no existe" | 404 Not Found |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Error |
| Eliminación exitosa | Respuesta vacía | 204 No Content |

## Plan de Implementación
1. Ampliar el `LockerRepository` y su implementación en infraestructura con el método `delete`.
2. Implementar la lógica de validación en `DeleteLockerUseCase` para asegurar que el casillero esté libre.
3. Registrar el endpoint `DELETE` en el controlador de Lockers.
4. Añadir la función de borrado en el servicio del Frontend.
5. Implementar el botón de eliminación con un modal de confirmación en la vista de administración de casilleros.