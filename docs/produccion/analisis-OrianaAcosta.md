## 1.1. Analizar la infraestructura Docker actual

A continuación se detallan 5 vulnerabilidades y problemas arquitectónicos detectados en la configuración actual, evaluando la orquestación y la construcción de las imágenes de los paquetes:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **Falta de Hardening (Ejecución privilegiada como root)** | `packages/api/Dockerfile` (Línea 21)<br>`packages/web/Dockerfile` (Línea 14) | **Alto** | Los contenedores ejecutan sus procesos principales como superusuario por defecto. Se debe agregar la directiva `USER node` justo antes del `CMD` para limitar el alcance ante un posible compromiso del contenedor. |
| **Inclusión de dependencias de desarrollo en el artefacto final** | `packages/api/Dockerfile` (Línea 12: `RUN npm install`)<br>`packages/web/Dockerfile` (Línea 8: `RUN npm install`) | **Medio** | Al usar `npm install` sin banderas, la imagen final acarrea dependencias innecesarias, aumentando la superficie de ataque y el peso. Se debe rediseñar con **Multi-stage builds** y usar `npm ci --omit=dev` para la etapa de producción. |
| **Uso de herramientas de desarrollo en tiempo de ejecución (Runtime)** | `packages/web/Dockerfile` (Línea 14: `CMD ["npm", "run", "dev"...]`)<br>`docker-compose.yml` (Línea 34: `tsx watch`) | **Alto** | Vite y `tsx watch` están diseñados para *hot-reloading*, consumiendo mucha memoria RAM. Para producción, el frontend debe empaquetarse estáticamente (`npm run build`) y servirse con Nginx, y la API debe ejecutarse con Node puro. |
| **Credenciales en texto plano (Falta de inyección segura)** | `docker-compose.yml` (Líneas 6-7, 27) | **Alto** | Las variables `POSTGRES_USER` y `DATABASE_URL` están hardcodeadas en el orquestador. El diseño debe separar la configuración del entorno, utilizando un archivo `.env` externo o *Docker Secrets* inyectados dinámicamente (`${VARIABLE}`). |
| **Ausencia de límites de recursos y monitoreo interno** | `docker-compose.yml` (Servicios `api` y `web`, Líneas 16 y 44) | **Alto** | Ante un pico de carga o un bucle infinito, un contenedor puede consumir toda la memoria del *host*. Se deben definir `deploy.resources.limits` (CPU y RAM) e implementar `healthchecks` para garantizar la auto-recuperación de los servicios. |

## 1.2. Investigar OpenTelemetry

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**
Según la documentación oficial, OpenTelemetry (OTel) es un *framework* de observabilidad de código abierto (compuesto por APIs, SDKs y herramientas) diseñado para instrumentar, generar, capturar y exportar datos de telemetría. Su principal característica es ser **agnóstico al proveedor**. 
La diferencia fundamental con Prometheus radica en sus responsabilidades dentro de la arquitectura:
* **OpenTelemetry** se enfoca exclusivamente en la recolección y el transporte de los datos. No tiene un motor de almacenamiento propio ni interfaz gráfica.
* **Prometheus**, en cambio, es una base de datos de series temporales (TSDB) y un sistema de alertas. Su trabajo es recibir (o hacer *pulling*) de las métricas, almacenarlas y permitir consultarlas mediante PromQL.

**¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**
La ingeniería de confiabilidad define tres pilares fundamentales para entender el estado interno de un sistema:
1. **Métricas:** Datos numéricos agregados a lo largo del tiempo (ej. uso de CPU, cantidad de peticiones). Permiten detectar tendencias y configurar alertas.
2. **Logs (Registros):** Eventos inmutables con texto detallado y marcas de tiempo que describen un suceso específico en el sistema (ej. un error de base de datos).
3. **Trazas (Traces):** Representan el ciclo de vida completo de una petición a medida que atraviesa múltiples microservicios, siendo vitales para aislar cuellos de botella y latencia.
A diferencia de herramientas anteriores que se especializaban en un solo pilar, **OpenTelemetry aborda los tres pilares simultáneamente**, unificándolos bajo un estándar común y permitiendo correlacionar una traza específica con sus logs y métricas correspondientes.

**Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**
Tal como define Tom Wilkie (creador de este estándar), el Método RED es un enfoque centrado en la instrumentación de arquitecturas de microservicios, priorizando la experiencia del usuario final (a diferencia del método USE, que se centra en el hardware). Se compone de:
* **Rate (Tasa):** La cantidad de solicitudes que el servicio atiende por segundo. *Sirve para:* Entender el volumen de tráfico actual, medir la carga del sistema y planificar el escalamiento (Capacity Planning).
* **Errors (Errores):** La cantidad (o tasa) de solicitudes que fallaron. *Sirve para:* Identificar rápidamente caídas del servicio, bugs introducidos en nuevos despliegues y medir el cumplimiento de los Acuerdos de Nivel de Servicio (SLAs).
* **Duration (Duración):** El tiempo que toma responder a una solicitud (latencia). *Sirve para:* Evaluar el rendimiento, detectar degradación en la experiencia del usuario y optimizar endpoints lentos.

**¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**
OTLP es el protocolo de propósito general y estándar oficial de OpenTelemetry diseñado para codificar, transportar y entregar datos de telemetría entre fuentes, recolectores (Collectors) y backends. 
La gran ventaja técnica de usar OTLP frente a instrumentar el código con librerías nativas de Prometheus es evitar el **Vendor Lock-in** (dependencia tecnológica). Al usar OTLP, la aplicación exporta los datos en un formato neutral hacia un *OTel Collector*. Desde ese intermediario, los equipos de operaciones pueden decidir enviar las métricas a Prometheus, pero también derivarlas a Datadog, AWS, o New Relic en el futuro, sin necesidad de reescribir, recompilar ni alterar el código fuente de la aplicación.

**¿Cómo se relaciona OpenTelemetry con Grafana?**
Según la arquitectura documentada por Grafana Labs, ambas herramientas se complementan para formar un *pipeline* integral de observabilidad. 
OpenTelemetry actúa como el motor de instrumentación y recolección (el agente en el código). Estos datos son enviados a bases de datos compatibles (como Prometheus para métricas, Tempo para trazas y Loki para logs). Finalmente, **Grafana** se sitúa en la capa superior como la interfaz de visualización, conectándose a esos *backends* para consumir la telemetría generada por OTel y transformarla en *dashboards* interactivos, gráficos y paneles de control que facilitan el análisis humano.