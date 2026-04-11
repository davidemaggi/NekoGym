"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";

import { LessonDetailsDialogTrigger } from "@/components/lessons/lesson-details-dialog-trigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { hexToRgba } from "@/lib/lesson-type-icons";

type UserLesson = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  trainerName: string | null;
  occupancy: string;
  queueLength: number;
  canViewWaitlist: boolean;
  isCourseLesson: boolean;
  lessonTypeName: string;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
  canBroadcast: boolean;
  roleKind: "TRAINER" | "TRAINEE";
  bookingStatus: "CONFIRMED" | "PENDING" | null;
};

type RangeView = "week" | "month" | "year";

type DashboardUserInsightsProps = {
  locale: string;
  lessons: UserLesson[];
  lessonDetailsLabels: {
    detailsTitle: string;
    detailsDescription: string;
    startsAtLabel: string;
    endsAtLabel: string;
    trainerLabel: string;
    bookedLabel: string;
    queuedLabel: string;
    closeCta: string;
    courseTag: string;
    lessonDescriptionLabel: string;
    notifySectionTitle: string;
    notifyMessagePlaceholder: string;
    notifySendCta: string;
  };
  labels: {
    upcomingTitle: string;
    upcomingDescription: string;
    upcomingEmpty: string;
    roleTrainer: string;
    roleTrainee: string;
    bookingPending: string;
    rankingTitle: string;
    rankingDescription: string;
    includeFuture: string;
    rankingEmpty: string;
    lessonsCountSuffix: string;
    totalTimeTitle: string;
    totalTimeDescription: string;
    totalTimeEmpty: string;
    totalTimeHours: string;
    chartTitle: string;
    chartDescription: string;
    chartRangeLabel: string;
    chartRangeWeek: string;
    chartRangeMonth: string;
    chartRangeYear: string;
    chartEmpty: string;
  };
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function formatDateTime(input: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(input));
}

