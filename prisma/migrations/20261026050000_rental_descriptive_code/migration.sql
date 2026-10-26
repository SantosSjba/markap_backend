-- Código descriptivo de contratos. Los existentes conservan el código que ya mostraban
-- (ALQ-<año de inicio>-<6 últimos caracteres del id>); los nuevos se generan desde la propiedad.
ALTER TABLE "rentals" ADD COLUMN "code" TEXT;

UPDATE "rentals"
SET "code" = 'ALQ-' || EXTRACT(YEAR FROM "start_date")::int || '-' || UPPER(RIGHT(REPLACE("id", '-', ''), 6))
WHERE "code" IS NULL;

CREATE UNIQUE INDEX "rentals_application_id_code_key" ON "rentals"("application_id", "code");

-- Tipo de propiedad requerido por los códigos descriptivos
INSERT INTO "property_types" ("id", "name", "code", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid()::text, 'Terreno', 'TERRENO', true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
