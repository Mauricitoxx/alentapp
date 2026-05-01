---
id: 0013
autor: Juan Cruz Caceres
fecha: 2026-05-01
titulo: Registro de Nuevos Deportes
---

# TDD-0013: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un administrativo pueda dar de alta un deporte digitalmente, asegurando la integridad de los datos.

### User Persona
*   **Nombre**: Luciana (Administrativa)
*   **Necesidad**: Cargar los datos de un deporte. No se permite cargar una capacidad máxima de deporte menor a cero. Luego de la creación el nombre es inmutable

### Criterios de Aceptación
- El sistema debe validar que la capacidad máxima sea mayor a cero.
- El sistema debe validar que el nombre del deporte sea único.
- Si se intenta bajar el cupo de un deporte que ya tiene muchos inscriptos, el sistema debe dar error.

## Diseño Técnico (RFC)

### Modelo de Datos
se definirá la entidad `Sport` con las siguientes propiedades y restricciones 
- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único es indexado.
- `description`: Cadena de texto.
- `max_capacity`: Numero entero, que debe ser mayor a 0
- `additional_price`: Numero decimal, que debe ser mayor a 0
- `requires_medical_certificate`: booleano

### Contrato de API (@alentapp/shared)
Definiremos los tipos en el paquete compartido para asegurar sincronización:

-   Endpoint: `POST /api/v1/sports`
-   Request Body (CreateSportRequest):

```ts
{

    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal
1. Puerto: SportRepository (Interface en el Dominio)
2. Caso de Uso: CreateSport (Lógica que verifica que la capacidad máxima sea mayor a 0)
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD)
4. Adaptador de Entrada: SportController (Ruta HTTP)

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Nombre de deporte ya registrado     | mensaje: "Ya existe un deporte con ese nombre"       | 409 Conflict              |
| Capacidad máxima menor a 0| mensaje; "La capacidad máxima debe ser mayor a 0"              | 422 Unprecessable Entity           |
| Error de conexión a DB| Mensaje: "Error interno, rintente más tarde"              | 500 Internal Server Error           |
| Bajar cupo de deporte con muchas inscripciones| Mensaje: "No se puede reducir el cupo a 20 porque ya hay 30 inscriptos"              | 422 Unprecessable Entity           |

## Plan de Implementación
1. Definir esquema de persistencia y correr migración
2. Crear DTOs en Shared
3. Definir Interfaz de Dominio
4. Implementar el repositorio y el caso de uso
5. Crear Formulario en React
6. Integrar Servicio de API
7. Gestion de Inumatabilidad de name (asegurar que la vista de edicion de name luego del alta este desabilitado)