-- Add WEBPUSH channel support in outbox enum-equivalent field (SQLite TEXT).

CREATE TABLE "WebPushSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "WebPushSubscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebPushSubscription_endpoint_key" ON "WebPushSubscription"("endpoint");
CREATE INDEX "WebPushSubscription_userId_idx" ON "WebPushSubscription"("userId");

