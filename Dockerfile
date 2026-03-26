FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar todas las dependencias (incluyendo dev)
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript → dist/
RUN npm run build

RUN mkdir -p uploads

EXPOSE 3000

# Ejecutar migraciones y arrancar en producción
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node -r tsconfig-paths/register dist/main"]
