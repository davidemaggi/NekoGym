-- Soft delete support for Course.

ALTER TABLE "Course" ADD COLUMN "deletedAt" DATETIME;

CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");

