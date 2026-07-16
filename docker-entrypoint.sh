#!/bin/sh
set -e
# Markap aún no usa historial de migraciones Prisma; sync schema con db push (sin borrar datos).
pnpm exec prisma db push
exec node dist/src/main.js
