-- Add lesson-type access policies per user and booking confirmation status.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_LessonBooking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lessonId" TEXT NOT NULL,
  "traineeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "confirmedAt" DATETIME,
  "confirmedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonBooking_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonBooking_traineeId_fkey"
    FOREIGN KEY ("traineeId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonBooking_confirmedById_fkey"
    FOREIGN KEY ("confirmedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_LessonBooking" ("id", "lessonId", "traineeId", "status", "confirmedAt", "confirmedById", "createdAt")
SELECT "id", "lessonId", "traineeId", 'CONFIRMED', "createdAt", NULL, "createdAt"
FROM "LessonBooking";

DROP TABLE "LessonBooking";
ALTER TABLE "new_LessonBooking" RENAME TO "LessonBooking";

CREATE UNIQUE INDEX "LessonBooking_lessonId_traineeId_key" ON "LessonBooking"("lessonId", "traineeId");
CREATE INDEX "LessonBooking_traineeId_idx" ON "LessonBooking"("traineeId");
CREATE INDEX "LessonBooking_status_idx" ON "LessonBooking"("status");
CREATE INDEX "LessonBooking_confirmedById_idx" ON "LessonBooking"("confirmedById");

CREATE TABLE "UserLessonTypeAccess" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonTypeId" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'REQUIRES_CONFIRMATION',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserLessonTypeAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserLessonTypeAccess_lessonTypeId_fkey"
    FOREIGN KEY ("lessonTypeId") REFERENCES "LessonType"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserLessonTypeAccess_userId_lessonTypeId_key" ON "UserLessonTypeAccess"("userId", "lessonTypeId");
CREATE INDEX "UserLessonTypeAccess_lessonTypeId_idx" ON "UserLessonTypeAccess"("lessonTypeId");

PRAGMA foreign_keys=ON;
