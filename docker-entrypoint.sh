#!/bin/sh
# 1) Additive SQL only (ADD COLUMN / INDEX / FK). Never DROP tables or rows.
ADDITIVE_SQL="prisma/migrations/manual/add-archivo-id-docs-evidences.sql"
if [ -f "$ADDITIVE_SQL" ]; then
  echo "Applying additive SQL (safe, no data loss): $ADDITIVE_SQL"
  if ! pnpm exec prisma db execute --file "$ADDITIVE_SQL"; then
    echo "WARN: additive SQL failed or already applied. Continuing."
  fi
fi

# 2) Optional Prisma sync — NEVER pass --accept-data-loss (preserves interior_budget_* etc.)
if ! pnpm exec prisma db push; then
  echo "WARN: prisma db push failed (likely destructive changes blocked). Starting API without full schema sync."
fi
exec node dist/src/main.js
