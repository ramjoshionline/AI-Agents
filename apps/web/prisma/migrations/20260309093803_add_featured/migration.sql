-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "tools" TEXT NOT NULL DEFAULT '[]',
    "pricingModel" TEXT NOT NULL DEFAULT 'flat',
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "reviewNote" TEXT,
    "builderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("builderId", "createdAt", "description", "id", "name", "priceMonthly", "pricingModel", "reviewNote", "status", "systemPrompt", "tagline", "tools", "trialDays", "updatedAt", "vertical") SELECT "builderId", "createdAt", "description", "id", "name", "priceMonthly", "pricingModel", "reviewNote", "status", "systemPrompt", "tagline", "tools", "trialDays", "updatedAt", "vertical" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
