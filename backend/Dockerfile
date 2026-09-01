# ============================================================
# ETAPA 1 — "build": acá se compila.
# Usa la imagen del SDK de .NET, que trae el compilador, NuGet,
# y todo lo necesario para construir. Pesa cientos de MB.
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copiamos SOLO el .csproj primero, antes que el código.
# Docker guarda en caché el resultado de cada instrucción (cada "capa").
# Si el .csproj no cambió, reutiliza la capa del restore y no vuelve
# a descargar los paquetes NuGet. Si copiáramos todo junto, cualquier
# cambio de una línea de C# invalidaría el restore y bajaría todo de nuevo.
COPY HomeMaintenanceApi.csproj ./
RUN dotnet restore HomeMaintenanceApi.csproj

# Recién ahora el resto del código fuente (esto cambia en cada commit).
COPY . .

# "publish" compila en modo Release y deja en /app/publish solo lo que
# hace falta para ejecutar (los .dll), sin código fuente ni herramientas.
# --no-restore porque los paquetes ya se restauraron en la capa anterior.
RUN dotnet publish HomeMaintenanceApi.csproj -c Release -o /app/publish --no-restore

# ============================================================
# ETAPA 2 — "runtime": la imagen final que se va a distribuir.
# Solo el runtime de ASP.NET (mucho más chica que el SDK).
# Todo lo de la etapa anterior se descarta menos lo que copiemos.
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Le decimos a ASP.NET en qué dirección y puerto escuchar.
# El "+" significa "todas las interfaces de red del contenedor".
# Si pusiéramos localhost, la app solo se escucharía a sí misma y
# nadie desde afuera del contenedor podría llegarle.
ENV ASPNETCORE_URLS=http://+:8080

# --from=build: traemos SOLO el resultado compilado de la etapa 1.
COPY --from=build /app/publish .

# Las imágenes de .NET 8 incluyen un usuario sin privilegios llamado "app".
# Correr como root dentro del contenedor es un riesgo innecesario.
USER app

# Documenta qué puerto usa la app. No publica nada por sí solo:
# la publicación al host se define en el docker-compose.
EXPOSE 8080

# El proceso que arranca cuando nace el contenedor.
ENTRYPOINT ["dotnet", "HomeMaintenanceApi.dll"]
