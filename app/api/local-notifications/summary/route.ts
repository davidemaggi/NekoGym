import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseSince(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = parseSince(url.searchParams.get("since"));
  const now = new Date();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationsLastSeenAt: true },
  });
  const lastSeenAt = fullUser?.notificationsLastSeenAt ?? null;

  const unreadCount = await prisma.localNotification.count({
    where: {
      userId: user.id,
      ...(lastSeenAt ? { createdAt: { gt: lastSeenAt } } : {}),
    },
  });

  const newItems = await prisma.localNotification.findMany({
    where: {
      userId: user.id,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      body: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    unreadCount,
    lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
    now: now.toISOString(),
    newItems: newItems.map((item) => ({
      id: item.id,
      subject: item.subject,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
