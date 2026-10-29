-- Presupuesto de Interiorismo en árbol (modelo de los Excel de la clienta).
-- Tablas con prefijo interior_project_budget*: las interior_budget* existentes son del modelo
-- legacy de 4 niveles (sin migración propia) y no se tocan aquí.
-- Reemplaza secciones/partidas de 2 niveles: cada proyecto con partidas recibe un presupuesto v1
-- activo; sección → grupo, partida → ítem (costo escrito = costo directo) y abonos al proveedor.
-- Se conservan los ids de las partidas: los adjuntos del presupuesto los guardan como categoría.

CREATE TABLE "interior_project_budgets" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "number" TEXT,
  "issued_at" DATE,
  "execution_term" TEXT,
  "executed_by" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "currency" TEXT NOT NULL DEFAULT 'PEN',
  "exchange_rate" DECIMAL(12,4),
  "exchange_rate_date" DATE,
  "margin_mode" TEXT NOT NULL DEFAULT 'PER_LINE',
  "utility_pct" DECIMAL(8,2) NOT NULL DEFAULT 20,
  "overhead_pct" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "igv_mode" TEXT NOT NULL DEFAULT 'PER_LINE',
  "igv_pct" DECIMAL(8,2) NOT NULL DEFAULT 18,
  "terms" TEXT,
  "visible_columns" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "interior_project_budgets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "interior_project_budgets_project_id_version_key" ON "interior_project_budgets"("project_id", "version");
CREATE INDEX "interior_project_budgets_project_id_idx" ON "interior_project_budgets"("project_id");
ALTER TABLE "interior_project_budgets" ADD CONSTRAINT "interior_project_budgets_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "interior_project_budget_rows" (
  "id" TEXT NOT NULL,
  "budget_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "kind" TEXT NOT NULL DEFAULT 'ITEM',
  "code" TEXT,
  "description" TEXT NOT NULL DEFAULT '',
  "unit" TEXT,
  "quantity" DECIMAL(14,4),
  "unit_price" DECIMAL(14,4),
  "direct_cost" DECIMAL(14,2),
  "actual_cost" DECIMAL(14,2),
  "utility_pct_override" DECIMAL(8,2),
  "has_igv" BOOLEAN NOT NULL DEFAULT false,
  "supplier_id" TEXT,
  "supplier_name" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "interior_project_budget_rows_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "interior_project_budget_rows_budget_id_idx" ON "interior_project_budget_rows"("budget_id");
CREATE INDEX "interior_project_budget_rows_parent_id_idx" ON "interior_project_budget_rows"("parent_id");
CREATE INDEX "interior_project_budget_rows_supplier_id_idx" ON "interior_project_budget_rows"("supplier_id");
ALTER TABLE "interior_project_budget_rows" ADD CONSTRAINT "interior_project_budget_rows_budget_id_fkey"
  FOREIGN KEY ("budget_id") REFERENCES "interior_project_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interior_project_budget_rows" ADD CONSTRAINT "interior_project_budget_rows_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "interior_project_budget_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interior_project_budget_rows" ADD CONSTRAINT "interior_project_budget_rows_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "interior_material_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "interior_project_budget_row_payments" (
  "id" TEXT NOT NULL,
  "row_id" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "paid_at" DATE NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "interior_project_budget_row_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "interior_project_budget_row_payments_row_id_idx" ON "interior_project_budget_row_payments"("row_id");
ALTER TABLE "interior_project_budget_row_payments" ADD CONSTRAINT "interior_project_budget_row_payments_row_id_fkey"
  FOREIGN KEY ("row_id") REFERENCES "interior_project_budget_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Copia de datos ──
INSERT INTO "interior_project_budgets" ("id", "project_id", "version", "is_active", "currency", "utility_pct", "overhead_pct", "igv_pct", "updated_at")
SELECT gen_random_uuid()::text, p."id", 1, true, p."currency", p."default_utility_pct", p."default_overhead_pct", p."default_igv_pct", NOW()
FROM "interior_projects" p
WHERE EXISTS (SELECT 1 FROM "interior_project_sections" s WHERE s."project_id" = p."id");

INSERT INTO "interior_project_budget_rows" ("id", "budget_id", "parent_id", "sort_order", "kind", "description", "created_at", "updated_at", "created_by", "updated_by")
SELECT s."id", b."id", NULL, s."sort_order", 'GROUP', s."name", s."created_at", NOW(), s."created_by", s."updated_by"
FROM "interior_project_sections" s
JOIN "interior_project_budgets" b ON b."project_id" = s."project_id" AND b."version" = 1;

INSERT INTO "interior_project_budget_rows" ("id", "budget_id", "parent_id", "sort_order", "kind", "description", "direct_cost", "actual_cost", "has_igv", "supplier_id", "supplier_name", "status", "created_at", "updated_at", "created_by", "updated_by")
SELECT li."id", b."id", li."section_id", li."sort_order", 'ITEM', li."description", li."budgeted_cost", li."actual_purchase_cost", li."has_igv", li."supplier_id", li."supplier_name",
       CASE WHEN li."actual_purchase_cost" IS NOT NULL THEN 'PURCHASED' ELSE 'PENDING' END,
       li."created_at", NOW(), li."created_by", li."updated_by"
FROM "interior_project_line_items" li
JOIN "interior_project_sections" s ON s."id" = li."section_id"
JOIN "interior_project_budgets" b ON b."project_id" = s."project_id" AND b."version" = 1;

INSERT INTO "interior_project_budget_row_payments" ("id", "row_id", "amount", "paid_at", "created_at", "updated_at", "created_by", "updated_by")
SELECT sp."id", sp."line_item_id", sp."amount", sp."paid_at", sp."created_at", NOW(), sp."created_by", sp."updated_by"
FROM "interior_line_item_supplier_payments" sp;

DROP TABLE "interior_line_item_supplier_payments";
DROP TABLE "interior_project_line_items";
DROP TABLE "interior_project_sections";
