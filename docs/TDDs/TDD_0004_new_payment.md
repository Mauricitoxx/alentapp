---
id: 4
autor: Rearte Iara Tiziana
fecha: [2026-05-01]
titulo: [Alta de Obligaciones de Pago]
---

# TDD-[0004]: [Alta de Obligaciones de Pago]

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un tesorero genere una nueva couta social pendiente para un socio, de manera que no se vea comprometida la integridad referencial y evitando registros duplicados.


### User Persona
*   **Nombre**: Alberto (Tesorero)
*   **Necesidad**: Crear rápidamente cuotas mensuales para los socios y tener control sobre quién debe pagar cada período.
 
### Criterios de Aceptación
*   El sistema debe validar que el socio exista antes de registrar el pago.
*   El sistema debe validar que el monto ingresado sea mayor a cero.
*   El atributo `payment_date` debe ser null al persistir estos datos.
*   No puede existir más de un pago para el mismo socio correspondiente al mismo mes y año. Incluso ante solicitudes concurrentes o reintentos del proceso.
*   El estado por defecto de un pago debe ser `Pendiente`.
*   Al finalizar correctamente, el sistema debe devolver el pago creado.

## Diseño Técnico (RFC)

### Modelo de Datos
Se definirá la entidad Payment con las siguientes propiedades y restricciones:
*   `id`: Identificador único universal (UUID).
*   `amount`: Número decimal mayor a cero.
*   `month`: Número entero correspondiente al mes de la cuota (1-12).
*   `year`: Numero entero correspondiente al año de la cuota.
*   `status`: Enumeración con valor por defecto en `Pendiente`.
*   `due_date`: Fecha límite del pago.
*   `member_id`: Identificador del socio asociado (UUID), el cual es una Clave foránea obligatoria.

### Contrato de API (@alentapp/shared)
Definiremos los tipos en el paquete compartido para asegurar sincronización:
*   **Endpoint**: `POST /api/v1/payments`
*   **Request Body**:
```ts
{
    amount: float; //45.000
    month: int; //10
    year: int; //2026
    status: 'Pendiente' | 'Pagado' | 'Vencido'; //por default Pendiente
    due_date: date; //2026-11-12
    payment_date: date; //null
    member_id: int; //4
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**:
    * Entidad `Payment` como núcleo del módulo financiero.
    * Reglas de negocio: Un socio no puede tener pagos duplicados en un mes y año.
    *  Valor por defecto del estado `Pendiente`.
    * `fechaPago` debe inicializarse en `null`.
    * Validación de monto mayor a cero
*   **Application**:
    * CU_004_1:Alta_Obligacion_De_Pago 
        [Este caso de uso recibe una solicitud, valida los datos de entrada verifica que exista el socio ingresado, comprueba que no exista un pago en el mismo periodo de ese socio y genera a la persistencia de la nueva obligación de pago]
    * Puerto: `PaymentRepository` (Interface en el Dominio).
*   **Infrastructure**:
    * Adaptador de entrada: `PaymentController` (Ruta HTTP `POST /api/v1/payments` ).
    * Adaptador de salida: DB persistence adapter (Implementación real en BD).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Pago duplicado en un mismo periodo    | Mensaje: "Ya existe un pago para ese socio en el período indicado"       | 409 Conflict              |
| Monto menor o igual a cero | Mensaje: "El monto ingresado debe ser mayor a cero"              | 400 Bad Request           |
| Alta Exitosa | Devolver pago creado con estado "Pendiente"             |   201 Created         |
| Socio Inexistente    | Mensaje: "El socio ingresado no existe"       | 404 Not Found              |
| Error Base de Datos | Mensaje: "Error interno, reintente más tarde"              | 500 Internal Server Error           |

## Plan de Implementación
1. Definir esquema de persistencia y correr migración.
2. Definir en `@alentapp/shared` los contratos de entrada y salida del módulo Payment (`CreatePaymentRequest`, `PaymentResponse`).
3. Implementar el Caso de Uso 'CU_004_1:Alta_Obligacion_De_Pago'
4. Crear endpoint POST
