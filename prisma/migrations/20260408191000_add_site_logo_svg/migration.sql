-- Add configurable site logo with a safe default SVG path.
ALTER TABLE "SiteSettings"
ADD COLUMN "siteLogoSvg" TEXT NOT NULL DEFAULT '/logo-nekogym.svg';

