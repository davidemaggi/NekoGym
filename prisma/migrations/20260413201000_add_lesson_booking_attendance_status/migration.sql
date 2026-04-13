-- AlterTable
ALTER TABLE "LessonBooking" ADD COLUMN "attendanceStatus" TEXT;
ALTER TABLE "LessonBooking" ADD COLUMN "attendanceMarkedAt" DATETIME;
ALTER TABLE "LessonBooking" ADD COLUMN "attendanceMarkedById" TEXT;

-- CreateIndex
CREATE INDEX "LessonBooking_attendanceStatus_idx" ON "LessonBooking"("attendanceStatus");

-- CreateIndex
CREATE INDEX "LessonBooking_attendanceMarkedById_idx" ON "LessonBooking"("attendanceMarkedById");
