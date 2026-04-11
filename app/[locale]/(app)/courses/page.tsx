import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, parseOpenWeekdaysCsv } from "@/lib/site-settings";

import { CoursesManager } from "@/app/[locale]/(app)/courses/_components/courses-manager";

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ showDeleted?: string }>;
}) {
  const { locale } = await params;
  const { showDeleted } = await searchParams;
  const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
  const includeDeleted = currentUser.role === "ADMIN" && showDeleted === "1";

  const trainerCandidates =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "TRAINER"] } },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: { id: currentUser.id },
          select: { id: true, name: true, email: true, role: true },
        });

  const lessonTypes = await prisma.lessonType.findMany({
    orderBy: { name: "asc" },
  });
  const siteSettings = await getSiteSettings();
  const openWeekdays = parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv);

  const iconOptions = await getLessonTypeIconOptions();

  const safeLessonTypes = lessonTypes.map((type) => ({
    ...type,
    iconSvg: sanitizeLessonTypeIconPath(type.iconSvg, iconOptions),
    colorHex: sanitizeLessonTypeColor(type.colorHex),
  }));

  const courses = await prisma.course.findMany({
    where: { deletedAt: includeDeleted ? undefined : null },
    include: {
      scheduleSlots: true,
      lessons: {
        where: {
          startsAt: { gt: new Date() },
          status: "SCHEDULED",
          deletedAt: null,
        },
        select: {
          id: true,
          _count: { select: { bookings: true } },
        },
      },
      trainer: {
        select: { id: true, name: true, email: true },
      },
      lessonType: {
        select: { id: true, name: true, iconSvg: true, colorHex: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const safeCourses = courses.map((course) => ({
    ...course,
    futureBookedLessonsCount: course.lessons.filter((lesson) => lesson._count.bookings > 0).length,
    lessonType: course.lessonType
      ? {
          ...course.lessonType,
          iconSvg: sanitizeLessonTypeIconPath(course.lessonType.iconSvg, iconOptions),
          colorHex: sanitizeLessonTypeColor(course.lessonType.colorHex),
        }
      : null,
  }));

  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).courses;

  return (
    <CoursesManager
      locale={locale}
      courses={safeCourses}
      labels={labels}
      currentUser={currentUser}
      includeDeleted={includeDeleted}
      trainerCandidates={trainerCandidates}
      lessonTypes={safeLessonTypes}
      availableWeekdays={openWeekdays}
    />
  );
}

