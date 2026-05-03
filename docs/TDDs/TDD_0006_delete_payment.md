---
id: 6
autor: Rearte Iara Tiziana
fecha: [2026-05-01]
titulo: [Baja lógica de Pagos de Cuotas Sociales]
---

# TDD-[0006]: [Baja lógica de Pagos de Cuotas Sociales]

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un tesorero realice la baja lógica de una cuota social de un socio, actualizando su estado a `Cancelado` sin eliminar el registro, garantizando la integridad referencial y la trazabilidad de la información financiera.

### User Persona
*   **Nombre**: Alberto (Tesorero).
*   **Necesidad**: Borrar un pago que fue cargado por error o un pago de prueba, de forma rápida desde la misma tabla principal. **Necesita una advertencia antes de borrar para no cometer equivocaciones irreparables.**

### Criterios de Aceptación
*   El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con la baja lógica.
*   El sistema debe validar que el socio exista antes de proceder con la operación.
*   Al finalizar correctamente, el sistema debe cambiar el estado del pago a `Cancelado`
*   El sistema debe conservar todos los datos originales para fines de auditoría.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Al tratarse de una baja lógica, la operación consiste en actualizar el estado del pago a `Cancelado` sin eliminar el registro.
*   **Endpoint**: `PUT /api/v1/payments/:id`
*   **Request Body**:
```ts
{
    status:"Cancelado"
}
```
*   **Response**: 200 en caso de éxito.

### Componentes de Arquitectura Hexagonal
*   **Domain**:
    *   Entidad `Payment` como núcleo del módulo financiero.
    *   Reglas de negocio:
        *   No se permite el borrado físico de pagos.
        *   La baja lógica se realiza cambiando el estado a `Cancelado`.
    *   Validaciones:
        *   El pago debe existir previamente para poder ser anulado.

*   **Application**:
    *   CU_004_1:Modificacion_Obligacion_De_Pago
        [Este caso de uso recibe una solicitud de baja lógica, valida la existencia del pago, aplica las reglas de negocio ya mencionadas y realiza la persistencia con el nuevo estado.]

*   **Infrastructure**:
    *   Adaptador de entrada: `PaymentController`(Ruta HTTP `PUT /api/v1/payments/:id`).
    *   Adaptador de salida: DB persistence adapter (Implementación real en BD).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Pago inexistente    | Mensaje: "El pago ingresado no existe"       | 404 Not Found              |
| Ya esta cancelado | Mensaje: "El pago ya se encuentra cancelado"              | 409 Conflict          |
| Baja correcta | Mensaje: "Pago cancelado correctamente"        | 200          |
| Error BD |Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error          |
## Plan de Implementación
1. Crear caso de uso Baja del pago
2. Endpoint PUT
3. Doble confirmación en el FrontEnd