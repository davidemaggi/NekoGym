import type { NextConfig } from "next";

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
