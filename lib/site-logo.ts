export const DEFAULT_SITE_LOGO_SVG = "/logo-nekogym.svg";

const LOCAL_SVG_PATH_PATTERN = /^\/[a-zA-Z0-9._/-]+\.svg$/;

export function isSiteLogoSvgPathValid(value: string | null | undefined): boolean {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return LOCAL_SVG_PATH_PATTERN.test(trimmed);
}

export function sanitizeSiteLogoSvg(value: string | null | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  // Keep logo sources local to /public to avoid invalid/remote URLs in next/image.
  return isSiteLogoSvgPathValid(trimmed) ? trimmed : DEFAULT_SITE_LOGO_SVG;
}


