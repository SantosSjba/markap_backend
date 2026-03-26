FROM node:22-alpine

WORKDIR /app

# dumb-init: proper PID 1 for signal forwarding (SIGTERM, etc.)
RUN apk add --no-cache dumb-init

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy everything (includes prisma.config.ts, tsconfig.json, src/, prisma/, etc.)
COPY . .

# Generate Prisma client for linux/alpine
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# Pre-create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
