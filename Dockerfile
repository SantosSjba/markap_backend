FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev)
RUN pnpm install --frozen-lockfile

# Generar Prisma Client (multi-file schema vía prisma.config.ts)
RUN pnpm exec prisma generate

# Copiar código fuente
COPY . .

EXPOSE 4001

# Modo desarrollo con hot-reload
CMD ["pnpm", "run", "start:dev"]
