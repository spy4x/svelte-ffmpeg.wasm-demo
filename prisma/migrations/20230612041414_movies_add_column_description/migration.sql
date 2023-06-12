-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "description" VARCHAR(1000) NOT NULL DEFAULT '',
ALTER COLUMN "title" SET DEFAULT 'Untitled';

-- AlterTable
ALTER TABLE "scenarios" ALTER COLUMN "title" SET DEFAULT 'Untitled',
ALTER COLUMN "description" SET DEFAULT '';
