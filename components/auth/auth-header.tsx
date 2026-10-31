import Image from "next/image";

import { DEFAULT_SITE_LOGO_SVG, sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Gym identity at the top of every sign-in page, so a link from an email never lands
 * on an anonymous card. On the login page the gym name is the page heading.
 */
export async function AuthHeader({
  fallbackName,
  asHeading = false,
  headingSuffix,
}: {
  fallbackName: string;
  asHeading?: boolean;
  /** Screen-reader only: what this page is (e.g. "Accedi"). */
  headingSuffix?: string;
}) {
  const siteSettings = await getSiteSettings();
  const logoSrc = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg ?? DEFAULT_SITE_LOGO_SVG);
  const name = siteSettings?.siteName ?? fallbackName;
  const Name = asHeading ? "h1" : "p";

  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <Image src={logoSrc} alt="" width={88} height={88} priority className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px]" />
      <Name className="text-[1.75rem] font-bold leading-tight">
        {name}
        {headingSuffix ? <span className="sr-only"> · {headingSuffix}</span> : null}
      </Name>
    </header>
  );
}
