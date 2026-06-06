# 2.1. Diseño de la infraestructura Docker

## a) packages/api/Dockerfile.prod

### Descripción del diseño
**Propósito:**
El propósito del archivo es compilar y empaquetar la aplicación de la API (backend) en una imagen Docker optimizada para producción. Es necesario porque:
- 1. <u>Compilación de TypeScript</u> : Evita ejecutar herramientas de desarrollo como `tsx watch` en el entorno de ejecución final, ejecutando código JavaScript compilado de forma nativa para lograr un mejor rendimiento y menor consumo de memoria.
- 2. <u>Descarte de dependencias de desarrollo</u> : Asegura que librerías pesadas como `vitest`, compilers y herramientas auxiliares queden fuera de la imagen de producción final.
- 3. <u>Seguridad del runtime</u> : Facilita la ejecución bajo un usuario no-root (`node`) y permite la inmutabilidad y hardening del contenedor.

**Estructura:**
El diseño implementa un Multi-stage Build estructurado en 3 etapas:
- **Stage 1: deps** (``node:20-alpine``): Se encarga de copiar las configuraciones del monorepo (`package*.json` y los package.json de cada paquete) e instalar todas las dependencias (`npm install`). Esta capa se almacena en caché y solo se invalida si cambian las dependencias del proyecto.
- **Stage 2: build** (``node:20-alpine``): Copia el código fuente completo del monorepo, genera los esquemas y clientes de Prisma (`npx prisma generate`), y compila todo el código de TypeScript a JavaScript (`npm run build -w packages/api`).
- **Stage 3: runtime** (``node:20-alpine``): Es la etapa final limpia. Copia el archivo `package*.json` e instala únicamente las dependencias de producción (`npm ci --omit=dev`), importa el cliente de Prisma generado y el build compilado en la etapa anterior (`dist`), establece el usuario sin privilegios `USER node`, y expone los puertos 3000 (API) y 9464 (métricas de OpenTelemetry).

**Requisitos No Funcionales**
- **Tamaño máximo de imagen:** Menor a 300 MB (descartando archivos fuente y dependencias de desarrollo).
- **Tiempo de Arranque:** Menor a 5 segundos, ejecutando directamente con Node sin etapas de compilación al vuelo.
- **Seguridad:** Ejecución con usuario no privilegiado (`node`), con control de puertos de red.
- **Consumo de Recursos:** Memoria RAM en reposo aproximada menor a 50MB.

## b) packages/web/Dockerfile.prod

### Descripción del diseño
**Propósito:** 
El proposito del archivo es compilar y empaquetar la aplicacion web frotend en una imagen Docker optimizada para producción. Es necesario porque:
- 1. <u>Aisla el entrono</u> : Asegura que la compilación sea idéntica en cualquier máquina o servidor de CI/CD (Integración continua y Entrega/Despliegue continuo).
- 2. <u>Eficiencia en producción</u> :  Descarta por completo Node.js en el entrono de ejecución, utilizando Nginx como un servidor web más liviano y de alto rendimiento para servir los archivos estáticos generados por Vite
- 3. <u>Seguridad y rendimiento</u> : Incorpora de forma nativa configuraciones de comprensión, políticas de caché y cabeceras de seguridad para proteger al usuario final. 

**Estructura:** 
El diseño implementa un Multi-stage Build optimizado en 3 etapas para maximizar el uso de la caché de capas de Docker: 
- **Stage 1: deps** (``node:22-alpine``): Se encarga solo de resolver e instalar las dependencias del monorepo (``npm install``). Al copiar solo los archivos de configuración (``package.json``), esta capa se cachea y no se vuelve a ejecutar a menos que se agregue o elimine una librería.
- **Stage 2 build** (``node:22-alpine``): Toma las dependencias de la etapa anterior, copia el código fuente de la web y del paquete ``shared``, y ejecuta el compilador de Vite (``npm run build``). Produce una carpeta ``dist`` con archivos estáticos puros.
- **Stage 3 runtime (nginx:stable-alpine)**: La estapa final, Descarta todo lo anterior (Node.js, herramientas de desarrollo, código fuente sensible) y solo copia la carpeta ``dist`` hacia el directorio raíz de Nginx. 

