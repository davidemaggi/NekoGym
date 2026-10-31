import { notFound } from "next/navigation";

import { MailCheck } from "lucide-react";

import { AuthHeader } from "@/components/auth/auth-header";
import { authSubmitClass } from "@/components/auth/auth-ui";
import { getDictionary, isLocale } from "@/lib/i18n";

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
      <AuthHeader fallbackName={getDictionary(locale).appName} />
      <h1 className="inline-flex items-center gap-2 text-[17px] font-semibold leading-snug">
        <MailCheck size={20} aria-hidden="true" />
        {locale === "it" ? "Conferma la tua email" : "Confirm your email"}
      </h1>
      <button type="submit" className={authSubmitClass}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </form>
  );
}

