-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "maxAttendees" INTEGER NOT NULL,
    "trainerName" TEXT,
    "bookingAdvanceMonths" INTEGER NOT NULL DEFAULT 1,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Course_name_idx" ON "Course"("name");
