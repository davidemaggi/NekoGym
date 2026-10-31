import { notFound } from "next/navigation";

import { MailCheck } from "lucide-react";

import { authSubmitClass } from "@/components/auth/auth-ui";
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
    <form action={verifyEmailAction} className="space-y-6 text-center">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token ?? ""} />
      <MailCheck size={40} aria-hidden="true" className="mx-auto text-[var(--stock-ink)]" />
      <h1 className="text-[1.75rem] font-bold leading-tight">
        {locale === "it" ? "Conferma la tua email" : "Confirm your email"}
      </h1>
      <button type="submit" className={authSubmitClass}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </form>
  );
}

