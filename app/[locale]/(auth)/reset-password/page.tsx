import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { AuthHeader } from "@/components/auth/auth-header";
import { AuthField, AuthNotice, authSubmitClass } from "@/components/auth/auth-ui";
import { getDictionary, isLocale } from "@/lib/i18n";

import { resetPasswordAction } from "../actions";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const [{ locale }, { token, error }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <section className="space-y-6">
      <AuthHeader fallbackName={t.appName} />
      <h1 className="text-[17px] font-semibold leading-snug">{locale === "it" ? "Nuova password" : "Set new password"}</h1>

      {error ? <AuthNotice tone="error">{decodeURIComponent(error)}</AuthNotice> : null}

      {!token ? (
        <AuthNotice tone="error">
          {locale === "it"
            ? "Questo link non è valido o è incompleto. Richiedi un nuovo link di recupero."
            : "This link is invalid or incomplete. Request a new reset link."}{" "}
          <Link href={`/${locale}/forgot-password`} className="underline underline-offset-4">
            {locale === "it" ? "Recupera password" : "Reset password"}
          </Link>
        </AuthNotice>
      ) : (
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token ?? ""} />

        <AuthField id="reset-password" label={t.auth.passwordLabel} hint={t.auth.passwordHint} name="password" type="password" autoComplete="new-password" required minLength={8} />

        <button type="submit" className={authSubmitClass}>
          {locale === "it" ? "Aggiorna password" : "Update password"}
        </button>
      </form>
      )}

      <p className="border-t border-[var(--rule)] pt-4 text-[15px]">
        <Link href={`/${locale}/login`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-[1.5px] underline-offset-4">
          <ArrowLeft size={16} aria-hidden="true" />
          {t.auth.loginCta}
        </Link>
      </p>
    </section>
  );
}

