ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;

CREATE UNIQUE INDEX "User_pendingEmail_key" ON "User"("pendingEmail");

ALTER TABLE "NotificationOutbox" ADD COLUMN "recipientEmail" TEXT;
ALTER TABLE "NotificationOutbox" ADD COLUMN "allowUnverifiedEmail" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AuthToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "targetEmail" TEXT,
  "expiresAt" DATETIME NOT NULL,
  "consumedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "AuthToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

-- Backfill existing users as verified to avoid lockout after rollout.
UPDATE "User" SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "emailVerifiedAt" IS NULL;

