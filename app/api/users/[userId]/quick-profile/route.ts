import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (currentUser.role !== "ADMIN" && currentUser.role !== "TRAINER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!target) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const now = new Date();

  const bookings = await prisma.lessonBooking.findMany({
    where: {
      traineeId: userId,
      lesson: {
        deletedAt: null,
        status: "SCHEDULED",
      },
    },
    select: {
      status: true,
      lesson: {
        select: {
          startsAt: true,
          lessonType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      lesson: {
        startsAt: "asc",
      },
    },
  });

  const pastByType = new Map<string, number>();
  const futureByType = new Map<string, number>();
  const completedLessonDates: Date[] = [];

  for (const booking of bookings) {
    const lessonDate = booking.lesson.startsAt;
    const typeName = booking.lesson.lessonType?.name ?? "-";

    if (lessonDate < now && booking.status === "CONFIRMED") {
      pastByType.set(typeName, (pastByType.get(typeName) ?? 0) + 1);
      completedLessonDates.push(lessonDate);
      continue;
    }

    if (lessonDate >= now && (booking.status === "CONFIRMED" || booking.status === "PENDING")) {
      futureByType.set(typeName, (futureByType.get(typeName) ?? 0) + 1);
    }
  }

  const firstLessonAt = completedLessonDates.length > 0 ? completedLessonDates[0] : null;
  const lastLessonAt = completedLessonDates.length > 0 ? completedLessonDates[completedLessonDates.length - 1] : null;

  const toEntries = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return NextResponse.json({
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      createdAt: target.createdAt.toISOString(),
    },
    stats: {
      completedByType: toEntries(pastByType),
      futureByType: toEntries(futureByType),
      firstCompletedLessonAt: firstLessonAt ? firstLessonAt.toISOString() : null,
      lastCompletedLessonAt: lastLessonAt ? lastLessonAt.toISOString() : null,
    },
  });
}

