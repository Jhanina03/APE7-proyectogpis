############################
# 1) Etapa de dependencias #
############################
FROM node:22-alpine AS deps

WORKDIR /usr/src/frontend

# Copiar solo los archivos de dependencias
COPY package*.json ./

# Instalar dependencias sin scripts ni cache
RUN npm ci --prefer-offline --no-audit

###################################
# 2) Etapa de compilación (build) #
###################################
FROM node:22-alpine AS build

WORKDIR /usr/src/frontend

# Copiar dependencias ya instaladas
COPY --from=deps /usr/src/frontend/node_modules ./node_modules

# Copiar el resto del código
COPY . .

# Variables de compilación
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build optimizado
RUN npm run build

###############################
# 3) Imagen final con Nginx   #
###############################
FROM nginx:stable-alpine AS runner

# Borrar config por defecto (opcional pero ya lo diferencia)
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar archivos optimizados del build
COPY --from=build /usr/src/frontend/dist /var/www/app

# Copiar config nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Exponer puerto de producción
EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