function minutesBetween(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardUserInsights({ locale, lessons, lessonDetailsLabels, labels }: DashboardUserInsightsProps) {
  const [includeFutureForRanking, setIncludeFutureForRanking] = useState(false);
  const [includeFutureForTime, setIncludeFutureForTime] = useState(false);
  const [rangeView, setRangeView] = useState<RangeView>("month");
  const showDevToggles = process.env.NODE_ENV !== "production";
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );

  const now = useMemo(() => new Date(), []);
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [lessons]
  );
  const upcomingLessons = useMemo(
    () => sortedLessons.filter((lesson) => new Date(lesson.startsAt) >= now).slice(0, 10),
    [sortedLessons, now]
  );

  const rankingLessons = useMemo(
    () =>
      sortedLessons.filter((lesson) => {
        const startsAt = new Date(lesson.startsAt);
        return includeFutureForRanking ? true : startsAt < now;
      }),
    [sortedLessons, includeFutureForRanking, now]
  );

  const ranking = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lesson of rankingLessons) {
      counts.set(lesson.lessonTypeName, (counts.get(lesson.lessonTypeName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [rankingLessons]);

  const totalMinutes = useMemo(
    () =>
      sortedLessons
        .filter((lesson) => (includeFutureForTime ? true : new Date(lesson.startsAt) < now))
        .reduce((acc, lesson) => acc + minutesBetween(lesson.startsAt, lesson.endsAt), 0),
    [sortedLessons, includeFutureForTime, now]
  );

  const totalHours = (totalMinutes / 60).toFixed(1);

  const chartData = useMemo(() => {
    const completed = sortedLessons;
    const palette = ["#d89a73", "#7da6c9", "#8ebf92", "#c5a86a", "#b988b7", "#7db7ad", "#cf8c63", "#9ab17d"];
    const typeColorMap = new Map<string, string>();
    for (const lesson of completed) {
      if (!typeColorMap.has(lesson.lessonTypeName)) {
        typeColorMap.set(lesson.lessonTypeName, lesson.lessonTypeColor ?? "");
      }
    }

    const typeKeys = Array.from(typeColorMap.entries()).map(([type, color], index) => {
      const safeColor = color || palette[index % palette.length];
      return {
        type,
        key: `t${index}`,
        color: safeColor,
        pastKey: `t${index}Past`,
        futureKey: `t${index}Future`,
      };
    });

    const config = typeKeys.reduce((acc, item) => {
      acc[item.pastKey] = { label: item.type, color: item.color };
      acc[item.futureKey] = { label: `${item.type} · future`, color: item.color };
      return acc;
    }, {} as ChartConfig);

    type Row = { label: string } & Record<string, number | string>;
    const rowsMap = new Map<string, Row>();

    const nowDate = new Date();
    const todayStart = new Date(nowDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(nowDate);
    todayEnd.setHours(23, 59, 59, 999);
    const rangeStart =
      rangeView === "week"
        ? new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - 3, 0, 0, 0, 0)
        : rangeView === "year"
          ? startOfYear(nowDate)
          : startOfMonth(nowDate);
    const rangeEnd =
      rangeView === "week"
        ? new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate() + 3, 23, 59, 59, 999)
        : rangeView === "year"
          ? endOfYear(nowDate)
          : endOfMonth(nowDate);

    if (rangeView === "week") {
      for (let i = -3; i <= 3; i += 1) {
        const date = new Date(todayStart);
        date.setDate(todayStart.getDate() + i);
        const bucketKey = toDateKey(date);
        const bucketLabel = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
          weekday: "short",
          day: "2-digit",
        }).format(date);
        const row: Row = { label: bucketLabel };
        for (const type of typeKeys) {
          row[type.pastKey] = 0;
          row[type.futureKey] = 0;
        }
        rowsMap.set(bucketKey, row);
      }
    }

    for (const lesson of completed) {
      const date = new Date(lesson.startsAt);
      if (date < rangeStart || date > rangeEnd) continue;

      const typeKey = typeKeys.find((item) => item.type === lesson.lessonTypeName);
      if (!typeKey) continue;

      let bucketKey = "";
      let bucketLabel = "";
      if (rangeView === "week") {
        bucketKey = toDateKey(date);
        bucketLabel = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
          weekday: "short",
          day: "2-digit",
        }).format(date);
      } else if (rangeView === "year") {
        bucketKey = String(date.getMonth());
        bucketLabel = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", { month: "short" }).format(date);
      } else {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const bucketWeekStart = startOfWeek(date);
        const bucketWeekEnd = new Date(bucketWeekStart);
        bucketWeekEnd.setDate(bucketWeekStart.getDate() + 6);

        const labelStart = bucketWeekStart < monthStart ? monthStart : bucketWeekStart;
        const labelEnd = bucketWeekEnd > monthEnd ? monthEnd : bucketWeekEnd;
        bucketKey = toDateKey(bucketWeekStart);
        const rangeFmt = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
          day: "2-digit",
          month: "short",
        });
        bucketLabel = `${rangeFmt.format(labelStart)} - ${rangeFmt.format(labelEnd)}`;
      }

      const row = rowsMap.get(bucketKey) ?? ({ label: bucketLabel } as Row);
      const isFutureLesson = date >= nowDate;
      const targetKey = isFutureLesson ? typeKey.futureKey : typeKey.pastKey;
      row[targetKey] = Number(row[targetKey] ?? 0) + 1;
      rowsMap.set(bucketKey, row);
    }

    const rows =
      rangeView === "week"
        ? Array.from(rowsMap.values())
        : Array.from(rowsMap.entries())
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, row]) => row);

    return { rows, config, typeKeys };
  }, [sortedLessons, rangeView, locale]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-6">
        <CardHeader>
          <CardTitle>{labels.upcomingTitle}</CardTitle>
          <p className="text-xs text-[var(--muted-foreground)]">{labels.upcomingDescription}</p>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.upcomingEmpty}</p>
          ) : (
            <div className="space-y-2">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-md border p-2 text-sm"
                  style={
                    lesson.lessonTypeColor
                      ? {
                          backgroundColor: hexToRgba(lesson.lessonTypeColor, 0.16),
                          borderColor: hexToRgba(lesson.lessonTypeColor, 0.7),
                          borderWidth: 1,
                          borderStyle: "solid",
                        }
                      : undefined
                  }
                >
                  <LessonDetailsDialogTrigger
                    locale={locale}
                    lesson={{
                      id: lesson.id,
                      title: lesson.title,
                      description: lesson.description,
                      startsAt: lesson.startsAt,
                      endsAt: lesson.endsAt,
                      trainerName: lesson.trainerName,
                      occupancy: lesson.occupancy,
                      queueLength: lesson.queueLength,
                      canViewWaitlist: lesson.canViewWaitlist,
                      isCourseLesson: lesson.isCourseLesson,
                      lessonTypeName: lesson.lessonTypeName,
                      lessonTypeIcon: lesson.lessonTypeIcon,
                      lessonTypeColor: lesson.lessonTypeColor,
                      canBroadcast: lesson.canBroadcast,
                    }}
                    labels={lessonDetailsLabels}
                    trigger={
                      <div className="w-full cursor-pointer rounded text-left hover:opacity-95">
                        <div className="flex items-center gap-3">
                          {lesson.lessonTypeIcon ? (
                            <LessonTypeIcon
                              iconPath={lesson.lessonTypeIcon}
                              colorHex={lesson.lessonTypeColor}
                              size={22}
                              title={lesson.lessonTypeName}
                            />
                          ) : null}
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{lesson.title}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {timeFmt.format(new Date(lesson.startsAt))} - {timeFmt.format(new Date(lesson.endsAt))}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {lessonDetailsLabels.trainerLabel}: {lesson.trainerName ?? "-"} ·{" "}
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {lessonDetailsLabels.bookedLabel}: {lesson.occupancy}
                              </span>
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">{formatDateTime(lesson.startsAt, locale)}</p>
                            <div className="mt-1 inline-flex gap-1">
                              <Badge variant={lesson.roleKind === "TRAINER" ? "info" : "neutral"}>
                                {lesson.roleKind === "TRAINER" ? labels.roleTrainer : labels.roleTrainee}
                              </Badge>
                              {lesson.bookingStatus === "PENDING" ? <Badge variant="warning">{labels.bookingPending}</Badge> : null}
                              {lesson.isCourseLesson ? <Badge variant="info">{lessonDetailsLabels.courseTag}</Badge> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-6">
        <CardHeader>
          <CardTitle>{labels.rankingTitle}</CardTitle>
          <p className="text-xs text-[var(--muted-foreground)]">{labels.rankingDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {showDevToggles ? (
            <Button
              type="button"
              size="sm"
              variant={includeFutureForRanking ? "default" : "outline"}
              onClick={() => setIncludeFutureForRanking((prev) => !prev)}
            >
              {labels.includeFuture}
            </Button>
          ) : null}
          {ranking.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.rankingEmpty}</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between rounded-md border border-[var(--surface-border)] px-3 py-2">
                  <span className="text-sm">
                    {index + 1}. {item.type}
                  </span>
                  <span className="text-sm font-semibold">
                    {item.count} {labels.lessonsCountSuffix}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-12">
        <CardHeader>
          <CardTitle>{labels.totalTimeTitle}</CardTitle>
          <p className="text-xs text-[var(--muted-foreground)]">{labels.totalTimeDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {showDevToggles ? (
            <Button
              type="button"
              size="sm"
              variant={includeFutureForTime ? "default" : "outline"}
              onClick={() => setIncludeFutureForTime((prev) => !prev)}
            >
              {labels.includeFuture}
            </Button>
          ) : null}
          <p className="text-3xl font-semibold">
            {totalHours} <span className="text-base font-normal text-[var(--muted-foreground)]">{labels.totalTimeHours}</span>
          </p>
          {totalMinutes === 0 ? <p className="text-sm text-[var(--muted-foreground)]">{labels.totalTimeEmpty}</p> : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-12">
        <CardHeader>
          <CardTitle>{labels.chartTitle}</CardTitle>
          <p className="text-xs text-[var(--muted-foreground)]">{labels.chartDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{labels.chartRangeLabel}</span>
            <Button type="button" size="sm" variant={rangeView === "week" ? "default" : "outline"} onClick={() => setRangeView("week")}>
              {labels.chartRangeWeek}
            </Button>
            <Button type="button" size="sm" variant={rangeView === "month" ? "default" : "outline"} onClick={() => setRangeView("month")}>
              {labels.chartRangeMonth}
            </Button>
            <Button type="button" size="sm" variant={rangeView === "year" ? "default" : "outline"} onClick={() => setRangeView("year")}>
              {labels.chartRangeYear}
            </Button>
          </div>

          {chartData.rows.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.chartEmpty}</p>
          ) : (
            <ChartContainer config={chartData.config} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.rows}>
                  <defs>
                    {chartData.typeKeys.map((typeKey) => (
                      <pattern
                        key={`pattern-${typeKey.key}`}
                        id={`pattern-${typeKey.key}`}
                        width="6"
                        height="6"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill={hexToRgba(typeKey.color, 0.2)} />
                        <line x1="0" y1="0" x2="0" y2="6" stroke={typeKey.color} strokeWidth="2" />
                      </pattern>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {chartData.typeKeys.map((typeKey) => (
                    <Bar
                      key={`${typeKey.key}-past`}
                      dataKey={typeKey.pastKey}
                      name={typeKey.type}
                      stackId={typeKey.key}
                      fill={typeKey.color}
                      stroke={typeKey.color}
                      strokeWidth={1}
                      fillOpacity={0.85}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                  {chartData.typeKeys.map((typeKey) => (
                    <Bar
                      key={`${typeKey.key}-future`}
                      dataKey={typeKey.futureKey}
                      name={`${typeKey.type} · future`}
                      stackId={typeKey.key}
                      fill={`url(#pattern-${typeKey.key})`}
                      stroke={typeKey.color}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      legendType="none"
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
