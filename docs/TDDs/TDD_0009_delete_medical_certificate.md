---
id: 0009
estado: Propuesto
autor: Grupo
fecha: 2026-05-02
titulo: Eliminacion de Certificado Medico
---

# TDD-0009: Eliminacion de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Remover registros de certificados cargados por error o que hayan sido invalidados por la institución, asegurando que el historial del socio quede limpio y consistente.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Eliminar un certificado que se le cargó por equivocación al socio incorrecto para mantener la integridad legal de la base de datos del club.

### Criterios de Aceptación

- El sistema debe pedir confirmación visual antes de realizar el borrado.
- Una vez eliminado el registro, el sistema debe notificar el éxito de la operación.
- El socio no debe tener asociado este certificado tras la eliminación.

## Diseño Técnico (RFC)

### Modelo de Datos

Borrado físico del registro en la entidad `MedicalCertificate`. No se requiere inmutabilidad para esta tabla.

### Contrato de API (@alentapp/shared)

- Endpoint: `DELETE /api/v1/medical-certificates/:id`
- Request Body: Ninguno.

### Componentes de Arquitectura Hexagonal

1. Puerto: `MedicalCertificateRepository` (Interface con método delete).
2. Caso de Uso: `DeleteMedicalCertificate` (Verifica que el ID exista antes de borrar).
3. Adaptador de Salida: DB persistence adapter (Prisma delete).
4. Adaptador de Entrada: `MedicalCertificateController` (Ruta HTTP DELETE).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| ID inexistente             | Mensaje: "El registro no existe"              | 404 Not Found             |
| Error de base de datos     | Mensaje: "No se pudo eliminar el registro"    | 500 Internal Server Error |

## Plan de Implementación

1. Crear el endpoint DELETE en el backend.
2. Implementar el método de borrado en el repositorio de Prisma.
3. Desarrollar el caso de uso para gestionar la eliminación.
4. Agregar botón de borrado con un modal de confirmación en la interfaz web.