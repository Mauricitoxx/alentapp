---
id: 0019
estado: Propuesto
autor: Mauro Lista
fecha: 2026-05-02
titulo: Alta de prestamo de equipos
---

# TDD-0019: Alta de prestamo de equipos

## Contexto de Negocio (PRD)

### Objetivo
Dar de alta un préstamo de equipos a los socios del club, asegurando el control de stock y la trazabilidad de los materiales.

### User Persona
*   **Nombre**: Luciana (Administrativa)
*   **Necesidad**: Registrar qué ítem se presta y a quién, estableciendo una fecha límite para su devolución para evitar pérdidas de stock.

### Criterios de Aceptación
*   El sistema debe validar que el socio (MEMBER) exista y esté en estado Active.
*   El atributo status del préstamo debe ser Loaned por defecto.
*   El atributo due_date (fecha de devolución prevista) debe ser obligatorio y posterior a la loan_date.
*   El sistema debe permitir préstamos únicamente a socios con categoría "Senior" o "Lifetime".


## Diseño Técnico (RFC)

### Modelo de Datos
Se definirá la entidad EquipmentLoan con las siguientes propiedades y restricciones:

* `id`: Identificador único universal (UUID).
* `item_name`: Cadena de texto (String) con el nombre del equipo.
* `status`: Enumeración con valor por defecto en Loaned (Loaned, Returned, Damaged).
* `loan_date`: Fecha y hora de creación del registro (DateTime).
* `due_date`: Fecha límite para la devolución del equipo (DateTime).
* `member_id`: Identificador del socio asociado (UUID), el cual es una Clave foránea obligatoria.

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `POST /api/v1/equipment-loan`
*   **Request Body**:
```ts
{
    item_name: string;
    due_date: String;
    member_id: string; // UUID / FK
}
```

### Componentes de Arquitectura Hexagonal
[Cómo se distribuye la lógica en las capas.]
*   **Domain**: Entidad EquipmentLoan y Puerto EquipmentLoanRepository (Interfaz en el Dominio que define el método save).
*   **Application**: Caso de Uso CreateEquipmentLoan (Lógica que verifica la categoría del socio y la validez de las fechas antes de persistir).
*   **Adaptador de Entrada**: EquipmentLoanController (Ruta HTTP que recibe la petición) 
*   **Adaptador de Salida**: PrismaEquipmentLoanRepository (Implementación de persistencia usando Prisma)

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Socio categoría "Cadet"     | Mensaje: "Los socios Cadet tienen prohibido solicitar material"     | 403 Forbidden |
| Socio Inexistente           | Mensaje: "El socio no existe"               | 404 Not Found |
| Fecha de devolución inválida | Mensaje: "La fecha de devolución debe ser posterior a la fecha actual" | 400 Bad Request |
| Alta Exitosa                 | Mensaje: "Préstamo creado exitosamente"      | 201 Created |
| Error Base de Datos           | Mensaje: "Error al crear el préstamo"       | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia en schema.prisma y ejecutar la migración correspondiente.
2. Definir en @alentapp/shared los contratos de entrada y salida para el préstamo (CreateEquipmentLoanRequest).
3. Implementar el Caso de Uso CreateEquipmentLoan incluyendo las validaciones de categoría exigidas
4. Crear el Controlador EquipmentLoanController para manejar las peticiones HTTP.