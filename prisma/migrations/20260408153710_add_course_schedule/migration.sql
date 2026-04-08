-- CreateTable
CREATE TABLE "CourseScheduleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    CONSTRAINT "CourseScheduleSlot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CourseScheduleSlot_courseId_weekday_idx" ON "CourseScheduleSlot"("courseId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "CourseScheduleSlot_courseId_weekday_startTime_key" ON "CourseScheduleSlot"("courseId", "weekday", "startTime");
