-- Add membership and subscription fields to users.
CREATE TABLE "new_User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TRAINEE',
  "membershipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
  "trialEndsAt" DATETIME,
  "subscriptionType" TEXT NOT NULL DEFAULT 'NONE',
  "subscriptionLessons" INTEGER,
  "subscriptionRemaining" INTEGER,
  "subscriptionResetAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" (
  "id",
  "name",
  "email",
  "passwordHash",
  "role",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "name",
  "email",
  "passwordHash",
  "role",
  "createdAt",
  "updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

