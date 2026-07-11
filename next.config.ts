import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["davidemba", "nekogym.davidemaggi.casa", "davidemba.davehomelab.local"],
  deploymentId: process.env.DEPLOYMENT_VERSION,
  generateBuildId: async () => process.env.GIT_HASH ?? process.env.DEPLOYMENT_VERSION ?? null,
};

export default nextConfig;
