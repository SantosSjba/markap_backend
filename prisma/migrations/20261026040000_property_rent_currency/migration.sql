-- Moneda del alquiler de la propiedad (las existentes quedan en soles).
ALTER TABLE "properties" ADD COLUMN "rent_currency" TEXT NOT NULL DEFAULT 'PEN';
