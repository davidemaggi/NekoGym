import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";

import { SwRegister } from "@/components/pwa/sw-register";
import { AppToaster } from "@/components/ui/toaster";
import { getSiteSettingsSafe } from "@/lib/site-settings";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import "./globals.css";

// Variable width axis: condensed cuts set times and counts like a printed ticket.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

// Only for codes (TOTP secret, chat ids), never as decoration.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Runs before paint: stored choice wins, otherwise follow the system theme. Avoids a light flash in dark mode.
const themeScript = `(() => {
  try {
    const stored = localStorage.getItem("neko-theme");
    const theme = stored === "dark" || stored === "light"
      ? stored
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch {}
})();`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#12142a" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettingsSafe();
  const siteName = siteSettings?.siteName?.trim() || "NekoGym";
  const siteLogoSvg = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg);

  return {
    title: siteName,
    description: "Gym management platform",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: siteLogoSvg, type: "image/svg+xml" }],
      shortcut: [{ url: siteLogoSvg, type: "image/svg+xml" }],
      apple: [{ url: "/api/pwa-icon?size=180", type: "image/png", sizes: "180x180" }],
      other: [
        { rel: "manifest", url: "/manifest.webmanifest" },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <SwRegister />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
