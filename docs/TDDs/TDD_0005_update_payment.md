---
id: 5
autor: Rearte Iara Tiziana
fecha: [2026-05-01]
titulo: [Actualización de Pagos de Cuotas Sociales]
---

# TDD-[0005]: [Actualización de Pagos de Cuotas Sociales]

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un tesorero modifique una cuota social de un socio, de manera que se actualice el estado de la misma respetando la inmutabilidad financiera.

### User Persona
*   **Nombre**: Alberto (Tesorero)
*   **Necesidad**: Modificar los datos de las coutas sociales rápidamente desde la tabla del panel de tesorería.

### Criterios de Aceptación
*   El sistema debe permitir actualizar únicamente los campos `estado` y `fechaPago`.
*   El sistema debe validar que, si el estado cambia a `Pagado`, se registre la `fechaPago`.
*   Si la edición es correcta, el sistema debe retornar los nuevos datos del pago actualizados.
*   Un pago en estado `Pendiente` puede pasar a `Pagado`.
*   Un pago en estado `Pendiente` puede pasar a `Vencido`.
*   Un pago en estado `Pagado` no puede pasar a `Vencido`.
*   Un pago en estado `Vencido` puede pasar a `Pagado`.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial (PATCH a nivel de negocio, aunque el endpoint implemente PUT).
*   **Endpoint**: `PUT /api/v1/payments/:id`
*   **Request Body**:
```ts
{
    status: 'Pagado' | 'Vencido'; //Pagado
    payment_date: string; // ISO Date String (YYYY-MM-DD); //2026-11-12 
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**:
    * Entidad `Payment` como núcleo del módulo financiero.
    * Reglas de negocio:
        * Solo se permite modificar los campos `estado` y `fechaPago`.
        * Un pago en estado `Pendiente` puede pasar a `Pagado`.
        * Un pago en estado `Pendiente` puede pasar a `Vencido`.
        * Un pago en estado `Pagado` no puede pasar a `Vencido`.
        * Un pago en estado `Vencido` puede pasar a `Pagado`.
    * Validaciones:
        * Si el estado cambia a `Pagado`, `fechaPago` debe registrarse obligatoriamente.
        * El pago debe existir previamente para poder ser actualizado.

*   **Application**:
    * CU_004_1:Modificacion_Obligacion_De_Pago 
        [Este caso de uso recibe una solicitud de actualización, valida  que solo se modifiquen los campos `estado` y `fechaPago`, controla las transiciones válidas entre estados (`Pendiente`, `Pagado`, `Vencido`) y retorna el registro actualizado.]
    * Puerto: `PaymentRepository`. (Interface en el Dominio).

*   **Infrastructure**:  
    * Adaptador de entrada: `PaymentController`(Ruta HTTP `PUT /api/v1/payments/:id`).
    * Adaptador de salida: DB persistence adapter (Implementación real en BD).


## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Intentar modificar campos no permitidos | Mensaje: "Solo se permite actualizar el estado y fechaPago"              | 400 Bad Request           |
| Cambio de estado a `Pagado` | Registrar `fechaPago` y devolver pago actualizado con nuevo estado             |   200         |
| Cambio de estado a `Vencido` | Devolver pago actualizado con nuevo estado              | 200           |
| Cambio inválido de `Pagado` a `Vencido` | Mensaje: "Transición de estado no permitida"            | 400 Bad Request           |
| Pago Inexistente    | Mensaje: "El pago ingresado no existe"       | 404 Not Found              |
| Error Base de Datos | Mensaje: "Error interno, reintente más tarde"              | 500 Internal Server Error           |

## Plan de Implementación
1. Crear método updateStatus.
2. Validar transiciones de estado.
3. Crear endpoint PUT.
4. Agregar acción frontend.