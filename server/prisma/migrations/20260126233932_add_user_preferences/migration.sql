-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "public"."Food"("name");

-- CreateIndex
CREATE INDEX "Food_brand_idx" ON "public"."Food"("brand");

-- AddForeignKey
ALTER TABLE "public"."UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
