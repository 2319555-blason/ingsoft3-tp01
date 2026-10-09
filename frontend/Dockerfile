# TP6: las imágenes base se bajan del espejo público de Amazon (ECR Public), que replica las
# imágenes oficiales de Docker Hub sin su límite de descargas anónimas. Desde los runners de
# GitHub, Docker Hub respondía "429 Too Many Requests" al bajar nginx.
# ============================================================
# ETAPA 1 — "build": compila la SPA.
# La imagen de node trae npm y todo lo necesario para construir.
# Nada de esto hace falta después: el resultado de compilar un
# frontend son archivos estáticos, no un proceso de Node corriendo.
# ============================================================
FROM public.ecr.aws/docker/library/node:22-alpine AS build
WORKDIR /app

# Mismo truco de caché que en el backend: primero los manifiestos
# de dependencias, después el código fuente.
COPY package.json package-lock.json ./

# "npm ci" (clean install) instala exactamente las versiones fijadas
# en package-lock.json. A diferencia de "npm install", no actualiza el
# lock ni reinterpreta rangos de versiones: hace que el build sea
# reproducible, hoy y dentro de seis meses.
RUN npm ci

COPY . .

# Vite compila y deja el sitio listo en /app/dist:
# HTML, CSS y JS minificados.
RUN npm run build

# ============================================================
# ETAPA 2 — "test" (TP5): corre vitest con cobertura y umbral.
# Arranca DESDE "build": ya tiene Node y TODAS las dependencias
# (npm ci sin --omit=dev, así que vitest está). Si la cobertura
# queda bajo el umbral de vite.config.js, vitest sale con error.
# La imagen final (nginx) no se lleva nada de esto.
# ============================================================
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ============================================================
# ETAPA 3 — "runtime": un servidor web sirviendo archivos estáticos.
# Acá NO hay Node ni node_modules. Solo nginx y la carpeta dist.
# ============================================================
FROM public.ecr.aws/docker/library/nginx:1.27-alpine AS runtime

# Nuestra configuración reemplaza el sitio por defecto de nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Traemos SOLO el resultado del build de la etapa anterior.
# El código fuente, node_modules y npm se descartan con la etapa 1.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# "daemon off" mantiene a nginx en primer plano.
# Un contenedor vive mientras viva su proceso principal: si nginx se
# fuera al fondo, el contenedor se apagaría al instante.
CMD ["nginx", "-g", "daemon off;"]
