CREATE TYPE "ApplicationAccessLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');
ALTER TABLE "role_applications" ADD COLUMN "access_level" "ApplicationAccessLevel" NOT NULL DEFAULT 'READ';
UPDATE "role_applications" SET "access_level" = 'WRITE';
ALTER TABLE "role_applications" DROP COLUMN "can_read", DROP COLUMN "can_write", DROP COLUMN "can_delete", DROP COLUMN "can_admin";
