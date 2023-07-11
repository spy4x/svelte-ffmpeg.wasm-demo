-- CreateEnum
CREATE TYPE "VideoMergeStatus" AS ENUM ('IDLE', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "video_merge_started_at" TIMESTAMP(3),
ADD COLUMN     "video_merge_status" "VideoMergeStatus" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "video_merge_took_seconds" INTEGER NOT NULL DEFAULT 0;
