---
id: 0008
estado: Propuesto
autor: Grupo
fecha: 2026-05-02
titulo: Modificacion de Certificado Medico
---

# TDD-0008: Modificacion de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Permitir la corrección de datos en certificados ya cargados, como el nombre del profesional o ajustes en las fechas en caso de errores de carga administrativa.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Poder corregir un error de tipeo en el nombre del médico o una fecha mal cargada sin tener que borrar y volver a subir todo el documento de nuevo.

### Criterios de Aceptación

- El sistema debe permitir editar el nombre del médico (`doctor_name`) y las fechas de vigencia (`issue_date`, `expiry_date`).
- Se debe re-validar que la fecha de vencimiento siga siendo posterior a la de emisión, incluso cruzando datos nuevos con los preexistentes.
- Los cambios deben verse reflejados inmediatamente.

## Diseño Técnico (RFC)

### Modelo de Datos

Se actualizará un registro existente en la entidad `MedicalCertificate`.

### Contrato de API (@alentapp/shared)

- Endpoint: `PUT /api/v1/medical-certificates/:id`
- Request Body (UpdateMedicalCertificateRequest):

```ts
{
    doctor_name?: string;
    issue_date?: string; // ISO 8601
    expiry_date?: string; // ISO 8601
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: `MedicalCertificateRepository` (Interface con método update).
2. Caso de Uso: `UpdateMedicalCertificate` (Valida existencia del ID y consistencia de fechas).
3. Adaptador de Salida: DB persistence adapter (Prisma update).
4. Adaptador de Entrada: `MedicalCertificateController` (Ruta HTTP PUT).

## Casos de Borde y Errores

| Escenario                         | Resultado Esperado                              | Código HTTP               |
| --------------------------------- | ----------------------------------------------- | ------------------------- |
| Certificado no encontrado         | Mensaje: "El certificado especificado no existe"| 404 Not Found             |
| Nueva fecha vencimiento < emisión | Mensaje: "Inconsistencia en el rango de fechas" | 400 Bad Request           |

## Plan de Implementación

1. Definir los tipos parciales en shared.
2. Implementar lógica de actualización en el caso de uso y repositorio.
3. Crear el endpoint PUT en el controlador.
4. Agregar el modo edición en la vista de certificados del socio en React.