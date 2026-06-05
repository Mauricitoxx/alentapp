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