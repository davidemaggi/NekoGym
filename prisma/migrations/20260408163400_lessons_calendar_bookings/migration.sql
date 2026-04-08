/*
  Warnings:

  - Added the required column `endsAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxAttendees` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "LessonBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonBooking_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonBooking_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "maxAttendees" INTEGER NOT NULL,
    "sourceWeekday" TEXT,
    "sourceStartTime" TEXT,
    "isGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "courseId" TEXT,
    "lessonTypeId" TEXT,
    "trainerId" TEXT,
    CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lesson_lessonTypeId_fkey" FOREIGN KEY ("lessonTypeId") REFERENCES "LessonType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lesson_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("courseId", "createdAt", "id", "lessonTypeId", "startsAt", "trainerId", "updatedAt") SELECT "courseId", "createdAt", "id", "lessonTypeId", "startsAt", "trainerId", "updatedAt" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE INDEX "Lesson_courseId_idx" ON "Lesson"("courseId");
CREATE INDEX "Lesson_lessonTypeId_idx" ON "Lesson"("lessonTypeId");
CREATE INDEX "Lesson_trainerId_idx" ON "Lesson"("trainerId");
CREATE INDEX "Lesson_startsAt_idx" ON "Lesson"("startsAt");
CREATE INDEX "Lesson_status_idx" ON "Lesson"("status");
CREATE UNIQUE INDEX "Lesson_courseId_startsAt_key" ON "Lesson"("courseId", "startsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LessonBooking_traineeId_idx" ON "LessonBooking"("traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBooking_lessonId_traineeId_key" ON "LessonBooking"("lessonId", "traineeId");
