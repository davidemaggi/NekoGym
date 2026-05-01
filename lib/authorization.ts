import { redirect } from "next/navigation";

import { getCurrentUser, type UserRole } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";

function sanitizeLocale(locale?: string) {
  return locale && isLocale(locale) ? locale : defaultLocale;
}

export async function requireAuth(locale?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const safeLocale = sanitizeLocale(locale);
    redirect(`/${safeLocale}/login`);
  }

  return user;
}

export async function requireAnyRole(allowedRoles: UserRole[], locale?: string) {
  const user = await requireAuth(locale);

  if (!allowedRoles.includes(user.role)) {
    const safeLocale = sanitizeLocale(locale);
    redirect(`/${safeLocale}`);
  }

  return user;
}
