-- CreateEnum
CREATE TYPE "ScenarioAccess" AS ENUM ('PRIVATE', 'SHARED');

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "access" "ScenarioAccess" NOT NULL DEFAULT 'PRIVATE';
