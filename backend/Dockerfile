FROM node:20-alpine

WORKDIR /app

# Dependencias primero (aprovecha la caché de Docker)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Carpetas de archivos subidos (se montan como volúmenes en docker-compose)
RUN mkdir -p uploads storage && chown -R node:node /app

USER node
ENV NODE_ENV=production
EXPOSE 4000

# Aplica migraciones pendientes y arranca la API
CMD ["sh", "-c", "node database/migrate.js && node server.js"]
