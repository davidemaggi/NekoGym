import { redirect } from "next/navigation";

import { getCurrentUser, type UserRole } from "@/lib/auth";
import { defaultLocale } from "@/lib/i18n";

export async function requireAuth(locale?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const safeLocale = locale ?? defaultLocale;
    redirect(`/${safeLocale}/login`);
  }

  return user;
}

export async function requireAnyRole(allowedRoles: UserRole[], locale?: string) {
  const user = await requireAuth(locale);

  if (!allowedRoles.includes(user.role)) {
    const safeLocale = locale ?? defaultLocale;
    redirect(`/${safeLocale}`);
  }

  return user;
}

