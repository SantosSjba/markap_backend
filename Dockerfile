FROM node:24-alpine AS base
WORKDIR /app
ENV NODE_OPTIONS="--experimental-require-module --max-old-space-size=4096"
# Placeholder solo para `prisma generate` durante el build
ENV DATABASE_URL=postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public
RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm exec nest build \
    && pnpm exec prisma generate \
    && pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--experimental-require-module
ENV PORT=4001
# curl: Coolify HEALTHCHECK lo necesita dentro del contenedor Alpine
RUN apk add --no-cache curl \
    && corepack enable && corepack prepare pnpm@11.5.0 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Strip CRLF (Windows) so shebang works on Alpine/Linux
RUN sed -i 's/\r$//' ./docker-entrypoint.sh \
    && chmod +x ./docker-entrypoint.sh \
    && mkdir -p uploads
EXPOSE 4001
ENTRYPOINT ["./docker-entrypoint.sh"]
