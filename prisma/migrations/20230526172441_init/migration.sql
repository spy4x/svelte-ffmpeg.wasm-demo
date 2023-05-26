-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(15) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(15) NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_keys" (
    "id" TEXT NOT NULL,
    "hashed_password" VARCHAR(50),
    "user_id" VARCHAR(15) NOT NULL,
    "primary_key" BOOLEAN NOT NULL,
    "expires" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_sessions_id_key" ON "user_auth_sessions"("id");

-- CreateIndex
CREATE INDEX "user_auth_sessions_user_id_idx" ON "user_auth_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_keys_id_key" ON "user_auth_keys"("id");

-- CreateIndex
CREATE INDEX "user_auth_keys_user_id_idx" ON "user_auth_keys"("user_id");

-- AddForeignKey
ALTER TABLE "user_auth_sessions" ADD CONSTRAINT "user_auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_auth_keys" ADD CONSTRAINT "user_auth_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
