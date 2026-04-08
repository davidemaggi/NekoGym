import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/authorization";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireAuth(locale);

  if (user.role === "ADMIN") {
    redirect(`/${locale}/settings/site`);
  }

  redirect(`/${locale}/settings/registries`);
}

