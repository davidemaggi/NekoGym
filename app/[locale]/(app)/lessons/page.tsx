import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { locale } = await params;
  const { week } = await searchParams;
  await requireAnyRole(["ADMIN", "TRAINER"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).lessonsPage;

  const weekOffset = Number.parseInt(week ?? "0", 10);
  const normalizedOffset = Number.isNaN(weekOffset) ? 0 : weekOffset;

  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + normalizedOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const lessons = await prisma.lesson.findMany({
    where: {
      startsAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      course: { select: { id: true, name: true } },
      trainer: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const grouped = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = dateKey(lesson.startsAt);
    const list = grouped.get(key) ?? [];
    list.push(lesson);
    grouped.set(key, list);
  }

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      lessons: grouped.get(key) ?? [],
    };
  });

  const daysWithLessons = weekDays.filter((day) => day.lessons.length > 0);

  const dateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const shortDateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekRangeEnd = new Date(weekEnd);
  weekRangeEnd.setDate(weekRangeEnd.getDate() - 1);
  const weekRangeLabel = `${shortDateFmt.format(weekStart)} - ${shortDateFmt.format(weekRangeEnd)}`;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm">
          <a className="text-zinc-700 hover:underline dark:text-zinc-200" href={`/${locale}/lessons?week=${normalizedOffset - 1}`}>
            {labels.prevWeek}
          </a>
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">{labels.weekLabel.replace("{n}", String(normalizedOffset))}</span>
          <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">{weekRangeLabel}</span>
          <a className="text-zinc-700 hover:underline dark:text-zinc-200" href={`/${locale}/lessons?week=${normalizedOffset + 1}`}>
            {labels.nextWeek}
          </a>
        </div>
      </header>

      <div className="space-y-3">
        {daysWithLessons.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {labels.emptyDay}
          </div>
        ) : null}

        {daysWithLessons.map((day) => (
          <div key={day.key} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold capitalize">{dateFmt.format(day.date)}</h3>

            <div className="mt-2 space-y-2">
              {day.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{lesson.course?.name ?? "-"}</p>
                    {lesson.course?.id ? (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                        {labels.courseTag}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-300">
                    {timeFmt.format(lesson.startsAt)} - {timeFmt.format(lesson.endsAt)} · {lesson.status}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {labels.trainerLabel}: {lesson.trainer?.name ?? "-"} · {labels.bookedLabel}: {lesson._count.bookings}/{lesson.maxAttendees}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

