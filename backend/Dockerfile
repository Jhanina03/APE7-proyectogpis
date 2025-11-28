# ========= Etapa 1: Dependencias =========
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

# Prisma requiere OpenSSL
RUN apk add --no-cache openssl-dev

# Copiar lo mínimo primero
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias sin scripts postinstall innecesarios
RUN npm ci --ignore-scripts
RUN npx prisma generate


# ========= Etapa 2: Compilación =========
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar el resto del código
COPY . .

# Copiar node_modules desde deps
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Compilar NestJS
RUN npm run build


# ========= Etapa 3: Imagen de ejecución =========
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Crear usuario seguro (diferente al de tu amigo)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar archivos necesarios desde las etapas anteriores
COPY --from=build /usr/src/app/dist ./dist
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma

USER appuser

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
