#!/bin/sh
set -e

# Environment validation is handled by Joi inside the NestJS app
# (ConfigModule.forRoot → validationSchema). If any required variable
# is missing, the app will refuse to start with a descriptive error.

echo "[startup] Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

echo "[startup] Starting NestJS application..."
exec node -r tsconfig-paths/register dist/main
