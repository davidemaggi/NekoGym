-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "maxAttendees" INTEGER NOT NULL,
    "trainerName" TEXT,
    "bookingAdvanceMonths" INTEGER NOT NULL DEFAULT 1,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Course" ("bookingAdvanceMonths", "cancellationWindowHours", "createdAt", "description", "durationMinutes", "icon", "id", "maxAttendees", "name", "trainerName", "updatedAt") SELECT "bookingAdvanceMonths", "cancellationWindowHours", "createdAt", "description", "durationMinutes", "icon", "id", "maxAttendees", "name", "trainerName", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_name_idx" ON "Course"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
