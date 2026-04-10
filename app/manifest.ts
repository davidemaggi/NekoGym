import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { siteName: true, siteLogoSvg: true },
  });
  const siteName = siteSettings?.siteName?.trim() || "NekoGym";
  const siteLogoSvg = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg);

  return {
    name: siteName,
    short_name: siteName,
    description: "Gym management platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: siteLogoSvg,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: siteLogoSvg,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}

