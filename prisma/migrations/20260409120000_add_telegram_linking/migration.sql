-- Add Telegram linkage metadata to users
ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" DATETIME;

-- Token table used to securely bind Telegram chat to app users
CREATE TABLE "TelegramLinkToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "consumedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "TelegramLinkToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");
CREATE UNIQUE INDEX "TelegramLinkToken_token_key" ON "TelegramLinkToken"("token");
CREATE INDEX "TelegramLinkToken_userId_idx" ON "TelegramLinkToken"("userId");
CREATE INDEX "TelegramLinkToken_expiresAt_idx" ON "TelegramLinkToken"("expiresAt");

