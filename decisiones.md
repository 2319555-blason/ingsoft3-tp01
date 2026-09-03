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

Elegí este dominio porque es un problema concreto de mi
casa: nunca nos acordamos de cuándo fue el último service de la caldera o la última
revisión de las cañerías, y terminamos enterándonos cuando algo se rompe.


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
estaban subidas y el manifiesto se guardó bien. 

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


  # Decisiones — TP3: Planificación y trazabilidad

## Duración del sprint: 2 semanas

Elegí sprints de dos semanas y los alineé con el calendario de la materia. La cursada
avanza a razón de una clase por semana y la primera defensa (P1) cubre los TP1 a TP4,
así que dos sprints de dos semanas cubren ese bloque completo y cada sprint cierra con
entregas concretas.

## Límite de trabajo en progreso: 2
Puse el límite en 2 en la columna *In Progress*. La regla de arranque es **cantidad de
personas más uno**, y trabajo sola.

El "más uno" no es un número arbitrario: es la válvula para cuando algo queda esperando
por fuera de mí y necesito avanzar en
otra cosa sin quedarme trabada. Sin ese margen el límite sería tan estricto que lo
estaría rompiendo todo el tiempo; con más margen dejaría de limitar.

Comprobé además cómo se comporta la herramienta: al pasar el límite, GitHub pone el
contador de la columna en rojo pero te deja pasar igual.

## Diagnóstico de la historia mal escrita

La historia del ejercicio era: *"Como desarrollador quiero crear la tabla usuarios para
guardar los datos"*.

**Por qué está mal escrita:** es una tarea técnica disfrazada de historia. Tiene la
forma *Como… quiero… para…* pero ninguna de las tres partes funciona. El rol está
puesto para llenar el molde: nadie "quiere" una tabla, y menos un usuario. La capacidad
no es un incremento de valor observable por nadie fuera del equipo, es un paso técnico
interno. Y el beneficio es circular: "para guardar los datos" repite el qué en vez de
justificar por qué vale la pena hacerla. De INVEST, viola sobre todo la V de *Valiosa*
(nadie afuera del equipo la pide) y la T de *Testeable*: no se le pueden escribir
criterios de aceptación verificables, porque "la tabla existe" no demuestra que alguien
pueda hacer algo nuevo.

**Cómo la reescribiría:** subiría un nivel, hasta el valor que esa tabla habilita, y
dejaría la tabla como tarea técnica adentro. Por ejemplo: *"Como usuaria quiero que mis
registros de mantenimiento queden guardados para no perder el historial cuando cierro
la aplicación"*, con criterios como "un registro creado sigue estando después de
reiniciar la aplicación" y "el listado los muestra ordenados por fecha". Ahí sí hay un
rol real, un valor observable y algo que se puede verificar. "Crear la tabla usuarios"
pasa a ser una de las tareas que la implementan.

## Problemas encontrados y cómo los resolví

**El pull request se mergeó sin cerrar la tarea.** Después de mergear el primer PR que
agregaba `ci.yml`, el issue de la tarea seguía abierto y su sección *Development* decía
"No branches or pull requests": el PR nunca había quedado enlazado. El motivo era que
el `Closes #11` no había llegado al campo de **descripción** del pull request — quedó
la descripción que GitHub genera sola. La palabra clave solo funciona en la descripción
del PR o en un mensaje de commit, en el título o en un comentario posterior, no.

No se podía arreglar editando el PR ya mergeado, porque el cierre automático se dispara
en el momento del merge. Lo resolví con un segundo pull request.

**El proyecto hay que crearlo desde la web.** Creado por comando, el tablero nace vacío,
porque `gh project create` no elige ningún repositorio y no queda configurado el
workflow de auto-add. Creándolo desde la web, con la casilla *Import items from
repository* tildada, los issues entran solos. Se nota en el número de workflows: siete
contra seis.


## Declaración de uso de IA
- Adaptación de los comandos `gh` de la guía a mi aplicación, y redacción del cuerpo de
  las dos tareas y del bug (la guía los describe en prosa pero no da el comando armado).
- Redacción de este documento a partir de las decisiones que tomé yo.
  
Cómo lo verifiqué: ejecuté yo todos los comandos y revisé el resultado en GitHub
después de cada paso.
El comportamiento en vez de darlo por sentado: pasé el límite de la columna para ver
que GitHub avisa pero no bloquea, y confirmé el cierre automático mirando que el issue
quedara enlazado al pull request y la tarjeta se moviera sola a Done.


