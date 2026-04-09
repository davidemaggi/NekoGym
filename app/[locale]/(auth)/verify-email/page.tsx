import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n";

import { verifyEmailAction } from "../actions";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale }, { token }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  return (
    <form action={verifyEmailAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token ?? ""} />
      <p className="text-sm text-[var(--muted-foreground)]">
        {locale === "it" ? "Verifica in corso..." : "Verifying email..."}
      </p>
      <button
        type="submit"
        className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
      >
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </form>
  );
}

