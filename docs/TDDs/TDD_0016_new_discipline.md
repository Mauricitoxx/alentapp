---
id: 0016
estado: Propuesto
autor: Thiago Daniel Perez
fecha: 2026-05-02
titulo: Alta de Sancion
---

# TDD-0016: Alta de Sancion

## Contexto de Negocio (PRD)

### Objetivo

Permitir al Tribunal de Disciplina registrar nuevas supensiones o faltas de conducta de los socios, logrando bloquear su acceso a las instalaciones o actividades del club mientras la sanción esté activa

### User Persona

- Nombre: Pablo (Tribunal de Disciplina/Administrativo).
- Necesidad: Cargar una sancion a un socio, asegurandose de que el sistema aplique las restricciones de acceso automaticamente durante el periodo indicado

### Criterios de Aceptación

- El sistema debe validar que el socio al que se le aplica la sancion exista.
- El sistema debe validar que la fecha fin sea posterios a la fecha inicio.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- Si el campo 'is_total_suspencion' es verdadero, el socio debe quedar restrigido en el sistema durante el periodo de la sancion.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Discipline` con las siguientes propiedades y restricciones:

- 'id': Identificador único universal (UUID).
- 'reason': Cadena de texto.
- 'start_date': Fecha y hora de inicio.
- 'end_date': Fecha y hora de fin.
- 'is_total_suspension': Booleano.
- 'member_id': Identificador único (UUID), clave foránea a Member.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/disciplines` (Corregido según la implementación actual)
- Request Body (CreateDisciplineRequest):

```ts
{
    reason: string;
    start_date: string; // ISO 8601 datetime
    end_date: string; // ISO 8601 datetime
    is_total_suspension: boolean;
    member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: CreateDiscipline (Lógica que verifica la existencia del socio y que la fecha de fin sea posterior a la de inicio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP).


## Casos de Borde y Errores


| Escenario                  | Resultado Esperado                                                           | Código HTTP               |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| Fechas incongruentes       | Mensaje: "La fecha de fin debe ser estrictamente posterior a la de inicio"   | 409 Bad Request           |
| Socio inexistente          | Mensaje: "El socio especificado no existe".                                  | 400 Not Found.            |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"                                | 500 Internal Server Error |
| Campos obligatorios nulos  | Mensaje: "Faltan campos requeridos".                                         | 400 Bad Request           |


## Plan de Implementación

1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso CreateDiscipline. 
4. Crear formulario en React y conectar con el endpoint del backend.
