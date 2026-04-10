import { ImageResponse } from "next/og";
import { promises as fs } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_LOGO_SVG, sanitizeSiteLogoSvg } from "@/lib/site-logo";

export const runtime = "nodejs";

function parseSize(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 192;
  return Math.min(1024, Math.max(64, parsed));
}

async function loadLogoSvgDataUrl(logoPath: string): Promise<string> {
  const relative = logoPath.startsWith("/") ? logoPath.slice(1) : logoPath;
  const absolute = path.join(process.cwd(), "public", relative);

  try {
    const content = await fs.readFile(absolute, "utf8");
    return `data:image/svg+xml;base64,${Buffer.from(content, "utf8").toString("base64")}`;
  } catch {
    const fallbackAbsolute = path.join(process.cwd(), "public", DEFAULT_SITE_LOGO_SVG.slice(1));
    const fallback = await fs.readFile(fallbackAbsolute, "utf8");
    return `data:image/svg+xml;base64,${Buffer.from(fallback, "utf8").toString("base64")}`;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const size = parseSize(url.searchParams.get("size"));

  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { siteLogoSvg: true },
  });
  const logoPath = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg);
  const logoDataUrl = await loadLogoSvgDataUrl(logoPath);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderRadius: size * 0.18,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUrl}
          alt="NekoGym"
          width={Math.round(size * 0.82)}
          height={Math.round(size * 0.82)}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
