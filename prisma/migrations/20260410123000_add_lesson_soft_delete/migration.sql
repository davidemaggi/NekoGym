-- Soft delete support for Lesson.

ALTER TABLE "Lesson" ADD COLUMN "deletedAt" DATETIME;

-- Remove strict uniqueness so historical soft-deleted lessons can coexist.
DROP INDEX IF EXISTS "Lesson_courseId_startsAt_key";

CREATE INDEX "Lesson_courseId_startsAt_idx" ON "Lesson"("courseId", "startsAt");
CREATE INDEX "Lesson_deletedAt_idx" ON "Lesson"("deletedAt");

