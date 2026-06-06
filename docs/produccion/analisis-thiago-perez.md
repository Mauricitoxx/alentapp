# Actividad 4 — Fase 1: Análisis y propuesta

> **Autor:** Thiago — 
> **Materia:** Ingeniería y Calidad de Software 2026 — UTN FRLP
> **Proyecto:** Alentapp

---

## 1.1. Análisis de la infraestructura Docker actual

Analicé `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`. A continuación, los 5 problemas más relevantes respecto a buenas prácticas de producción.

### Problema 1 — Build de una sola etapa con todas las dependencias de desarrollo

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile:1,14` y `packages/web/Dockerfile:1,7` |
| **Impacto** | Alto |

**Explicación:** ambos Dockerfiles usan un único `FROM node:20-alpine` y hacen `npm install`, que instala **todas** las dependencias, incluyendo las de desarrollo (`tsx`, `vitest`, `typescript`, `prisma`, `eslint`, `@playwright/test`, etc.). Esas herramientas quedan dentro de la imagen final que se desplegaría a producción. Esto infla el tamaño (la API ronda ~1 GB) y aumenta la superficie de ataque: cuantos más binarios y paquetes, más vulnerabilidades potenciales.

**Solución propuesta:** implementar un **multi-stage build**. Una etapa compila/instala, y una etapa final de runtime copia **solo** lo necesario (JS compilado + dependencias de producción con `npm ci --omit=dev`). Las herramientas de build nunca llegan a la imagen final.

---

### Problema 2 — Los contenedores corren como `root`

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile` (no hay `USER`) y `packages/web/Dockerfile` (no hay `USER`) |
| **Impacto** | Alto |

**Explicación:** ninguno de los dos Dockerfiles define un usuario. Por defecto, el proceso corre como `root` dentro del contenedor. Si un atacante explota una vulnerabilidad de la app, obtiene privilegios de root dentro del contenedor, lo que facilita escapes hacia el host o el montado de volúmenes sensibles.

**Solución propuesta:** crear y usar un **usuario no-root**. La imagen `node:22-alpine` ya trae un usuario `node` sin privilegios; basta con `USER node` (o crear un `appuser` dedicado) y ajustar permisos de los archivos copiados con `chown`.

---

### Problema 3 — Se ejecuta en modo desarrollo y con secretos hardcodeados

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile:21` (`CMD ["npm","run","dev"...]`), `docker-compose.yml:7` (`POSTGRES_PASSWORD: password123`) y `docker-compose.yml` (`command: ... tsx watch ...`) |
| **Impacto** | Alto |

**Explicación:** dos problemas de "entorno" que van juntos:
1. El comando de arranque usa `tsx watch` / `npm run dev`, que es un servidor de **desarrollo con hot-reload**. En producción no se compila el TypeScript a JS, se transpila en caliente en cada arranque — más lento, más memoria, y `tsx` es una dependencia de desarrollo que no debería estar en prod.
2. La contraseña de la base (`password123`) está **hardcodeada en texto plano** en el compose, versionada en Git. Cualquiera con acceso al repo la ve.

**Solución propuesta:** compilar el TypeScript a JS en el build y arrancar con `node dist/app.js`. Mover todas las variables sensibles a un archivo `.env` (referenciado con `env_file` o `secrets`), que **no** se versiona, y separar `docker-compose.yml` (dev) de `docker-compose.prod.yml` (prod).

---

### Problema 4 — Sin healthchecks en la API ni límites de recursos

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile` (no hay `HEALTHCHECK`) y `docker-compose.yml` (servicios `api` y `web` sin `deploy.resources.limits`) |
| **Impacto** | Medio |

**Explicación:** la DB sí tiene healthcheck (`docker-compose.yml:13`), pero la **API y el web no**. Docker no tiene forma de saber si la API quedó colgada pero el proceso sigue vivo; seguiría enrutándole tráfico. Además, ningún servicio define límites de CPU/memoria, así que un servicio con un memory leak puede consumir todos los recursos del host y tirar abajo a los demás (efecto "vecino ruidoso").

**Solución propuesta:** agregar `HEALTHCHECK` en los Dockerfiles (la API contra `localhost:3000`, el web contra `localhost:80`) y definir `deploy.resources.limits` de CPU y memoria por servicio en el compose de producción.

---

