#Dependencias del proyecto
FROM node:22-alpine AS deps

WORKDIR /usr/src/app
RUN apk add --no-cache openssl-dev 
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts
RUN npx prisma generate

#Compilar
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules
RUN npm run build
#Imagen de ejecución
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
RUN apk add --no-cache curl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /usr/src/app/dist ./dist
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma

USER appuser

ENV NODE_ENV=production
EXPOSE 3000
# Arranque
CMD ["node", "dist/main"]
