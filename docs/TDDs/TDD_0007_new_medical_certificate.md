---
id: 0007
estado: Propuesto
autor: Grupo
fecha: 2026-05-02
titulo: Registro de Certificado Medico
---

# TDD-0007: Registro de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Digitalizar el respaldo legal de aptitud física de los socios, funcionando como una "llave" de seguridad que habilite al socio a realizar actividades deportivas y permitiendo el control automático de vencimientos.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Cargar rápidamente el certificado que trae el socio en mano, asegurándose de que la fecha de vencimiento sea correcta para evitar responsabilidades legales al club.

### Criterios de Aceptación

- El sistema debe validar que el socio (`member_id`) exista en la base de datos.
- El sistema debe validar que la fecha de vencimiento sea estrictamente posterior a la fecha de emisión.
- El certificado debe quedar vinculado al historial del socio de forma única.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `MedicalCertificate` con las siguientes propiedades:

- `id`: Identificador único universal (UUID).
- `doctor_name`: Cadena de texto (Nombre del profesional que firma).
- `issue_date`: Fecha de emisión del certificado.
- `expiry_date`: Fecha de vencimiento (generalmente 1 año después).
- `member_id`: Identificador único del socio (FK).

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/medical-certificates`
- Request Body (CreateMedicalCertificateRequest):

```ts
{
    doctor_name: string;
    issue_date: string;  // ISO 8601
    expiry_date: string; // ISO 8601
    member_id: string;   // UUID
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: `MedicalCertificateRepository` (Interface en el Dominio).
2. Caso de Uso: `CreateMedicalCertificate` (Lógica que verifica la consistencia de fechas y la existencia del miembro).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD mediante Prisma).
4. Adaptador de Entrada: `MedicalCertificateController` (Ruta HTTP POST).

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                            | Código HTTP               |
| --------------------------  | --------------------------------------------- | ------------------------- |
| Fecha vencimiento <= emisión| Mensaje: "La fecha de vencimiento es inválida"| 400 Bad Request           |
| Socio inexistente           | Mensaje: "El socio especificado no existe"    | 404 Not Found             |
| Campos obligatorios nulos   | Mensaje: "Faltan datos obligatorios"          | 400 Bad Request           |
| Error de conexión a DB      | Mensaje: "Error interno de infraestructura"   | 500 Internal Server Error |

## Plan de Implementación

1. Crear esquema de `MedicalCertificate` en Prisma y ejecutar migración.
2. Definir tipos DTO en `@alentapp/shared`.
3. Implementar lógica de validación de fechas en el caso de uso.
4. Crear el formulario de carga en el frontend en React.