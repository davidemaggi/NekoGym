-- "Reset piano" was stored but never read: weekly/monthly windows come from the calendar
-- and the site's weekly reset weekday.

ALTER TABLE "User" DROP COLUMN "subscriptionResetAt";
