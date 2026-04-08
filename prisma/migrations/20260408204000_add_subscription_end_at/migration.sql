-- Add optional subscription end date to users.
ALTER TABLE "User"
ADD COLUMN "subscriptionEndsAt" DATETIME;

