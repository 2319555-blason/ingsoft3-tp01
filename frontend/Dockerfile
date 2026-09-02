# ============================================================
# ETAPA 1 — "build": compila la SPA.
# La imagen de node trae npm y todo lo necesario para construir.
# Nada de esto hace falta después: el resultado de compilar un
# frontend son archivos estáticos, no un proceso de Node corriendo.
# ============================================================
FROM node:22-alpine AS build
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
# ETAPA 2 — "runtime": un servidor web sirviendo archivos estáticos.
# Acá NO hay Node ni node_modules. Solo nginx y la carpeta dist.
# ============================================================
FROM nginx:1.27-alpine AS runtime

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
