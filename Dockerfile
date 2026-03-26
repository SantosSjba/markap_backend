# ============================================================
# Stage 1 – Install ALL dependencies (dev + prod)
#            Needed for: nest build, prisma generate,
#            and tsconfig-paths at runtime (path aliases)
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci


# ============================================================
# Stage 2 – Build (TypeScript → JavaScript)
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the target platform (linux/alpine)
RUN npx prisma generate

# Compile TypeScript
RUN npm run build


# ============================================================
# Stage 3 – Production image
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

# dumb-init: proper PID 1 for signal forwarding (SIGTERM, etc.)
RUN apk add --no-cache dumb-init

# --- Runtime dependencies ---
# We install ALL deps (not just --omit=dev) because:
#   • tsconfig-paths is a devDependency but REQUIRED at runtime
#     to resolve @application/*, @infrastructure/*, @common/*,
#     @config/* aliases that tsc does NOT rewrite in the output JS.
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Overwrite the Prisma client with the one compiled for this
# exact platform/architecture in the builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

# tsconfig.json is read by tsconfig-paths at startup to resolve aliases
COPY tsconfig.json ./

# Pre-create uploads directory (main.ts also does this, but belt-and-suspenders)
RUN mkdir -p uploads

# Copy and prepare startup script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
