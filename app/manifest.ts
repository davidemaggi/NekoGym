import type { MetadataRoute } from "next";

import { getSiteSettingsSafe } from "@/lib/site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteSettings = await getSiteSettingsSafe();
  const siteName = siteSettings?.siteName?.trim() || "NekoGym";

  return {
    name: siteName,
    short_name: siteName,
    description: "Prenotazioni, lezioni e corsi della palestra",
    start_url: "/",
    display: "standalone",
    // Splash and system bars match the app paper (same as the light themeColor in app/layout.tsx).
    background_color: "#f5f6f8",
    theme_color: "#f5f6f8",
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
