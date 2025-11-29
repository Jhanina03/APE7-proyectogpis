# Dependencias
FROM node:22-alpine AS deps
WORKDIR /usr/src/frontend
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Build
FROM node:22-alpine AS build
WORKDIR /usr/src/frontend
COPY --from=deps /usr/src/frontend/node_modules ./node_modules
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Imagen de producción con Nginx
FROM nginx:stable-alpine AS runner
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/frontend/dist /var/www/app
COPY nginx.conf /etc/nginx/conf.d/app.conf
EXPOSE 80
# Ejecutar
CMD ["nginx", "-g", "daemon off;"]
