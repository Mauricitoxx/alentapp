---
id: 010
estado: Propuesto
autor: Oriana Acosta
fecha: 2026-05-02
titulo: Registro de Nuevos Lockers
---

# TDD-010: Registro de Nuevos Lockers

## Contexto de Negocio (PRD)

### Objetivo
Sustituir el control manual de los casilleros del club por un sistema digital centralizado. Esto permitirá que el personal administrativo registre nuevos casilleros de forma eficiente, asegurando que no existan duplicados en la numeración y que cada unidad esté correctamente localizada.

### User Persona
- **Nombre**: Alberto (Administrativo / Tesorero).
- **Necesidad**: Cargar nuevos lockers al sistema cuando el club adquiere equipamiento, asegurando que el número asignado sea único para evitar confusiones en la asignación a socios.

### Criterios de Aceptación
- El sistema debe validar que el `number` (número de casillero) sea un valor numérico y único en la base de datos.
- El casillero debe quedar guardado con el estado "Available" por defecto.
- La ubicación (`location`) es un campo obligatorio para facilitar la identificación física.

## Diseño Técnico (RFC)

### Modelo de Datos
Se definirá la entidad `Locker` con las siguientes propiedades (basado en el DER del proyecto):

- `id`: Identificador único universal (UUID) - Primary Key.
- `number`: Valor entero, único e indexado (UK).
- `location`: Cadena de texto que describe la ubicación física.
- `status`: Enumeración (`Available`, `Occupied`, `Maintenance`) con valor por defecto `Available`.
- `member_id`: Identificador del socio asignado.

### Contrato de API (@alentapp/shared)
- **Endpoint**: `POST /api/v1/lockers`
- **Request Body (CreateLockerRequest)**:

```ts
{
    number: number;
    location: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Interfaz en el Dominio que define el método save)
2. Caso de Uso: CreateLocker (Lógica que verifica la disponibilidad del número antes de persistir)

3. Adaptador de Salida: PrismaLockerRepository (Implementación de persistencia usando Prisma).

4. Adaptador de Entrada: LockerController (Ruta HTTP que recibe la petición).

## Casos de Borde y Errores

| Escenario                | Resultado Esperado | CódigoHTTP               |
---------------------------|-------------------|-------------------------- |
| Número de casillero ya registrado | Mensaje: "Ya existe un casillero con el número proporcionado" | 409 Conflict              |
| Falta el campo 'location' | Mensaje: Mensaje: "La ubicación del casillero es obligatoria"| 400 Bad Request           |
| El número es negativo o cero     | Mensaje: "El número de casillero debe ser un entero positivo" | 400 Bad Request |
|Error de conexión a DB  | Mensaje: "Error interno, reintente más tarde" | 500 Internal Error              |

## Plan de Implementación

1. Agregar el model Locker al archivo schema.prisma y ejecutar la migración con Docker

2. Definir los tipos de datos en el paquete shared.

3. Implementar el puerto y el caso de uso en el núcleo de la aplicación.

4. Crear el controlador y habilitar la ruta en la API.

5. Desarrollar la interfaz de carga en el Frontend (React).
