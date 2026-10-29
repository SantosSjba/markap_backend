-- Cobros al cliente con su moneda y el tipo de cambio del día (liquidación multi-moneda).
ALTER TABLE "interior_project_payments" ADD COLUMN "currency" TEXT;
ALTER TABLE "interior_project_payments" ADD COLUMN "exchange_rate" DECIMAL(12,4);

UPDATE "interior_project_payments" pay
SET "currency" = p."currency"
FROM "interior_projects" p
WHERE p."id" = pay."project_id" AND pay."currency" IS NULL;
