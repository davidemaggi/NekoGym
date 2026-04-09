-- User-level notification channel preferences.

ALTER TABLE "User" ADD COLUMN "notifyByEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notifyByTelegram" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notifyByWebPush" BOOLEAN NOT NULL DEFAULT true;

