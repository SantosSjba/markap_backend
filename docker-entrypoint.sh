#!/bin/sh
set -eu
# Solo migraciones versionadas. Nunca db push, reset ni seeds en producción.
pnpm exec prisma migrate deploy
exec node dist/src/main.js
