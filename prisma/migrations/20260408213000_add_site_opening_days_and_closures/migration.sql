-- Add site opening weekdays and specific closure dates.
ALTER TABLE "SiteSettings"
ADD COLUMN "openWeekdaysCsv" TEXT NOT NULL DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY';

ALTER TABLE "SiteSettings"
ADD COLUMN "closedDatesCsv" TEXT NOT NULL DEFAULT '';

