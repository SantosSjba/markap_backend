-- Moneda de la comisión de venta: en % es la del precio del inmueble; en monto fijo la elige el usuario.
-- Los deducibles y las cuotas de pago van en la misma moneda que la comisión.
ALTER TABLE "sale_commissions" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PEN';

-- Comisiones existentes: moneda del inmueble del proceso (o del cierre)
UPDATE "sale_commissions" AS c
SET "currency" = p."sale_currency"
FROM "sale_processes" AS sp
JOIN "properties" AS p ON p."id" = sp."property_id"
WHERE c."sale_process_id" = sp."id";

UPDATE "sale_commissions" AS c
SET "currency" = p."sale_currency"
FROM "sale_closings" AS sc
JOIN "properties" AS p ON p."id" = sc."property_id"
WHERE c."sale_process_id" IS NULL AND c."sale_closing_id" = sc."id";
