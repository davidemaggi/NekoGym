CREATE TABLE "NotificationOutbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "sentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "NotificationOutbox_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "NotificationOutbox_status_availableAt_createdAt_idx"
  ON "NotificationOutbox"("status", "availableAt", "createdAt");

CREATE INDEX "NotificationOutbox_userId_createdAt_idx"
  ON "NotificationOutbox"("userId", "createdAt");

