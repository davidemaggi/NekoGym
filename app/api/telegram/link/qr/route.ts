import QRCode from "qrcode";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTelegramStartLink } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const linkToken = await prisma.telegramLinkToken.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });

  if (!linkToken) {
    return new NextResponse("Token not found", { status: 404 });
  }

  const deepLink = buildTelegramStartLink(linkToken.token);
  if (!deepLink) {
    return new NextResponse("Telegram bot username is not configured", { status: 400 });
  }

  const svg = await QRCode.toString(deepLink, {
    type: "svg",
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}



