# Etapa 1: Builder - Instalar dependencias y hacer build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Argumento para la URL del API (se pasa desde docker-compose)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Production - Servir con nginx
FROM nginx:alpine AS production

# Copiar los archivos construidos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 5173
EXPOSE 5173

# Nginx se ejecuta automáticamente
CMD ["nginx", "-g", "daemon off;"]
