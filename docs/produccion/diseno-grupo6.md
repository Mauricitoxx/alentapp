# 2.1. Diseño de la infraestructura Docker

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