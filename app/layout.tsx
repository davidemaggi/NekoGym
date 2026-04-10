import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { SwRegister } from "@/components/pwa/sw-register";
import { AppToaster } from "@/components/ui/toaster";
import { prisma } from "@/lib/prisma";
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
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { siteName: true, siteLogoSvg: true },
  });
  const siteName = siteSettings?.siteName?.trim() || "NekoGym";
  const siteLogoSvg = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg);

  return {
    title: siteName,
    description: "Gym management platform",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: siteLogoSvg, type: "image/svg+xml" }],
      shortcut: [{ url: siteLogoSvg, type: "image/svg+xml" }],
      apple: [{ url: siteLogoSvg, type: "image/svg+xml" }],
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
      <head>
        <Script id="neko-theme-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const stored = localStorage.getItem('neko-theme');
              const theme = stored === 'dark' ? 'dark' : 'light';
              document.documentElement.classList.toggle('dark', theme === 'dark');
              document.documentElement.setAttribute('data-theme', theme);
            } catch {}
          })();`}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground">
        <SwRegister />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
