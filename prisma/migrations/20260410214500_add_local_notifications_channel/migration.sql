-- Local notifications channel (always-on), retention and last-seen tracking.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerifiedAt" DATETIME,
  "pendingEmail" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TRAINEE',
  "telegramChatId" TEXT,
  "telegramUsername" TEXT,
  "telegramLinkedAt" DATETIME,
  "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
  "notifyByTelegram" BOOLEAN NOT NULL DEFAULT true,
  "notifyByWebPush" BOOLEAN NOT NULL DEFAULT true,
  "notificationsLastSeenAt" DATETIME,
  "notificationsRetentionDays" INTEGER NOT NULL DEFAULT 15,
  "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
  "totpSecret" TEXT,
  "membershipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
  "trialEndsAt" DATETIME,
  "subscriptionType" TEXT NOT NULL DEFAULT 'NONE',
  "subscriptionLessons" INTEGER,
  "subscriptionRemaining" INTEGER,
  "subscriptionResetAt" DATETIME,
  "subscriptionEndsAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" (
  "id","name","email","emailVerifiedAt","pendingEmail","passwordHash","role",
  "telegramChatId","telegramUsername","telegramLinkedAt",
  "notifyByEmail","notifyByTelegram","notifyByWebPush",
  "totpEnabled","totpSecret","membershipStatus","trialEndsAt",
  "subscriptionType","subscriptionLessons","subscriptionRemaining","subscriptionResetAt","subscriptionEndsAt",
  "createdAt","updatedAt"
)
SELECT
  "id","name","email","emailVerifiedAt","pendingEmail","passwordHash","role",
  "telegramChatId","telegramUsername","telegramLinkedAt",
  "notifyByEmail","notifyByTelegram","notifyByWebPush",
  "totpEnabled","totpSecret","membershipStatus","trialEndsAt",
  "subscriptionType","subscriptionLessons","subscriptionRemaining","subscriptionResetAt","subscriptionEndsAt",
  "createdAt","updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_pendingEmail_key" ON "User"("pendingEmail");
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

CREATE TABLE "LocalNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocalNotification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LocalNotification_userId_createdAt_idx" ON "LocalNotification"("userId", "createdAt");

PRAGMA foreign_keys=ON;