**Requisitos No Funcionales**
- **Tamaño máximo de imagen:** Menor a 50 MB (usar ``nginx:stable-alpine`` y eliminar Node.js hace que la imagen final sea enormemente más pequeña)
- **Tiempo de Arranque:** Debe ser instantaneo, ya que con Nginx no requiere inicializar un entrono de ejecución ni levantar servidores de desarrollo.
- **Seguridad:** Ejecucion con usuario no root. Sistema de archivos inmutable y exposición estricta del puerto HTTP estándar.
- **Consumo de Recursos:** Memoria RAM en reposo, debe usar aproximadamente menos de 10MB. 

## c) docker-compose.prod.yml

### Descripción del diseño
**Propósito:** 
El propósito del archivo es orquestar los tres servicios del sistema (``api``, ``web`` y ``db``) en un entorno productivo, definiendo cómo se construyen, comunican y protegen entre sí. Es necesario porque:
- 1. <u>Separa desarrollo de producción</u> : Reemplaza al ``docker-compose.yml`` de desarrollo (que prioriza el hot-reload con bind mounts y ``tsx watch``) por una configuración orientada a seguridad, estabilidad y eficiencia.
- 2. <u>Centraliza la seguridad</u> : Aplica hardening a nivel de contenedor (filesystem de solo lectura, capabilities mínimas, sin escalada de privilegios) y saca los secretos del código, leyéndolos desde un archivo ``.env`` no versionado.
- 3. <u>Garantiza la resiliencia</u> : Define límites de recursos, healthchecks y un orden de arranque por dependencias para que el sistema se levante de forma predecible y un servicio no pueda tirar abajo a los demás.

**Estructura:** 
El diseño define tres servicios, una red interna personalizada y un volumen persistente, tomando los valores sensibles desde un archivo ``.env``:
- **Servicio db (``postgres:16-alpine``):** Base de datos. **No expone su puerto al host**: solo es alcanzable por la ``api`` a través de la red interna. Persiste sus datos en el volumen ``pgdata`` y tiene healthcheck con ``pg_isready``.
- **Servicio api (build desde ``Dockerfile.prod``):** API REST. Arranca solo cuando la ``db`` está ``healthy``, corre las migraciones y queda escuchando en el puerto 3000 (más el 9464 para las métricas de OpenTelemetry). Aplica ``read_only``, ``cap_drop: ALL`` + ``cap_add: NET_BIND_SERVICE`` y ``no-new-privileges``.
- **Servicio web (build desde ``Dockerfile.prod``):** Frontend servido por Nginx en el puerto 80. Arranca después de la ``api`` y aplica el mismo hardening de seguridad, con ``tmpfs`` para las rutas que Nginx necesita escribir.
- **Red ``alentapp-net``:** Red bridge interna y aislada (no la default), por la que se comunican los tres servicios.
- **Volumen ``pgdata``:** Persiste los datos de PostgreSQL entre reinicios.

**Requisitos No Funcionales**
- **Seguridad:** Ningún contenedor corre como root; filesystem de solo lectura (``read_only``) en ``api`` y ``web`` con ``tmpfs`` para las rutas escribibles; capabilities mínimas (``cap_drop: ALL``); sin escalada de privilegios; secretos vía ``.env`` (no hardcodeados).
- **Aislamiento de red:** Red interna dedicada; la base de datos no es accesible desde fuera del entorno Docker.
- **Resource limits:** CPU y memoria definidos por servicio (``deploy.resources.limits``) para evitar el efecto "vecino ruidoso". Propuesta: ``db`` 0.5 CPU / 512M, ``api`` 0.75 CPU / 512M, ``web`` 0.25 CPU / 128M.
- **Resiliencia:** Healthchecks en los tres servicios; arranque ordenado por dependencias (``db`` → ``api`` → ``web``); política de reinicio ``restart: unless-stopped``.
- **Observabilidad:** Logging con driver ``json-file`` y rotación (``max-size: 10m``, ``max-file: 3``); el puerto 9464 queda expuesto para que Prometheus scrapee las métricas.

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