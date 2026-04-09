import { prisma } from "@/lib/prisma";

type LessonRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  maxAttendees: number;
  bookedCount: number;
  courseName: string | null;
  lessonTypeName: string | null;
  trainerName: string | null;
  isTrainer: boolean;
  isBooked: boolean;
};

type MyLessonsResult =
  | { ok: false; reason: "not-linked" }
  | {
      ok: true;
      userName: string;
      lessons: LessonRow[];
    };

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function endAfterSevenDaysInclusive(from: Date) {
  const end = new Date(from);
  end.setDate(end.getDate() + 8);
  return end;
}

export async function getMyLessonsForTelegramChat(chatId: string): Promise<MyLessonsResult> {
  const user = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true, name: true },
  });

  if (!user) {
    return { ok: false, reason: "not-linked" };
  }

  const from = startOfToday();
  const to = endAfterSevenDaysInclusive(from);

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      startsAt: {
        gte: from,
        lt: to,
      },
      OR: [{ trainerId: user.id }, { bookings: { some: { traineeId: user.id } } }],
    },
    include: {
      course: { select: { name: true } },
      lessonType: { select: { name: true } },
      trainer: { select: { name: true } },
      bookings: {
        where: { traineeId: user.id },
        select: { id: true },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  return {
    ok: true,
    userName: user.name,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      startsAt: lesson.startsAt,
      endsAt: lesson.endsAt,
      maxAttendees: lesson.maxAttendees,
      bookedCount: lesson._count.bookings,
      courseName: lesson.course?.name ?? null,
      lessonTypeName: lesson.lessonType?.name ?? null,
      trainerName: lesson.trainer?.name ?? null,
      isTrainer: lesson.trainerId === user.id,
      isBooked: lesson.bookings.length > 0,
    })),
  };
}

