# Actividad 4 — Fase 1: Análisis y propuesta

> **Autor:** Mauro
> **Materia:** Ingeniería y Calidad de Software 2026 — UTN FRLP
> **Proyecto:** Alentapp

---

## 1.1. Análisis de la infraestructura Docker actual

Tras revisar la configuración provista en `docker-compose.yml` y los respectivos `Dockerfile` de los paquetes `api` y `web`, logré identificar 5 falencias críticas que impedirían el despliegue seguro en producción.

### Problema 1: Imágenes monolíticas sin Multi-Stage (Tamaño excesivo)

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile` y `packages/web/Dockerfile` |
| **Impacto** | Medio |

**Explicación:** Se está copiando todo el código y corriendo `npm install` en una sola etapa. Esto hace que queden instaladas librerías de desarrollo que no se necesitan en producción (como `vitest` o `typescript`), generando imágenes que pesan muchísimo más de lo necesario.
**Solución propuesta:** Usar *Multi-Stage Builds*. Tener una etapa para instalar dependencias y compilar, y otra etapa final y limpia que solo copie el resultado (dist) y ejecute `npm ci --omit=dev`.

---

### Problema 2: Contenedores ejecutándose como usuario `root`

| | |
|---|---|
| **¿Dónde ocurre?** | `packages/api/Dockerfile` y `packages/web/Dockerfile` |
| **Impacto** | Alto |

**Explicación:** Al no especificar ningún usuario en los Dockerfiles, los procesos corren como el administrador (root) dentro del contenedor por defecto. Esto es un riesgo grande de seguridad si alguien vulnera la aplicación.
**Solución propuesta:** Declarar un usuario sin privilegios. La imagen base de Alpine ya tiene el usuario `node`, así que solo hace falta agregar la línea `USER node` antes de ejecutar la aplicación.

---

### Problema 3: Contraseñas y secretos hardcodeados

| | |
|---|---|
| **¿Dónde ocurre?** | `docker-compose.yml:7` y `docker-compose.yml:30` |
| **Impacto** | Alto |

**Explicación:** En el archivo `docker-compose.yml` se puede ver la contraseña de la base de datos (`POSTGRES_PASSWORD: password123`) escrita directamente en texto plano. Esto queda subido a GitHub y cualquier persona puede ver las claves.
**Solución propuesta:** Mover todas esas variables a un archivo local `.env` (que se agrega al `.gitignore`) e inyectarlas en el compose usando variables como `${POSTGRES_PASSWORD}`.

---

### Problema 4: Ejecución de servidores de desarrollo en producción

| | |
|---|---|
| **¿Dónde ocurre?** | `docker-compose.yml:35-38` (`tsx watch`) y `packages/web/Dockerfile:16` (`vite dev`) |
| **Impacto** | Alto |

**Explicación:** Para correr los proyectos se están utilizando herramientas como `tsx watch` o `vite`. Estos son servidores pensados para desarrollar (con auto-recarga) que son más lentos y consumen mucha memoria. No están preparados para un entorno productivo.
**Solución propuesta:** Para la API, se debe compilar el TypeScript primero y luego ejecutar el código JS resultante con `node dist/app.js`. Para el frontend de React, se debe *buildear* estáticamente y servir los archivos generados con un servidor web ligero como `nginx`.

---

### Problema 5: Falta de controles de salud (Healthchecks)

| | |
|---|---|
| **¿Dónde ocurre?** | `docker-compose.yml` (servicios `api` y `web`) |
| **Impacto** | Medio |

**Explicación:** El servicio de la base de datos tiene configurado un `healthcheck`, pero la API y el Frontend no. Si el servidor de Node.js se queda colgado internamente, Docker no se va a enterar y le va a seguir mandando tráfico a un contenedor que no responde.
**Solución propuesta:** Agregar la directiva `HEALTHCHECK` en los Dockerfiles (por ejemplo, haciendo un test a `localhost:3000`) para que Docker pueda reiniciar el contenedor automáticamente si detecta que deja de funcionar.

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
OpenTelemetry es un proyecto y estándar *open source* (independiente de proveedores) diseñado para crear y gestionar datos de telemetría (métricas, logs y trazas) desde las aplicaciones. Provee las herramientas (SDKs) necesarias para instrumentar el código.
La principal diferencia radica en su rol: **OpenTelemetry es el "mensajero"** que recopila y estandariza los datos de la aplicación, pero no posee una base de datos propia ni motor de consultas. Por el contrario, **Prometheus es el "destino final"** de las métricas; es una base de datos de series temporales que se encarga de guardar históricamente los datos que le envía OpenTelemetry y permite consultarlos con su lenguaje PromQL.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
La observabilidad moderna se sustenta en tres pilares:
1. **Logs (Registros):** Mensajes de texto discretos que ocurren en un momento determinado, ideales para hacer debugging de errores específicos.
2. **Metrics (Métricas):** Datos numéricos que se agregan a lo largo del tiempo (ej. uso de CPU, cantidad de usuarios activos). Útiles para monitorear tendencias y disparar alertas generales.
3. **Traces (Trazas):** El seguimiento de una petición particular a medida que salta entre múltiples microservicios o componentes del sistema.

**OpenTelemetry es único porque aborda los tres pilares simultáneamente** bajo un mismo estándar y API, eliminando la necesidad de instalar tres agentes o librerías diferentes en nuestro código.

### Expliquen el concepto de métricas RED (Rate, Errors, Duration)
El framework RED es un patrón diseñado para simplificar el monitoreo de aplicaciones enfocadas en responder peticiones (como nuestra API REST):
*   **Rate (Tasa):** Es el volumen de tráfico, habitualmente medido en *requests por segundo*. Sirve para saber qué tan cargado está el sistema y comprender si los picos de latencia se deben a aumentos repentinos de usuarios.
*   **Errors (Errores):** Es la cantidad de peticiones que fallaron (generalmente, códigos de estado HTTP 5xx o 4xx). Sirve como el principal indicador de la salud del sistema; si esta métrica sube, hay un incidente activo.
*   **Duration (Duración):** Mide el tiempo que tardamos en responder a una petición (latencia), habitualmente observando el percentil 95 o 99. Sirve para evaluar la calidad y velocidad de la experiencia que percibe el usuario final.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
El **OTLP** es el protocolo de transporte universal y oficial de OpenTelemetry. Define con exactitud cómo deben codificarse y transmitirse los datos de telemetría por la red (usualmente empleando gRPC o HTTP).
La mayor ventaja de usar OTLP (hacia un *OpenTelemetry Collector*) en lugar de exportar directamente a Prometheus es evitar el acoplamiento o "vendor lock-in". Si mañana la organización decide migrar de Prometheus a Datadog o New Relic, solo se debe cambiar un archivo de configuración en el Collector; no es necesario modificar ni recompilar ni una sola línea de código en la aplicación, ya que esta sigue enviando sus datos mediante el estándar universal OTLP.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
Se relacionan a través de la arquitectura de monitoreo. OpenTelemetry genera los datos de métricas RED de nuestra API y se los entrega a Prometheus para que los guarde. Luego, **Grafana** entra en juego conectándose a Prometheus como fuente de datos. Grafana es la interfaz visual (*dashboard*) que permite a los desarrolladores y operadores consultar esas métricas mediante gráficos interactivos y fáciles de interpretar. Grafana lee lo que Prometheus almacenó basándose en lo que OpenTelemetry observó.

---
