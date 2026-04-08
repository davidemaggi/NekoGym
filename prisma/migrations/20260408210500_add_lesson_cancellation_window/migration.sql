-- Add cancellation window at lesson level.
ALTER TABLE "Lesson"
ADD COLUMN "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24;

