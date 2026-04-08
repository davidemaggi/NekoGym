import { NextResponse } from "next/server";

import { reconcileFutureLessonsForAllCourses } from "@/lib/lessons";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === configured) return true;

  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === configured;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await prisma.$transaction(async (tx) => {
      return reconcileFutureLessonsForAllCourses(tx);
    });

    return NextResponse.json({ ok: true, stats });
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to reconcile lessons" }, { status: 500 });
  }
}

