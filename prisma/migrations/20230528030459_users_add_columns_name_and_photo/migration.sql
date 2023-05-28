-- AlterTable
ALTER TABLE "user_auth_keys" ALTER COLUMN "hashed_password" SET DATA TYPE VARCHAR(150);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" VARCHAR(50),
ADD COLUMN     "last_name" VARCHAR(50),
ADD COLUMN     "photo_url" VARCHAR(400),
ALTER COLUMN "email" DROP NOT NULL;
