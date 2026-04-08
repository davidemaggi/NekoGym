-- Add configurable weekly reset weekday for subscriptions.
ALTER TABLE "SiteSettings"
ADD COLUMN "weeklyResetWeekday" TEXT NOT NULL DEFAULT 'MONDAY';

