import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/authorization";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAuth(locale);
  redirect(`/${locale}/settings/profile`);
}

