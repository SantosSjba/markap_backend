-- Aviso de vencimiento a 3 meses activo por defecto (avisos a 3, 2 y 1 mes).
-- Las configuraciones ya guardadas conservan su valor.
ALTER TABLE "alert_configs" ALTER COLUMN "alert_90_days" SET DEFAULT true;
