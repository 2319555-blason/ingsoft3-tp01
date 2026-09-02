# Decisiones — TP1: Git colaborativo

## Por qué Git no pudo resolver el conflicto solo

Git no pudo resolverlo solo porque al modificar la misma parte del archivo mediante
las ramas A y B, este no es capaz de decidir qué versión es la correcta, se necesita
una resolución manual. El conflicto no hubiera existido si el cambio se hacía en
archivos diferentes o si se trabaja desde una misma rama.

## Qué problemas encontré

El primer problema fue que el push al main fue rechazado porque el repositorio remoto
tenía cambios que mi repositorio local todavía no tenía. Y el segundo problema fue que
no podía mergear la rama B. Lo resolví mirando los marcadores de conflicto, eligiendo
cuál sería el contenido/versión final y recién ahí hacer merge.

## Declaración de uso de IA

En el TP1 no usé IA.

---

# Decisiones — TP2: Contenedores

## Elección de la app del semestre

Elegí **Home Maintenance Tracker**, una aplicación para registrar el historial de
mantenimiento del hogar y calcular qué tareas están vencidas o próximas a vencer.

Cumple con los criterios pedidos:

- **Backend con API propia**: .NET 8 con minimal API, expone `/api/records` (CRUD
  completo) y `/api/suggestions`.
- **Frontend**: SPA en React + Vite con tres páginas (panel, listado y formulario).
- **Interacción real con base de datos**: PostgreSQL con Entity Framework Core. Los
  datos no son de mentira ni están hardcodeados; el cálculo de tareas vencidas se
  hace en el backend a partir de lo que hay guardado.
- Es individual y no la comparto con ningún compañero.
- La probé corriendo localmente antes de containerizarla.

Más allá de los criterios, elegí este dominio porque es un problema concreto de mi
casa: nunca nos acordamos de cuándo fue el último service de la caldera o la última
revisión de las cañerías, y terminamos enterándonos cuando algo se rompe.

Me convenía además que fuera un problema chico y acotado pero con lógica de negocio
real en el backend. El panel no es un listado plano: toma el registro más reciente de
cada tarea (definida por categoría + título), le suma el intervalo recomendado en meses
y calcula si está vencida o próxima a vencer. Eso me garantizaba tener una API, una
base de datos y un frontend que hicieran algo de verdad, sin meterme en un proyecto tan
grande que después no pudiera sostener durante todo el semestre, que es hasta donde
tengo que llevar esta misma app.

## Imágenes base elegidas

| Etapa | Imagen | Por qué |
|---|---|---|
| Backend build | `mcr.microsoft.com/dotnet/sdk:8.0-alpine` | Trae el compilador y NuGet. Solo se usa para compilar. |
| Backend runtime | `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` | Solo el runtime de ASP.NET, sin compilador. |
| Frontend build | `node:22-alpine` | Necesario para `npm ci` y `vite build`. |
| Frontend runtime | `nginx:1.27-alpine` | Una SPA compilada son archivos estáticos: no hace falta Node para servirlos. |

Elegí las variantes **alpine** en los cuatro casos porque son notablemente más chicas
que las basadas en Debian. En el caso de .NET esto es posible porque el proyecto ya
tenía `<InvariantGlobalization>true</InvariantGlobalization>` en el `.csproj`: Alpine
no incluye la librería ICU, y sin ese flag la app no arrancaría.

Todas las imágenes están fijadas a una versión concreta (`8.0-alpine`, `22-alpine`,
`1.27-alpine`, `postgres:16-alpine`) y no a `latest`, para que el build sea
reproducible y no cambie de un día para el otro sin que yo toque nada.

## Por qué multi-stage

La imagen final no necesita ni el compilador ni el código fuente: necesita solo el
resultado de compilar. El multi-stage permite usar una imagen grande para construir y
después copiar únicamente el artefacto a una imagen chica.

Resultado medido:

| Imagen final | Tamaño | Imagen usada para compilar | Tamaño |
|---|---|---|---|
| `hmt-backend:v0.1.0` | 171 MB | `dotnet/sdk:8.0-alpine` | 989 MB |
| `hmt-frontend:v0.1.0` | 73,9 MB | `node:22-alpine` | 232 MB |

