import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import type { Dictionary } from "@/lib/i18n";
import { groupSlotsByWeekday, type Weekday } from "@/lib/course-schedule";
import { hexToRgba } from "@/lib/lesson-type-icons";
import { markdownExcerpt } from "@/lib/markdown";

export type CatalogCourse = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  trainerName: string | null;
  lessonTypeName: string | null;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
  scheduleSlots: Array<{ weekday: Weekday; startTime: string }>;
};

/** The big lesson-type icon on a tinted tile: the course's face on cards and on its page. */
export function CourseIconTile({ icon, color, size = "md" }: { icon: string | null; color: string | null; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-14 w-14 rounded-xl";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-[var(--muted)] ${box}`}
      style={color ? { backgroundColor: hexToRgba(color, 0.18), border: `1px solid ${hexToRgba(color, 0.45)}` } : undefined}
    >
      {icon ? <LessonTypeIcon iconPath={icon} colorHex={color} size={size === "lg" ? 34 : 30} /> : null}
    </span>
  );
}

/** Members' view of the courses: one card per course, linking to its page. */
export function CourseCatalog({
  locale,
  courses,
  labels,
  weekdays,
}: {
  locale: string;
  courses: CatalogCourse[];
  labels: Dictionary["courseCatalog"];
  weekdays: Record<Weekday, string>;
}) {
  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-6 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-8 lg:pt-10"
      >
        <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
        <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">{labels.subtitle}</p>
      </div>

      {courses.length === 0 ? (
        <p className="py-8 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const excerpt = markdownExcerpt(course.description, 180);
            const schedule = groupSlotsByWeekday(course.scheduleSlots)
              .map((day) => `${weekdays[day.weekday].slice(0, 3)} ${day.times.join(", ")}`)
              .join(" · ");
            return (
              <li key={course.id}>
                <Link
                  href={`/${locale}/courses/${course.id}`}
                  className="group flex h-full flex-col rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-lift)] transition-colors hover:bg-[var(--surface-sunken)]"
                >
                  <div className="flex items-start gap-4">
                    <CourseIconTile icon={course.lessonTypeIcon} color={course.lessonTypeColor} />
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-semibold leading-snug">{course.name}</h2>
                      <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                        {[course.lessonTypeName, course.trainerName ?? labels.noTrainer].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed">
                    {excerpt || <span className="text-[var(--muted-foreground)]">{labels.noDescription}</span>}
                  </p>
                  <div className="mt-auto pt-4">
                    {schedule ? <p className="tabular text-sm text-[var(--muted-foreground)]">{schedule}</p> : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-[15px] font-semibold underline-offset-4 group-hover:underline">
                      {labels.openCta}
                      <ChevronRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
