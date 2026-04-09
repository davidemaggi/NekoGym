-- Waitlist support for lessons.

CREATE TABLE "LessonWaitlistEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lessonId" TEXT NOT NULL,
  "traineeId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonWaitlistEntry_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonWaitlistEntry_traineeId_fkey"
    FOREIGN KEY ("traineeId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LessonWaitlistEntry_lessonId_traineeId_key" ON "LessonWaitlistEntry"("lessonId", "traineeId");
CREATE INDEX "LessonWaitlistEntry_lessonId_createdAt_idx" ON "LessonWaitlistEntry"("lessonId", "createdAt");
CREATE INDEX "LessonWaitlistEntry_traineeId_idx" ON "LessonWaitlistEntry"("traineeId");

