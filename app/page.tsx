import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { pickLocale } from "@/lib/i18n";

export default async function Home() {
  const requestHeaders = await headers();
  const locale = pickLocale(requestHeaders.get("accept-language"));

  redirect(`/${locale}`);
}
