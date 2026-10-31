import type { NextConfig } from "next";

// Keep `next dev` / `next start` aligned with the custom server: process time zone = gym time zone.
process.env.TZ =
  process.env.NEXT_PUBLIC_APP_DATETIME_TIMEZONE?.trim() || process.env.APP_DATETIME_TIMEZONE?.trim() || "Europe/Rome";

function toDeploymentId(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  return normalized || undefined;
}

const deploymentId = toDeploymentId(process.env.DEPLOYMENT_VERSION);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["davidemba", "nekogym.davidemaggi.casa", "davidemba.davehomelab.local"],
  deploymentId,
  generateBuildId: async () => process.env.GIT_HASH ?? deploymentId ?? null,
};

export default nextConfig;
