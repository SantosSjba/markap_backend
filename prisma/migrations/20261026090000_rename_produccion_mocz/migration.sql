-- Actualizar la marca sin cambiar el identificador, las relaciones ni los permisos.
UPDATE "applications"
SET "name" = 'MOCZ · Muebles Orgánicos CZ', "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" = 'produccion';
