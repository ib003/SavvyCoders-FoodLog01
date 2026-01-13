/*
  Warnings:

  - A unique constraint covering the columns `[googleSub]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "googleSub" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "public"."User"("googleSub");
