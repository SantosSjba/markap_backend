-- Catálogo de materiales y compras a proveedores con moneda (PEN, USD, EUR) y descripción del material.
ALTER TABLE "interior_catalog_materials" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "interior_catalog_materials" ADD COLUMN "description" TEXT;
ALTER TABLE "interior_material_purchases" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PEN';
