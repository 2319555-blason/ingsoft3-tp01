# Home Maintenance Tracker

Aplicación para registrar el historial de mantenimiento del hogar y ver qué tareas
están vencidas o próximas a vencer, calculadas a partir de los registros cargados.

Proyecto de la materia **Ingeniería de Software III** (UCC, 2026).

| Componente | Tecnología |
|---|---|
| Backend | .NET 8 (minimal API) + Entity Framework Core |
| Frontend | React 18 + Vite, servido por nginx |
| Base de datos | PostgreSQL 16 |
| Orquestación | Docker Compose |

Imágenes publicadas en GitHub Container Registry:

- `ghcr.io/2319555-blason/hmt-backend:v0.1.0`
- `ghcr.io/2319555-blason/hmt-frontend:v0.1.0`

---

## Requisitos

Solo **Docker Desktop** (incluye Docker Compose). No hace falta instalar .NET,
Node ni PostgreSQL: todo corre dentro de contenedores.

---

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/2319555-blason/ingsoft3-tp01.git
cd ingsoft3-tp01
```

### 2. Crear el archivo de variables de entorno

El archivo `.env` no está versionado porque contiene credenciales. Copiá la
plantilla y completá los valores:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Después editá `.env` y cambiá `POSTGRES_PASSWORD` por una contraseña propia.

### 3. Levantar el sistema

Hay dos formas. Elegí una.

**Opción A — construir las imágenes desde el código fuente:**

```bash
docker compose up -d --build
```

**Opción B — usar las imágenes ya publicadas en el registry** (no compila nada,
solo las descarga):

```bash
docker compose -f docker-compose.registry.yml up -d
```

### 4. Verificar que arrancó

```bash
docker compose ps
```

Los tres servicios deben figurar como `running`, y `db` y `backend` además como
`healthy`. El backend tarda unos segundos porque espera a que la base esté lista.

---

## Uso

| Qué | Dónde |
|---|---|
| Aplicación web | http://localhost:8080 |
| API (health check) | http://localhost:5080/health |
| API (registros) | http://localhost:5080/api/records |

La base de datos **no** publica ningún puerto al host: solo se la alcanza desde
la red interna de Docker.

Las tablas se crean solas la primera vez que arranca el backend.

---

## Apagar el sistema

```bash
# Detiene y elimina los contenedores. Los datos se conservan.
docker compose down

# Igual que el anterior, pero además BORRA el volumen y con él todos los datos.
docker compose down -v
```

---

## Estructura del proyecto

```
.
├── backend/                    API .NET 8
│   ├── Dockerfile              multi-stage: SDK para compilar, aspnet para correr
│   └── .dockerignore
├── frontend/                   SPA React + Vite
│   ├── Dockerfile              multi-stage: node para compilar, nginx para servir
│   ├── nginx.conf              ruteo de la SPA y proxy /api hacia el backend
│   └── .dockerignore
├── docker-compose.yml          construye las imágenes localmente
├── docker-compose.registry.yml consume las imágenes publicadas en ghcr.io
├── .env.example                plantilla de variables (versionada)
├── .env                        credenciales reales (NO versionado)
├── decisiones.md               justificación de las decisiones técnicas
└── evidencias.md               capturas y salidas que prueban el funcionamiento
```

---

## Cómo se comunican los servicios

```
navegador
    │  http://localhost:8080
    ▼
frontend (nginx)
    ├── /            → archivos estáticos de la SPA compilada
    └── /api/*       → proxy hacia http://backend:8080
                            │
                            ▼
                       backend (.NET)
                            │  Host=db
                            ▼
                       db (PostgreSQL) ── volumen pgdata
```

El navegador nunca habla directo con el backend: le pide todo al mismo origen
del que descargó la SPA, y nginx reenvía lo que empieza con `/api`. Los nombres
`backend` y `db` los resuelve el DNS interno de Docker.

---

## Desarrollo sin Docker

Para trabajar sobre el código con recarga automática, se puede correr cada parte
por separado. En ese caso el proxy de `/api` lo hace Vite en vez de nginx
(ver `frontend/vite.config.js`).

```bash
# Base de datos
docker run -d --name pg-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 postgres:16-alpine

# Backend  (usa la connection string de appsettings.Development.json)
cd backend && dotnet restore && dotnet run

# Frontend
cd frontend && npm install && npm run dev
```

> Si vas a levantar el sistema con Docker después de hacer esto, acordate de
> cerrar el backend local: ocupa el puerto 8080 y le gana al contenedor.
