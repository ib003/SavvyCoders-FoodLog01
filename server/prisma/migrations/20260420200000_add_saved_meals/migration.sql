CREATE TABLE "SavedMeal" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "items" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedMeal_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SavedMeal" ADD CONSTRAINT "SavedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "SavedMeal_userId_idx" ON "SavedMeal"("userId");
