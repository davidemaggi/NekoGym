import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PushSubscriptionPayload = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PushSubscriptionPayload;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, message: "Invalid subscription payload" }, { status: 400 });
  }

  await prisma.webPushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh,
      auth,
      userId: user.id,
      userAgent: request.headers.get("user-agent") ?? null,
    },
    update: {
      p256dh,
      auth,
      userId: user.id,
      userAgent: request.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

