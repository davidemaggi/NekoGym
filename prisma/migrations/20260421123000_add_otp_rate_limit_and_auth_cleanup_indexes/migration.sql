-- OTP rate limiting persisted in DB + auth/lesson indexes for cleanup and hot paths.

CREATE TABLE "OtpRateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "OtpRateLimit_expiresAt_idx" ON "OtpRateLimit"("expiresAt");

CREATE INDEX "AuthToken_userId_type_createdAt_idx" ON "AuthToken"("userId", "type", "createdAt");
CREATE INDEX "AuthToken_type_expiresAt_idx" ON "AuthToken"("type", "expiresAt");
CREATE INDEX "AuthToken_consumedAt_idx" ON "AuthToken"("consumedAt");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Lesson_status_deletedAt_startsAt_idx" ON "Lesson"("status", "deletedAt", "startsAt");
