import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeInitializer } from "@/components/layout/theme-initializer";
import { SwRegister } from "@/components/pwa/sw-register";
import { AppToaster } from "@/components/ui/toaster";
import { getSiteSettingsSafe } from "@/lib/site-settings";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeInitializer />
        <SwRegister />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
