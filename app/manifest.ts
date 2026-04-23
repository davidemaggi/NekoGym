import type { MetadataRoute } from "next";

import { getSiteSettingsSafe } from "@/lib/site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteSettings = await getSiteSettingsSafe();
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
