# Análisis - Juan Caceres

## Análisis de infraestructura de Docker
| Problema                   | ¿Dónde ocurre?                            | Impacto               | Solución
| ----------------------------| --------------------------------------------- | ------------------------- |------------------------- 
| Dependencias innecesariaas| Alentapp/packages/api/Dockerfile : linea 17 | Alto | Utilizar Multi-stage  
| Corre con usuario root| Alentapp/packages/api/Dockerfile | Alto | Correr con usuario node 
| Orden de capas regular| Alentapp/packages/api/Dockerfile | Medio | Separar la instalación de las dependencias globales de la raíz de las dependencias específicas de cada paquete 
| Consumo de memoria RAM alto en contenedor frontend| Alentapp/packages/web/Dockerfile | Alto |   Compliar frotend web con ``npm run build`` y servirse con un servidor web más liviano
| Corre con usuario root| Alentapp/packages/web/Dockerfile | Alto | Correr con usuario node 

## OpenTelemetry

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**

OpenTelemetry es un *framework open source* de observabilidad para datos de telemetría. Este *framework* recopila, procesa y estandariza los datos de telemetría, los cuales luego pueden ser exportados a diferentes plataformas de análisis.
    
A diferencia de OpenTelemetry, Prometheus es un sistema de almacenamiento de métricas que nos brinda la capacidad de monitorizarlas. Básicamente, OpenTelemetry obtiene, procesa y estandariza los datos, para luego exportarlos y almacenarlos en Prometheus, permitiendo usar esta última herramienta para el monitoreo.

---

**¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**

Según la página oficial de IBM, los tres pilares de la observabilidad son:
- **Registros (Logs):** Documento físico o digital que sirve de evidencia de que un evento, transacción o actividad ha ocurrido.
- **Métricas:** Conocimientos cuantitativos sobre el rendimiento del sistema mediante la medición de varios parámetros.
- **Rastreos (Traces):** Seguimientos que combinan algunas de las características de las métricas y los registros.

OpenTelemetry aborda los tres pilares, ya que es una herramienta que permite obtener *métricas* sobre el rendimiento del sistema, *rastrear* los eventos en el sistema usando identificadores (IDs) y registrar dicha información mediante *logs*.

---

**Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**

RED es un método que sigue la filosofía de monitoreo orientada a microservicios.

- **Rate (Tasa - número de solicitudes por segundo):** Saber cuántas entradas tiene nuestro sistema por segundo nos ayuda a entender su comportamiento. Permite medir aspectos como la latencia, la capacidad de procesamiento y la escala del sistema.
- **Errors (Errores - el número de solicitudes que fallan):** Es fundamental porque si tenemos una tasa alta de errores, significa que los usuarios están experimentando fallas en la carga de las páginas o en las respuestas del sistema.
- **Duration (Duración - la cantidad de tiempo que toman esas solicitudes):** Nos sirve para conocer la velocidad y los tiempos de respuesta de nuestro sitio web o servicio.

---

**¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**

Las especificaciones de OTLP describen el mecanismo de codificación, transporte y entrega de los datos de telemetría entre las fuentes de telemetría, los nodos intermedios (como los recolectores) y los sistemas de procesamiento de telemetría.

Si bien Prometheus ofrece herramientas útiles para la supervisión, almacenamiento y visualización de métricas, el protocolo de OpenTelemetry sirve para procesar y rastrear métricas más complejas a través de integraciones agnósticas del lenguaje de programación, sin acoplar la aplicación a un backend de almacenamiento específico.

---

**¿Cómo se relaciona OpenTelemetry con Grafana?**

OpenTelemetry y Grafana son herramientas con una excelente sinergia, ya que la primera ofrece SDKs y estándares abiertos para aplicaciones de observabilidad. Esto encaja perfectamente con la filosofía de plataforma de observabilidad *"Big Tent"* de Grafana, la cual busca facilitar la interoperabilidad y ofrecer opciones flexibles. 

La habilidad de unificar la infraestructura y las plataformas de telemetría (como las métricas de Prometheus en Kubernetes) junto con la telemetría de las aplicaciones, tiende puentes entre los *backends* de monitoreo *open source* y las necesidades de los desarrolladores.