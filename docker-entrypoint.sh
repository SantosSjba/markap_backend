#!/bin/sh
# Sync schema on boot, but never block startup or auto-drop legacy tables
# (e.g. interior_budget_*). Destructive pushes require an explicit offline migration.
if ! pnpm exec prisma db push; then
  echo "WARN: prisma db push failed (likely destructive changes). Starting API without schema sync."
fi
exec node dist/src/main.js