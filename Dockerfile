FROM node:20-alpine

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev)
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY . .

EXPOSE 4001

# Modo desarrollo con hot-reload
CMD ["npm", "run", "start:dev"]