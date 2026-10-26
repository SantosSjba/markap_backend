-- Cobro de la comisión del alquiler (un solo pago). Los contratos existentes quedan PENDING:
-- el cliente los marcará como pagados con su fecha real de cobro.
ALTER TABLE "rentals"
  ADD COLUMN "commission_status" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "commission_due_date" TIMESTAMP(3),
  ADD COLUMN "commission_paid_date" TIMESTAMP(3);

CREATE INDEX "rentals_commission_status_idx" ON "rentals"("commission_status");
CREATE INDEX "rentals_commission_paid_date_idx" ON "rentals"("commission_paid_date");
