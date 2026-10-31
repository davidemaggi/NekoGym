import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { AuthField, AuthNotice, authSubmitClass } from "@/components/auth/auth-ui";
import { getDictionary, isLocale } from "@/lib/i18n";

import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <section className="space-y-6">
      <h1 className="text-[1.75rem] font-bold leading-tight">{locale === "it" ? "Recupera password" : "Reset password"}</h1>

      {error ? <AuthNotice tone="error">{decodeURIComponent(error)}</AuthNotice> : null}

      <form action={requestPasswordResetAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <AuthField id="forgot-email" label={t.auth.emailLabel} name="email" type="email" autoComplete="email" required />

        <button type="submit" className={authSubmitClass}>
          {locale === "it" ? "Invia link di recupero" : "Send reset link"}
        </button>
      </form>

      <p className="border-t border-[var(--rule)] pt-4 text-[15px]">
        <Link href={`/${locale}/login`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-[1.5px] underline-offset-4">
          <ArrowLeft size={16} aria-hidden="true" />
          {t.auth.loginCta}
        </Link>
      </p>
    </section>
  );
}

