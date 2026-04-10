import { NextResponse } from "next/server";

import { loginWithMagicLinkToken } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await context.params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?error=${encodeURIComponent(locale === "it" ? "Link non valido o scaduto." : "Invalid or expired link.")}&method=magic`,
        request.url
      )
    );
  }

  try {
    await loginWithMagicLinkToken({ locale, token });
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : locale === "it"
          ? "Link non valido o scaduto."
          : "Invalid or expired link.";

    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(message)}&method=magic`, request.url)
    );
  }
}

