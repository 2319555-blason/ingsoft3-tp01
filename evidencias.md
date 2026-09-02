# Evidencias — TP1

## 1. Push directo a main rechazado
<img width="747" height="445" alt="image" src="https://github.com/user-attachments/assets/7d906301-a9f0-4b9c-ae55-ab36671d261a" />
Acá no me deja hacer un push por más que sea la dueña del repo, tiene que pasar sí o sí por un PR, no puede ir directo al main.

## 2. El PR de la rama B no se puede mergear: conflicto
<img width="760" height="323" alt="image" src="https://github.com/user-attachments/assets/ade8ae2f-c565-48ab-a4fc-049059e743d3" />
Acá se mergeó correctamente la rama A, pero luego al mergear la rama B claramente hubo conflicto porque dos personas están trabajando sobre el mismo archivo, es decir, trabajando en paralelo.

## 3. Resolved conflicts y marcadores
<img width="762" height="442" alt="image" src="https://github.com/user-attachments/assets/b0e89ed8-b378-4318-85a9-7b29e3e49a49" />
Acá para resolver el conflicto debo elegir qué versión se queda, cuál es el contenido final básicamente.

## 4. Versionar la entrega: tag y release
<img width="755" height="697" alt="image" src="https://github.com/user-attachments/assets/f4991ded-988b-4502-82d2-bae0703312c8" />
Acá se crea un tag que marca un commit, y se define el release que describe qué es lo que incluye esa versión.

---

# Evidencias — TP2

## 1. El sistema completo levantando con un solo comando

<img width="1487" height="371" alt="image" src="https://github.com/user-attachments/assets/0b8e5609-f380-49b3-a6ee-c6ba54d9f2ba" />


Los tres servicios quedan en `running`, y `db` y `backend` además en `healthy`, que es
lo que confirma que sus healthchecks están pasando. El backend tarda unos segundos más
que la base porque espera a que esta esté lista antes de arrancar.

## 2. La aplicación funcionando end-to-end

<img width="1600" height="787" alt="image" src="https://github.com/user-attachments/assets/e2daec0e-289c-44e5-b774-a2b588e2f6d2" />


Esta pantalla recorre el sistema entero: el navegador pide la página a nginx, la SPA
pide `/api/records`, nginx lo proxea al backend por su nombre de red, el backend
consulta PostgreSQL y devuelve los datos. Si cualquiera de los tres contenedores o la
red entre ellos fallara, esta tabla no se llenaría.

## 3. Persistencia (1/3): `down` destruye los contenedores, el volumen queda

<img width="1437" height="682" alt="image" src="https://github.com/user-attachments/assets/86fbfca0-71cc-4c5b-ad10-5b2347fa0eca" />


`docker compose down` elimina los tres contenedores y la red: no quedan pausados, dejan
de existir, y `docker ps` lo confirma vacío. Sin embargo el volumen
`ingsoft3-tp01_pgdata` sigue listado. Los datos nunca estuvieron dentro del contenedor.

## 4. Persistencia (2/3): al volver a levantar, los datos siguen

<img width="1600" height="803" alt="image" src="https://github.com/user-attachments/assets/d142793e-740b-4e68-854b-ad6555a48cb4" />


El contenedor de PostgreSQL es **uno nuevo**, creado desde cero. Los registros siguen
ahí porque al montar el volumen se encuentra los datos que dejó el contenedor anterior.
Esto es lo que demuestra la persistencia.

## 5. Persistencia (3/3): `down -v` sí borra los datos

<img width="947" height="258" alt="image" src="https://github.com/user-attachments/assets/945adff7-3b53-4153-baaf-a1a9f8694e0d" />


<img width="1600" height="810" alt="image" src="https://github.com/user-attachments/assets/57736afc-16b0-4e38-a13a-7da0594787f1" />


La opción `-v` le dice a Docker que
además de los contenedores elimine los volúmenes declarados en el compose. El
`docker volume ls` filtrado ya no devuelve nada: `ingsoft3-tp01_pgdata` dejó de existir.

Al volver a levantar el sistema, Docker crea un volumen nuevo y vacío, PostgreSQL se
inicializa desde cero y el backend vuelve a crear las tablas. La aplicación funciona
perfectamente, pero sin ningún registro: los datos anteriores se perdieron de forma
definitiva.

La diferencia entre los puntos 3 y 5 es exactamente la diferencia entre `down` y
`down -v`, y es la razón por la que hay que tener mucho cuidado con esa opción en un
entorno real.

## 6. Comparación de tamaños: imagen final vs imagen de compilación

<img width="1273" height="201" alt="image" src="https://github.com/user-attachments/assets/a85c6858-380d-41a2-8320-0f5bbe67e011" />


| Imagen final | Tamaño | Imagen usada para compilarla | Tamaño | Reducción |
|---|---|---|---|---|
| `hmt-backend:v0.1.0` | 171 MB | `dotnet/sdk:8.0-alpine` | 989 MB | 5,8× más chica (83%) |
| `hmt-frontend:v0.1.0` | 73,9 MB | `node:22-alpine` | 232 MB | 3,1× más chica (68%) |

Esta es la justificación medible del multi-stage. Además del tamaño, las imágenes
finales no contienen el código fuente ni las herramientas de compilación.

## 7. Imágenes publicadas y accesibles sin autenticación

<img width="1041" height="241" alt="image" src="https://github.com/user-attachments/assets/7dcc21e0-2a78-4b20-9045-4ffefb93fbf4" />


Después de cerrar sesión en el registry, ambas imágenes se resuelven y descargan igual.
Si fueran privadas, el pull cortaría con `denied` antes de mostrar ningún digest. Eso
prueba que están publicadas como públicas.

Imágenes:

- `ghcr.io/2319555-blason/hmt-backend:v0.1.0`
  <img width="1102" height="430" alt="image" src="https://github.com/user-attachments/assets/dcdec3b2-6780-450e-b0b7-537c6506cea9" />

- `ghcr.io/2319555-blason/hmt-frontend:v0.1.0`
  <img width="1425" height="523" alt="image" src="https://github.com/user-attachments/assets/36dc47fd-f4f7-4608-aaac-8e82ee25e20a" />


## 8. El sistema levantado desde las imágenes del registry

<img width="1478" height="326" alt="image" src="https://github.com/user-attachments/assets/8628a3ca-b09e-475a-a838-b1cfee05cb79" />


Acá el sistema arranca sin compilar nada: `docker-compose.registry.yml` no tiene
ninguna clave `build`, solo descarga las imágenes publicadas. En la columna `IMAGE` se
ve `ghcr.io/2319555-blason/...` en lugar de los nombres locales. Es la forma en que
levantaría el sistema una máquina que no tiene el código fuente.
