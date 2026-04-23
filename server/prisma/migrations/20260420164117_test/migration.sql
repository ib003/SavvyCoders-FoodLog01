-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFood" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "SavedFood_userId_idx" ON "SavedFood"("userId");

-- CreateIndex
CREATE INDEX "SavedFood_foodId_idx" ON "SavedFood"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedFood_userId_foodId_key" ON "SavedFood"("userId", "foodId");

-- CreateIndex
CREATE INDEX "Food_brand_idx" ON "Food"("brand");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFood" ADD CONSTRAINT "SavedFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFood" ADD CONSTRAINT "SavedFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
