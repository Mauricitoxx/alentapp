# Fase 2: Especificar y Diseñar - Grupo 6

## 2.1. Diseño de la infraestructura Docker

### a) packages/api/Dockerfile.prod
### b) packages/web/Dockerfile.prod
### c) docker-compose.prod.yml

## 2.2. Diseño de la observabilidad

### a) Métricas RED a capturar

Para evaluar de manera cuantitativa el rendimiento, la disponibilidad y la salud de la API, se implementará el modelo de monitoreo RED (Rate, Errors, Duration). A su vez, se complementará con métricas de infraestructura para vigilar el consumo de recursos a nivel de proceso. 

A continuación, se define el diccionario de las 5 métricas fundamentales que serán exportadas mediante OpenTelemetry:

| Métrica | Tipo OpenTelemetry | Descripción | Labels (Etiquetas) |
| :--- | :--- | :--- | :--- |
| `http.server.requests.rate` | Counter | **Rate (Tasa):** Requests por segundo. Mide el volumen total de tráfico entrante para identificar picos de carga. | `method`, `route`, `status` |
| `http.server.requests.errors` | Counter | **Errors (Errores):** Tasa de error. Contabiliza exclusivamente las respuestas fallidas del servidor (códigos HTTP 4xx y 5xx). | `method`, `route`, `status` |
| `http.server.requests.duration` | Histogram | **Duration (Duración):** Latencia de requests. Mide el tiempo de respuesta de cada petición para el cálculo de percentiles de performance (p95, p99). | `method`, `route` |
| `process.memory.usage` | Gauge | **Memoria del proceso:** Mide el consumo de memoria RAM instantáneo de Node.js, vital para la detección temprana de *memory leaks*. | N/A |
| `http.requests.active` | Gauge | **Requests concurrentes:** Mide el volumen de peticiones HTTP que están siendo procesadas por el servidor en un instante determinado. | N/A |

### b) OpenTelemetry SDK

Para llevar a cabo la recolección de las métricas definidas sin acoplar código de telemetría dentro de los controladores (respetando el principio de Responsabilidad Única y manteniendo el código limpio), se utilizará el SDK oficial de OpenTelemetry para Node.js configurado con auto-instrumentación.

La inicialización del SDK se realizará en un archivo independiente (ej. `tracing.ts`) que debe ejecutarse en el punto de entrada de la aplicación, antes de levantar el servidor Fastify:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

// 1. Configurar el exportador para que Prometheus recolecte las métricas
const exporter = new PrometheusExporter({
  endpoint: '/metrics',
});

// 2. Inicializar el SDK de OpenTelemetry
const sdk = new NodeSDK({
  metricReader: exporter,
  // 3. Inyectar auto-instrumentación global
  instrumentations: [getNodeAutoInstrumentations()]
});

// 4. Iniciar la recolección
sdk.start();
console.log('OpenTelemetry SDK inicializado correctamente.');
```

Se tomó la decisión de diseño de no ensuciar los controladores individuales con contadores manuales. En su lugar, el paquete getNodeAutoInstrumentations() se encarga de inyectarse a nivel global. En el contexto de nuestro framework (Fastify), la auto-instrumentación se acopla a los Hooks del ciclo de vida HTTP, interceptando cada petición de forma transparente e invisible para la capa de negocio.

### c) Dashboard RED en Grafana

Para visualizar la telemetría exportada y tener un diagnóstico en tiempo real de la salud de la API, se diseñará un dashboard central en Grafana. Este tablero consumirá los datos desde Prometheus utilizando el lenguaje de consultas PromQL.

A continuación, se define la estructura de los 6 paneles fundamentales que compondrán el dashboard:

| Panel | Métrica / Consulta PromQL | Tipo de gráfico | Propósito |
| :--- | :--- | :--- | :--- |
| **1. Requests por segundo** | `sum(rate(http_server_requests_duration_count[1m]))` | Time series | **Rate:** Ver el tráfico actual entrante a la API para detectar picos de carga. |
| **2. Tasa de error** | `sum(rate(http_server_requests_duration_count{status=~"5.."}[1m])) / sum(rate(http_server_requests_duration_count[1m]))` | Time series | **Errors:** Visualizar el porcentaje de errores del servidor (5xx) sobre el tráfico total, vital para medir la disponibilidad. |
| **3. Latencia p95/p99** | `histogram_quantile(0.95, sum(rate(http_server_requests_duration_bucket[1m])) by (le))` | Time series | **Duration:** Medir la performance percibida por el 95% y 99% de los usuarios, ignorando valores promedio engañosos. |
| **4. Por status code** | `sum by(status) (rate(http_server_requests_duration_count[1m]))` | Stacked area | Analizar la distribución de respuestas HTTP (200, 400, 500) para aislar errores de cliente vs. servidor. |
| **5. Memoria del proceso** | `process_memory_usage_bytes` | Time series | Monitorear el consumo de recursos de Node.js en el tiempo para detectar *memory leaks* (fugas de memoria). |
| **6. Endpoints más lentos** | `topk(5, histogram_quantile(0.95, sum(rate(http_server_requests_duration_bucket[1m])) by (le, route)))` | Bar chart (horizontal) | Identificar visualmente los 5 cuellos de botella principales de la API filtrando por la etiqueta `route`. |

**Decisión de visualización:** Se prioriza el uso de gráficos de series de tiempo (*Time series*) para las métricas RED, ya que permiten correlacionar eventos. Por ejemplo, si se observa un pico visual en la *Tasa de error* (Panel 2) a las 14:00hs, se puede mirar verticalmente el panel de *Memoria del proceso* (Panel 5) a esa misma hora para comprobar si la caída fue provocada por una saturación de RAM.