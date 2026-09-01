# Home Maintenance Tracker

Aplicación de 3 páginas para registrar el historial de mantenimiento del hogar y ver
recomendaciones de tareas pendientes o próximas a vencer, calculadas a partir de los
registros existentes.

- **Backend**: .NET 8 (minimal API) + Entity Framework Core + PostgreSQL
- **Frontend**: React + Vite
- **Base de datos**: PostgreSQL

## Instalación

```
git clone https://github.com/2319555-blason/ingsoft3-tp01.git
cd ingsoft3-tp01
```

## Páginas

1. **Panel** (`/`) — sugerencias de mantenimiento vencido o próximo a vencer.
2. **Registros** (`/records`) — listado de todo el historial, con editar/borrar.
3. **Nuevo/Editar registro** (`/records/new`, `/records/:id/edit`) — alta y edición.

## Correr en local (sin Docker, todavía)

### 1. Base de datos

Levantá un PostgreSQL como contenedor (no hace falta instalarlo):

```
docker run -d --name pg-tp2 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```
cd backend
dotnet restore
dotnet run
```

La API queda en `http://localhost:8080` (probá `curl http://localhost:8080/health`).
Las tablas se crean solas al arrancar (no hace falta correr ningún script).

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

La SPA queda en `http://localhost:5173`. Las llamadas a `/api/...` las redirige
automáticamente el proxy de Vite hacia `http://localhost:8080` (ver `vite.config.js`).

## Notas de diseño

- El campo `Category` y `Title` de un registro definen una "tarea" (ej. Plomería /
  Revisión de cañerías). El panel toma el registro más reciente de cada tarea y calcula
  cuándo vuelve a tocar según el intervalo (en meses) que cargaste.
- No hay asistente conversacional ni integración con IA: las sugerencias son reglas
  simples de fechas, calculadas en el backend (`Services/SuggestionService.cs`).