El backend quedó **5,8 veces más chico** (83% menos) y el frontend **3,1 veces más
chico** (68% menos). Si hubiera usado una sola etapa, además del tamaño estaría
publicando en un registry público mi código fuente y un compilador completo, que es
superficie de ataque innecesaria.

También ordené las instrucciones por frecuencia de cambio: primero copio los archivos
de dependencias (`.csproj`, `package.json` + `package-lock.json`) y ejecuto el
restore/install, y recién después copio el código. Como Docker cachea cada capa, si
solo cambio código no vuelve a descargar dependencias. Al revés, cualquier cambio de
una línea invalidaría la caché del restore.

En el frontend uso `npm ci` en lugar de `npm install` porque instala exactamente las
versiones fijadas en `package-lock.json`, sin reinterpretar rangos de versiones. Eso
hace que el build sea reproducible.

## Persistencia de datos

La base usa un **volumen nombrado** (`pgdata`) montado en
`/var/lib/postgresql/data`. Los datos viven en un espacio administrado por Docker,
fuera del contenedor.

Sin el volumen, los datos quedarían en la capa de escritura del contenedor, que es
efímera: al eliminar el contenedor desaparecerían. Con el volumen, `docker compose
down` destruye los contenedores pero los datos sobreviven, y al volver a levantar el
sistema el contenedor nuevo se los encuentra. Solo `docker compose down -v` borra
también el volumen.

Lo verifiqué explícitamente en los dos sentidos (ver `evidencias.md`):

- Con `docker compose down`: cargué registros, destruí los contenedores, confirmé con
  `docker ps` que no quedaba ninguno y con `docker volume ls` que el volumen seguía
  existiendo, y al volver a levantar los registros estaban intactos.
- Con `docker compose down -v`: el volumen desapareció de `docker volume ls`, y al
  volver a levantar el sistema PostgreSQL se inicializó de cero. La aplicación funciona
  igual pero sin ningún registro: los datos se perdieron de forma definitiva.

**Qué persiste y qué no.** Persiste únicamente lo que está en el volumen: los datos de
PostgreSQL. No persiste nada de lo que las aplicaciones escriban dentro del contenedor
(esa capa se descarta al eliminarlo), ni la configuración, que se vuelve a inyectar por
variables de entorno en cada arranque. Los contenedores son descartables a propósito:
el estado vive afuera.

## Cómo se comunican los servicios

Los servicios se alcanzan **por nombre**, no por IP. Docker levanta una red para el
proyecto y su DNS interno resuelve `db` y `backend` a la IP del contenedor
correspondiente. Usar una IP fija no serviría: cambia cada vez que se recrea un
contenedor.

El frontend pide siempre a rutas relativas (`/api/...`). Quien traduce ese `/api`
hacia el backend es nginx, con un `proxy_pass http://backend:8080`. No puede ser
`localhost` porque el navegador corre en la máquina del usuario, no dentro de la red
de Docker: `localhost` para el navegador es la PC del usuario, no el contenedor.

El `nginx.conf` también tiene `try_files $uri $uri/ /index.html`, necesario porque las
rutas de la SPA (por ejemplo `/records`) las maneja React Router en el navegador y no
existen como archivos en el disco. Sin esa regla, recargar la página en `/records`
daría 404.

## Arranque ordenado: depends_on + healthcheck

`depends_on` por sí solo garantiza el **orden de arranque**, no que el servicio esté
listo. PostgreSQL tarda unos segundos en aceptar conexiones después de que el
contenedor arranca, y el backend crea las tablas al iniciar (`EnsureCreated()`): si
arrancara antes, se caería.

Por eso uso `depends_on` con `condition: service_healthy` y un `healthcheck` con
`pg_isready` en la base. El frontend a su vez espera al backend, porque nginx resuelve
el nombre `backend` al arrancar y no levanta si todavía no existe.

## Manejo de secretos

Las credenciales de la base están en un archivo `.env` que **no se versiona** (está
en `.gitignore`). En el repositorio queda `.env.example`, que documenta qué variables
hay que definir pero sin valores reales.

El motivo es que subir credenciales a un repositorio público es un incidente de
seguridad difícil de revertir: aunque después las borres, quedan para siempre en el
historial de git y hay que rotarlas igual.

En el `.dockerignore` del backend también excluí `appsettings.Development.json`, que
tiene la connection string de desarrollo, para que ese archivo no viaje dentro de la
imagen que publico. Dentro del contenedor la connection string llega por la variable
de entorno `ConnectionStrings__Default`, que pisa lo que diga la configuración de los
archivos.

