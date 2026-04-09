import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

import { loginAction, resendVerificationAction } from "../actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const [{ locale }, { error, info }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.auth.loginTitle}</h1>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {info ? (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {decodeURIComponent(info)}
        </p>
      ) : null}

      <form action={loginAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />

        <label className="block text-sm">
          <span className="mb-1 block">{t.auth.emailLabel}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block">{t.auth.passwordLabel}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
        >
          {t.auth.loginCta}
        </button>
      </form>

      <form action={resendVerificationAction} className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="block text-sm">
          <span className="mb-1 block">{locale === "it" ? "Reinvia verifica email" : "Resend email verification"}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          {locale === "it" ? "Reinvia link" : "Resend link"}
        </button>
      </form>

      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href={`/${locale}/forgot-password`} className="font-medium underline">
          {locale === "it" ? "Password dimenticata?" : "Forgot password?"}
        </Link>
      </p>

      <p className="text-sm text-[var(--muted-foreground)]">
        {t.auth.noAccount}{" "}
        <Link href={`/${locale}/register`} className="font-medium underline">
          {t.auth.registerCta}
        </Link>
      </p>
    </section>
  );
}

