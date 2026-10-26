-- Moneda propia de los montos fijos de la distribución financiera (null = moneda del contrato).
ALTER TABLE "rental_financial_configs"
  ADD COLUMN "expense_currency" TEXT,
  ADD COLUMN "tax_currency" TEXT,
  ADD COLUMN "external_agent_currency" TEXT,
  ADD COLUMN "internal_agent_currency" TEXT;
