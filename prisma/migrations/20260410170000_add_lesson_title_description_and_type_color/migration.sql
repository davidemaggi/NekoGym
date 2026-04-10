-- Add lesson title/description and color palette support for lesson types.

ALTER TABLE "Lesson" ADD COLUMN "title" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "description" TEXT;
ALTER TABLE "LessonType" ADD COLUMN "colorHex" TEXT NOT NULL DEFAULT '#2563EB';

