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
# TP5: también el .csproj de los tests, para que su restore quede cacheado en esta capa.
# (Sin esto la etapa de tests bajaría los paquetes en CADA corrida.)
COPY HomeMaintenanceApi.Tests/HomeMaintenanceApi.Tests.csproj HomeMaintenanceApi.Tests/
RUN dotnet restore HomeMaintenanceApi.csproj
RUN dotnet restore HomeMaintenanceApi.Tests/HomeMaintenanceApi.Tests.csproj

# Recién ahora el resto del código fuente (esto cambia en cada commit).
COPY . .

# "publish" compila en modo Release y deja en /app/publish solo lo que
# hace falta para ejecutar (los .dll), sin código fuente ni herramientas.
# --no-restore porque los paquetes ya se restauraron en la capa anterior.
RUN dotnet publish HomeMaintenanceApi.csproj -c Release -o /app/publish --no-restore

# ============================================================
# ETAPA 2 — "test" (TP5): corre los tests y mide la cobertura.
# Arranca DESDE "build": hereda el SDK, el código y los paquetes ya
# restaurados, así que testea el mismo código que se compiló.
# No va WORKDIR: hereda /src de la etapa build.
# ENTRYPOINT (y no RUN): los tests corren cuando el pipeline hace
# "docker run", no al construir; así los resultados salen por el volumen.
#   /p:CollectCoverage=true  → coverlet.msbuild mide la cobertura...
#   /p:Threshold=90          → ...y FALLA si queda por debajo de 90%
#   /p:ThresholdType=line%2cbranch → sobre líneas Y ramas (%2c = coma)
# Qué entra en la cuenta: las clases marcadas [ExcludeFromCodeCoverage]
# (Program, DTOs, modelo, DbContext, repositorio EF) quedan afuera.
# La imagen final NO se lleva nada de esta etapa.
# ============================================================
FROM build AS test
ENTRYPOINT ["dotnet", "test", "HomeMaintenanceApi.Tests/HomeMaintenanceApi.Tests.csproj", \
            "/p:CollectCoverage=true", "/p:Threshold=90", "/p:ThresholdType=line%2cbranch", \
            "--logger", "trx;LogFileName=tests.trx", \
            "--results-directory", "/out"]

# ============================================================
# ETAPA 3 — "runtime": la imagen final que se va a distribuir.
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
