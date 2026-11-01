-- Preferred layout of the bookings page (day, week or month).

ALTER TABLE "User" ADD COLUMN "bookingsView" TEXT NOT NULL DEFAULT 'DAY';
