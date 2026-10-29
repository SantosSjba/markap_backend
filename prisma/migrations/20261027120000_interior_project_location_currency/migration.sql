-- Proyectos de Interiorismo: distrito del ubigeo (para el código descriptivo), código anterior,
-- tipo de cambio de referencia y gastos generales por defecto (modelo Excel PRIZE).
ALTER TABLE "interior_projects" ADD COLUMN "legacy_code" TEXT;
ALTER TABLE "interior_projects" ADD COLUMN "district_id" TEXT;
ALTER TABLE "interior_projects" ADD COLUMN "exchange_rate" DECIMAL(12,4);
ALTER TABLE "interior_projects" ADD COLUMN "default_overhead_pct" DECIMAL(8,2) NOT NULL DEFAULT 0;

CREATE INDEX "interior_projects_district_id_idx" ON "interior_projects"("district_id");

ALTER TABLE "interior_projects"
  ADD CONSTRAINT "interior_projects_district_id_fkey"
  FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
