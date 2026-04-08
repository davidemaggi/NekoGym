import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

import { registerAction } from "../actions";

export default async function RegisterPage({
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
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.auth.registerTitle}</h1>

      <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {t.auth.firstUserHint}
      </p>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={registerAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />

        <label className="block text-sm">
          <span className="mb-1 block">{t.auth.nameLabel}</span>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block">{t.auth.emailLabel}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block">{t.auth.passwordLabel}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t.auth.registerCta}
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {t.auth.hasAccount}{" "}
        <Link href={`/${locale}/login`} className="font-medium underline">
          {t.auth.loginCta}
        </Link>
      </p>
    </section>
  );
}