# Decisiones — TP4: CI, Pipelines as Code

## Estructura del pipeline

El workflow tiene **dos jobs**: `build-backend` y `build-frontend`. Uno por cada
Dockerfile que tiene la aplicación desde el TP2.

**Por qué separados y no uno solo:** son dos artefactos independientes. El backend no
necesita nada de lo que produce el frontend ni al revés, así que no hay ninguna razón
para encadenarlos. Al estar en jobs distintos, GitHub los corre **en paralelo**, cada
uno en su propia máquina virtual: el tiempo total es el del job más lento, no la suma
de los dos.

Como efecto secundario, cuando algo falla el diagnóstico es inmediato: se ve cuál de
los dos se puso en rojo sin tener que leer el log. En la demostración del gate, el
backend falló y el frontend siguió en verde.

## Qué cachea el pipeline

Lo que se cachea son **las capas de las imágenes Docker**, no dependencias sueltas. Se
guardan en el cache de GitHub Actions, que no es el Docker de mi máquina ni
el del runner: ese nace vacío en cada corrida y se destruye al terminar.

**Qué se reutilizó, medido en la segunda corrida del backend:** 7 capas con `CACHED`,
entre ellas el `COPY` del `.csproj`, el `dotnet restore`, el `COPY` del código y el
`dotnet publish`. El step de build pasó de 31 a 4 segundos y el job entero de 40 a 19.

**Qué pasa si el cache desaparece:** nada, salvo que las corridas tardan más. El cache
es una **optimización**, no una dependencia: la plataforma lo desaloja cuando quiere y
tiene límite de tamaño. Mi pipeline construye igual sin él, desde cero, como hizo en la
primera corrida. Si fallara sin cache no tendría un cache, tendría una dependencia
escondida, y eso sería un bug.


## Por qué el pipeline construye con el Dockerfile

El workflow no tiene una sola línea de .NET ni de Node. No sabe cómo se compila la
aplicación: eso lo sabe el Dockerfile que escribí en el TP2.

Si el pipeline compilara por su cuenta con `dotnet build` y `npm run build` tendría dos
definiciones de build: la del pipeline y la del Dockerfile. Tarde o temprano divergen
—se agrega un flag en una y se olvida en la otra— y el resultado es peor que no tener
CI, porque estaría verificando una compilación distinta de la que después se despliega.
Un pipeline en verde dejaría de significar que lo que va a producción funciona.

Construyendo con el Dockerfile, lo que el pipeline verifica es exactamente el mismo
artefacto que después se levanta con `docker compose`. Y como efecto secundario, este
workflow le serviría a cualquier compañero con otro stack: lo único que cambiaría es su
Dockerfile.


## Problemas encontrados y cómo los resolví

**La primera corrida no mostraba ningún `CACHED`.** Busqué la palabra en el log y el
contador daba 0, y pensé que el cache estaba mal configurado. No lo estaba: esa primera
corrida es la que **guarda** las capas, no la que las reutiliza — en el log se ve
`importing cache manifest` sin encontrar nada, porque no había nada guardado todavía.
Lo resolví disparando una segunda corrida sobre el mismo PR con un commit adicional, y
ahí aparecieron las 7 capas reutilizadas.


**Busqué el código roto en `main` y no estaba.** Cuando fui a arreglar el `using` que
no existe, abrí `backend/Program.cs` y la línea no aparecía. No era un error: estaba
mirando el archivo en `main`, y la rotura vivía solo en la rama del pull request.
Justamente por eso el gate sirve — el código que no compila **nunca llegó a `main`**.
Tuve que cambiar el selector de rama para editarlo.


## Declaración de uso de IA
- Redacción del `ci.yml` a partir del ejemplo de la guía, adaptado a mis dos Dockerfiles.
- Redacción de este documento a partir de lo que hice y decidí.


Cómo lo verifiqué: ejecuté yo cada paso y comprobé el resultado en la interfaz de
GitHub antes de seguir — que los dos jobs corrieran en paralelo y en verde, que el log
mostrara las capas con `CACHED` y cuáles, que los dos checks aparecieran como `Required`
en el pull request, que el merge quedara efectivamente bloqueado con el build en rojo, y
que el badge llevara al historial de corridas al hacerle clic. La secuencia completa de
rojo a verde está registrada en el PR #20, con sus dos commits y sus corridas.

