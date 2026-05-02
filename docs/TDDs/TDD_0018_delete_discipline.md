---
id: 0018
estado: Propuesto
autor: Thiago Daniel Perez
fecha: 2026-05-02
titulo: Eliminacion de Sancion
---

# TDD-0018: Eliminacion de Sancion

## Contexto de Negocio (PRD)

### Objetivo

Proveer la funcionalidad de eliminar definitivamente un registro de disciplina en caso de que haya sido ingresado por error, evitando manchar el historial del socio y restituyendo sus derechos de manera inmediata.

### User Persona

- Nombre: Pablo (Tribunal de Disciplina/Administrativo).
- Necesidad: Deshacer de manera rapida y segura un error grave, como haberle cargado una sancion al socio equivocado.

### Criterios de Aceptación

- El sistema debe pedir confirmacion visual antes de proceder con el borrado.
- Una vez eliminado, si el socio tenia una suspension total activa producto de esta sancion, el sistema debe restituirle automaticamente el acceso.
- El sistema debe mostrar una notificacion de exito tras el borrado.

## Diseño Técnico (RFC)

### Modelo de Datos

Se realizará el borrado físico del registro en la entidad `Discipline`. No se requiere inmutabilidad para esta entidad.

### Contrato de API (@alentapp/shared)

- Endpoint: `DELETE /api/v1/disciplines/:id`
- Request Body: Ninguno.

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Interface con método delete).
2. Caso de Uso: DeleteDiscipline (Lógica que asegura que el ID proveido exista antes de ordenar su eliminación).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD mediante Prisma Delete).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP DELETE).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                                           | Código HTTP               |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| Sanción no encontrada      | Mensaje: "El registro disciplinario no existe".                              | 404 Not Found             |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"                                | 500 Internal Server Error |
| ID malformado              | Mensaje: "Formato de ID invalido."                                           | 400 Bad Request           |

## Plan de Implementación

1. Crear el endpoint DELETE en el backend.
2. Implementar el caso de uso y el método correspondiente en el repositorio de Prisma.
3. En el frontend, agregar un botón de eliminación en la tabla/lista de sanciones.
4. Implementar un modal o dialogo de confirmación en React para evitar borrados accidentales.