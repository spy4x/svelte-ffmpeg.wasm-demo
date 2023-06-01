/*
  Warnings:

  - The primary key for the `user_auth_keys` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_auth_keys` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(28)`.
  - The primary key for the `user_auth_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_auth_sessions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.

*/
-- AlterTable
ALTER TABLE "user_auth_keys" DROP CONSTRAINT "user_auth_keys_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(28),
ADD CONSTRAINT "user_auth_keys_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_auth_sessions" DROP CONSTRAINT "user_auth_sessions_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(40),
ADD CONSTRAINT "user_auth_sessions_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "scenarios" (
    "id" VARCHAR(15) NOT NULL,
    "user_id" VARCHAR(15),
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "actors" VARCHAR(100)[],
    "scenes" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" VARCHAR(15) NOT NULL,
    "user_id" VARCHAR(15) NOT NULL,
    "scenario_id" VARCHAR(15),
    "title" VARCHAR(100) NOT NULL,
    "clips" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "video_url" VARCHAR(400),
    "video_md5" VARCHAR(32),
    "duration_sec" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenarios_id_key" ON "scenarios"("id");

-- CreateIndex
CREATE UNIQUE INDEX "movies_id_key" ON "movies"("id");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
