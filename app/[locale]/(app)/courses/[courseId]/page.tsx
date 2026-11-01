import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CourseIconTile } from "@/app/[locale]/(app)/courses/_components/course-catalog";
import { fill } from "@/components/bookings/pass-card";
import { MarkdownView } from "@/components/ui/markdown-view";
import { requireAuth } from "@/lib/authorization";
import { addMinutesToTime, groupSlotsByWeekday } from "@/lib/course-schedule";
import { appDateKey, getAppDateTimeConfig } from "@/lib/date-time";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";

const NEXT_LESSONS = 6;

/** A course's page, for everyone: full description, weekly timetable and the next lessons to book. */
export default async function CoursePage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.courseCatalog;
  const weekdays = dictionary.courses.schedule.weekdays;
  const now = new Date();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      maxAttendees: true,
      trainerName: true,
      deletedAt: true,
      trainer: { select: { name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      scheduleSlots: { select: { weekday: true, startTime: true } },
      lessons: {
        where: { status: "SCHEDULED", deletedAt: null, startsAt: { gt: now } },
        select: { id: true, startsAt: true, maxAttendees: true, _count: { select: { bookings: true } } },
        orderBy: { startsAt: "asc" },
        take: NEXT_LESSONS,
      },
    },
  });
  // Deleted courses stay reachable for staff only (their lessons history still points here).
  if (!course || (course.deletedAt && currentUser.role === "TRAINEE")) notFound();

  const iconOptions = await getLessonTypeIconOptions();
  const icon = course.lessonType ? sanitizeLessonTypeIconPath(course.lessonType.iconSvg, iconOptions) : null;
  const color = course.lessonType ? sanitizeLessonTypeColor(course.lessonType.colorHex) : null;
  const trainerName = course.trainer?.name ?? course.trainerName ?? null;
  const schedule = groupSlotsByWeekday(course.scheduleSlots);

  const { timeZone } = getAppDateTimeConfig();
  const intlLocale = safeLocale === "it" ? "it-IT" : "en-GB";
  const dayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "short", day: "numeric", month: "short" });
  const timeFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-6 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-8 lg:pt-6"
      >
        <Link
          href={`/${safeLocale}/courses`}
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-[var(--stock-ink)]/80 hover:text-[var(--stock-ink)]"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          {labels.allCourses}
        </Link>
        <header className="mt-2 flex items-start gap-4">
          <CourseIconTile icon={icon} color={color} size="lg" />
          <div className="min-w-0">
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{course.name}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">
              {[course.lessonType?.name, trainerName ?? labels.noTrainer].filter(Boolean).join(" · ")}
            </p>
            <p className="tabular mt-0.5 text-[15px] text-[var(--stock-ink)]/75">
              {fill(labels.durationLabel, { n: course.durationMinutes })} · {fill(labels.capacityLabel, { n: course.maxAttendees })}
            </p>
          </div>
        </header>
      </div>

      <div className="grid gap-x-10 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="course-about">
          <h2 id="course-about" className="text-[17px] font-semibold">{labels.aboutTitle}</h2>
          {course.description?.trim() ? (
            <MarkdownView markdown={course.description} className="mt-3" />
          ) : (
            <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">{labels.noDescription}</p>
          )}
        </section>

        <div className="mt-8 space-y-8 border-t border-[var(--rule)] pt-6 lg:mt-0 lg:border-t-0 lg:pt-0">
          <section aria-labelledby="course-schedule">
            <h2 id="course-schedule" className="text-[17px] font-semibold">{labels.scheduleTitle}</h2>
            {schedule.length === 0 ? (
              <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.scheduleEmpty}</p>
            ) : (
              <dl className="mt-2 divide-y divide-[var(--rule)] text-[15px]">
                {schedule.map((day) => (
                  <div key={day.weekday} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="font-semibold">{weekdays[day.weekday]}</dt>
                    <dd className="tabular text-right">
                      {day.times.map((time) => `${time}–${addMinutesToTime(time, course.durationMinutes)}`).join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="course-next">
            <h2 id="course-next" className="text-[17px] font-semibold">{labels.nextLessonsTitle}</h2>
            {course.lessons.length === 0 ? (
              <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.nextLessonsEmpty}</p>
            ) : (
              <ul className="mt-2 divide-y divide-[var(--rule)]">
                {course.lessons.map((lesson) => {
                  const free = Math.max(0, lesson.maxAttendees - lesson._count.bookings);
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/${safeLocale}/bookings?day=${appDateKey(lesson.startsAt)}&view=day`}
                        className="-mx-2 flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[var(--muted)]"
                      >
                        <span>
                          <span className="sr-only">{labels.bookCta}: </span>
                          <span className="tabular block text-[15px] font-semibold first-letter:uppercase">
                            {dayFormat.format(lesson.startsAt)} · {timeFormat.format(lesson.startsAt)}
                          </span>
                          <span className="block text-sm text-[var(--muted-foreground)]">
                            {free === 0 ? labels.full : free === 1 ? labels.seatFreeOne : fill(labels.seatsFree, { n: free })}
                          </span>
                        </span>
                        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
