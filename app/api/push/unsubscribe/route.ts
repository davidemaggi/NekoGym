import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UnsubscribePayload = {
  endpoint?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: UnsubscribePayload;
  try {
    body = (await request.json()) as UnsubscribePayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload" }, { status: 400 });
  }
  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ ok: false, message: "Invalid endpoint" }, { status: 400 });
  }

  await prisma.webPushSubscription.deleteMany({
    where: {
      endpoint,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
