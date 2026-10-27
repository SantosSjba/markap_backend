-- Moneda de los montos del cumplimiento legal del cierre:
-- pago bancarizado (monto y moneda, por defecto la de la venta) y tributos (alcabala y renta 2da, por defecto PEN).
ALTER TABLE "sale_compliance_checklists" ADD COLUMN "payment_amount" DOUBLE PRECISION;
ALTER TABLE "sale_compliance_checklists" ADD COLUMN "payment_currency" TEXT;
ALTER TABLE "sale_compliance_checklists" ADD COLUMN "alcabala_currency" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "sale_compliance_checklists" ADD COLUMN "rent2_currency" TEXT NOT NULL DEFAULT 'PEN';
