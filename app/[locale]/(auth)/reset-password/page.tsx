import Link from "next/link";
import { notFound } from "next/navigation";

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
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {locale === "it" ? "Nuova password" : "Set new password"}
      </h1>

      {error ? (
        <p className="rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-fg)] dark:bg-red-900/30 dark:text-red-300">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={resetPasswordAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token ?? ""} />

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
          {locale === "it" ? "Aggiorna password" : "Update password"}
        </button>
      </form>

      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href={`/${locale}/login`} className="font-medium underline">
          {t.auth.loginCta}
        </Link>
      </p>
    </section>
  );
}