### Problema 5 — Orden de capas y `.dockerignore` mínimo (mal aprovechamiento de caché)

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile:17` (`COPY . .`), `.dockerignore` (solo 4 líneas) |
| **Impacto** | Medio |

**Explicación:** el `.dockerignore` actual solo excluye `node_modules`, `dist`, `.git` y `*.log`. No excluye tests (`*.test.ts`, `e2e-fullstack/`), documentación (`docs/`), archivos de entorno (`.env*`), ni configuración de CI. Todo eso se copia con `COPY . .` y termina dentro de la imagen, agrandándola y, en el caso de los `.env`, **filtrando secretos**. Además, copiar todo el contexto invalida la caché de capas de Docker ante cualquier cambio de código, obligando a reinstalar dependencias aunque no hayan cambiado.

**Solución propuesta:** robustecer el `.dockerignore` (excluir tests, docs, `.env*`, `.github`, coverage, etc.) y ordenar las capas para maximizar cache hits: copiar primero los `package.json` y hacer `npm ci`, y recién después copiar el código fuente. Así, si solo cambia el código, Docker reutiliza la capa de dependencias cacheada.

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un **estándar y conjunto de herramientas para instrumentar aplicaciones**: provee APIs, SDKs y un protocolo para **generar, recolectar y exportar** datos de telemetría (trazas, métricas y logs). Es **vendor-neutral**: instrumentás una vez y podés enviar los datos a cualquier backend. **OTel no almacena ni grafica nada** — solo produce y transporta la telemetría.

**Prometheus** es un **sistema de monitoreo y base de datos de series temporales**: se encarga de **recolectar (scrapear), almacenar y consultar** métricas mediante su lenguaje **PromQL**. Es un **backend** de métricas.

**La diferencia clave:** OTel es el "productor/instrumentador" de telemetría; Prometheus es el "almacén/consultor" de métricas. Son **complementarios**: en esta actividad, OTel instrumenta la API y expone las métricas en un endpoint, y Prometheus las scrapea y las guarda para que Grafana las consulte.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares son:

1. **Métricas (metrics):** valores numéricos agregados en el tiempo (ej. requests por segundo, uso de memoria). Baratas de almacenar, ideales para dashboards y alertas.
2. **Logs:** registros de eventos discretos con detalle textual (ej. "error al conectar a la DB a las 14:32"). Útiles para el detalle puntual.
3. **Trazas (traces):** el recorrido de una request a través de los distintos componentes/servicios, mostrando dónde se gasta el tiempo (clave en microservicios).

**OpenTelemetry aborda los tres** — es un estándar unificado para metrics, logs y traces. Esa es justamente su gran ventaja sobre herramientas que cubren un solo pilar. En **esta actividad nos enfocamos en el pilar de métricas** (las métricas RED).

### Métricas RED (Rate, Errors, Duration)

El método **RED** (propuesto por Tom Wilkie) define las tres métricas fundamentales para monitorear **servicios orientados a requests** (como una API):

- **Rate (tasa):** cantidad de **requests por segundo** que recibe el servicio. Responde "¿cuánto tráfico tengo?". Sirve para entender la carga y detectar picos o caídas de uso.
- **Errors (errores):** cantidad/proporción de requests que **fallan** (típicamente 4xx y 5xx). Responde "¿qué tan confiable es el servicio?". Sirve para detectar degradaciones y disparar alertas.
- **Duration (duración):** la **latencia** de las requests, normalmente vista como distribución (percentiles p95/p99, no solo el promedio). Responde "¿qué tan rápido respondo?". Refleja la experiencia percibida por el usuario y ayuda a encontrar cuellos de botella.

Juntas dan una visión completa de la **salud y el rendimiento** del servicio. (El método complementario, **USE** —Utilization, Saturation, Errors— se usa para monitorear *recursos* como CPU o disco, en vez de servicios de request.)

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directo a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el **protocolo estándar de transporte** de OpenTelemetry. Define cómo se envían las trazas, métricas y logs desde la aplicación (o el SDK) hacia un Collector o un backend, normalmente sobre **gRPC o HTTP/protobuf**.

**Ventajas frente a exportar directo al formato Prometheus:**
- **Vendor-neutral:** no quedás atado al formato de Prometheus. El mismo flujo OTLP puede ir a Jaeger, Tempo, Datadog, etc.
- **Cubre los 3 pilares:** OTLP transporta métricas, trazas y logs; el exporter de Prometheus solo métricas.
- **Permite usar un OTel Collector intermedio**, que puede **procesar, agregar, filtrar y rutear** la telemetría a varios destinos a la vez, desacoplando la instrumentación del backend.
- **Modelo push** (la app empuja los datos), útil para servicios efímeros (serverless, jobs) que pueden morir antes de que Prometheus los scrapee.

> **Nota honesta sobre nuestra implementación:** en esta actividad usamos el **`PrometheusExporter`** de OpenTelemetry, que es **pull-based** (expone un endpoint `/metrics` en el puerto 9464 para que Prometheus lo scrapee), **no** OTLP push. Es la opción más simple para integrarse con Prometheus + Grafana. Si quisiéramos escalar a múltiples backends o agregar trazas, migraríamos a un OTel Collector con OTLP.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

**Grafana es la capa de visualización.** No genera ni almacena datos: se conecta a **data sources** (Prometheus, Tempo, Loki, o backends compatibles con OTel) y los grafica en dashboards.

El flujo completo de nuestra arquitectura queda así:

```
  API (Fastify)
   │  OpenTelemetry SDK instrumenta y expone métricas
   ▼
  :9464/metrics   ← endpoint de métricas (PrometheusExporter)
   │  Prometheus scrapea cada 15s
   ▼
  Prometheus  ← almacena las series temporales, se consulta con PromQL
   │  Grafana consulta vía PromQL
   ▼
  Grafana  ← dashboard RED con los 6 paneles
```

---
