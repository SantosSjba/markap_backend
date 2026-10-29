-- Funciones del integrante en proyectos (diseño, arquitectura, obra, comercial)
ALTER TABLE "agents" ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: cada agente toma los roles en los que ya figura en proyectos existentes
UPDATE "agents" a
SET "roles" = sub.roles
FROM (
  SELECT agent_id, array_agg(DISTINCT role ORDER BY role) AS roles
  FROM (
    SELECT "designer_agent_id" AS agent_id, 'DESIGNER' AS role FROM "interior_projects"
    UNION ALL SELECT "architect_jr_agent_id", 'ARCHITECT_JR' FROM "interior_projects"
    UNION ALL SELECT "architect_agent_id", 'ARCHITECT_SR' FROM "interior_projects"
    UNION ALL SELECT "supervisor_agent_id", 'SUPERVISOR' FROM "interior_projects"
    UNION ALL SELECT "commercial_agent_id", 'COMMERCIAL' FROM "interior_projects"
    UNION ALL SELECT "designer_agent_id", 'DESIGNER' FROM "arquitectura_projects"
    UNION ALL SELECT "architect_jr_agent_id", 'ARCHITECT_JR' FROM "arquitectura_projects"
    UNION ALL SELECT "architect_agent_id", 'ARCHITECT_SR' FROM "arquitectura_projects"
    UNION ALL SELECT "supervisor_agent_id", 'SUPERVISOR' FROM "arquitectura_projects"
    UNION ALL SELECT "commercial_agent_id", 'COMMERCIAL' FROM "arquitectura_projects"
  ) assigned
  WHERE agent_id IS NOT NULL
  GROUP BY agent_id
) sub
WHERE a."id" = sub.agent_id;
