-- Normaliza documentos de renderizado guardados con el valor heredado 'RENDER'
UPDATE "interior_project_documents" SET "doc_type" = 'RENDERIZADO' WHERE "doc_type" = 'RENDER';
