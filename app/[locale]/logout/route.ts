import { NextResponse } from "next/server";

import { logoutCurrentUser } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await context.params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  await logoutCurrentUser();

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
}

