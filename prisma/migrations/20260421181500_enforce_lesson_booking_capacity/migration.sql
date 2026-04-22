CREATE TRIGGER IF NOT EXISTS "lesson_booking_capacity_before_insert"
BEFORE INSERT ON "LessonBooking"
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (
        SELECT COUNT(*)
        FROM "LessonBooking"
        WHERE "lessonId" = NEW."lessonId"
      ) >= (
        SELECT "maxAttendees"
        FROM "Lesson"
        WHERE "id" = NEW."lessonId"
      )
      THEN RAISE(ABORT, 'LESSON_FULL')
    END;
END;

CREATE TRIGGER IF NOT EXISTS "lesson_booking_capacity_before_update"
BEFORE UPDATE OF "lessonId" ON "LessonBooking"
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (
        SELECT COUNT(*)
        FROM "LessonBooking"
        WHERE "lessonId" = NEW."lessonId"
          AND "id" <> OLD."id"
      ) >= (
        SELECT "maxAttendees"
        FROM "Lesson"
        WHERE "id" = NEW."lessonId"
      )
      THEN RAISE(ABORT, 'LESSON_FULL')
    END;
END;
