import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { siteName: true },
  });
  const siteName = siteSettings?.siteName?.trim() || "NekoGym";

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
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