Esto resuelve el problema para desarrollo local, pero no es una solución de
producción: el `.env` sigue siendo un archivo en texto plano en la máquina. En un
entorno real esto se maneja con un gestor de secretos del pipeline o de la plataforma.

## Publicación en el registry

Publiqué las dos imágenes en GitHub Container Registry con versionado semántico
`v0.1.0`:

- `ghcr.io/2319555-blason/hmt-backend:v0.1.0`
- `ghcr.io/2319555-blason/hmt-frontend:v0.1.0`

Las marqué como públicas y verifiqué que se pueden descargar sin autenticación
(`docker logout ghcr.io` y después `docker pull`).

Además del `docker-compose.yml` que construye desde el código, agregué
`docker-compose.registry.yml`, que no tiene ninguna clave `build`: solo baja las
imágenes publicadas. Esa es la diferencia entre "compilá el sistema en tu máquina" y
"traé el artefacto ya construido": un servidor de producción no tiene el código fuente
ni el SDK, baja la imagen y la corre. La imagen es el artefacto entregable.

## Problemas encontrados y cómo los resolví

**1. El puerto 8080 respondía a la aplicación equivocada.**
Después de levantar el compose, `http://localhost:8080` mostraba una página en blanco.
Investigando, la respuesta traía la cabecera `Server: Kestrel` y devolvía 404 en `/`:
o sea, no estaba respondiendo nginx sino el backend .NET que yo había dejado corriendo
nativamente con `dotnet run` cuando probé la app antes de containerizarla, desde la
carpeta original del proyecto. Docker había reportado que ató el puerto sin error,
pero el proceso que ya lo tenía se quedaba con las conexiones a `localhost`.
Lo confirmé con `Get-NetTCPConnection -LocalPort 8080` (había dos procesos:
`com.docker.backend` y `HomeMaintenanceApi`), cerré el proceso viejo y volví a levantar
el compose. Me sirvió tener el backend publicado en el puerto 5080: pude comprobar que
el contenedor respondía bien por su cuenta y que el problema era del host, no de mi
imagen.

**2. El push a ghcr.io fallaba con un error genérico.**
Las dos imágenes subieron todas sus capas correctamente y el push fallaba recién al
final, al escribir el manifiesto, con `error from registry: unknown`. Pasó con las dos
imágenes. La solución fue simplemente reintentar el push: la segunda vez las capas ya
estaban subidas y el manifiesto se guardó bien (el registry devolvió el digest). Es un
error transitorio conocido de ghcr.io, no un problema de permisos: si hubiera sido de
permisos, las capas tampoco habrían subido.

**3. Confusión inicial con el panel vacío.**
Después de cargar registros y reiniciar el sistema, el panel principal seguía diciendo
que no había tareas. No era un problema de persistencia: el panel solo muestra tareas
vencidas o próximas a vencer, y todos mis registros tenían fecha de hoy con intervalos
de 6 a 24 meses. Los datos estaban, se veían en la pestaña de registros.

## Declaración de uso de IA

**Usé asistencia de IA (Claude) de forma sustancial en este TP.** Concretamente:

- Redacción de `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`,
  los dos `.dockerignore`, `docker-compose.yml`, `docker-compose.registry.yml`,
  `.env.example` y la actualización del `README.md`.
- Diagnóstico del problema del puerto 8080 y del error de push a ghcr.io.
- Estructura y redacción de este documento y de `evidencias.md`.

Cómo lo verifiqué:

- Ejecuté yo misma todos los comandos: los builds, el `docker compose up`, la prueba
  de persistencia, el tagueo, el push y la verificación de descarga anónima. Ninguna
  salida de este trabajo está copiada de la IA: todas las capturas de `evidencias.md`
  son de mi máquina.
- Pedí que cada archivo viniera comentado línea por línea y con la explicación del
  porqué de cada decisión, no solo el código. Lo que no entendía lo repregunté antes
  de seguir.
- Verifiqué el resultado contra el comportamiento real del sistema: que la app
  responde, que el proxy `/api` funciona, que entrar directo a `/records` no da 404,
  que los datos sobreviven al `down`, y los tamaños de imagen medidos con
  `docker images`.
