import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const errorQuery = error ? `&error=${encodeURIComponent(error)}` : "";
  redirect(`/${locale}/login?tab=register${errorQuery}`);
}

