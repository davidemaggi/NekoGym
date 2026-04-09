import { createServer } from "node:http";
import { createServer as createSecureServer } from "node:https";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";

import { loadEnvConfig } from "@next/env";
import next from "next";

loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

function isEnabled(value?: string): boolean {
  return value?.trim().toLowerCase() === "true";
}

async function main() {
  const [{ prisma }, { startBackgroundServices }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/server/background-services"),
  ]);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const log = (message: string) => {
    console.log(`[custom-server] ${message}`);
  };

  const stopBackgroundServices = startBackgroundServices(log);

  const requestHandler = (req: IncomingMessage, res: ServerResponse) => {
    void handle(req, res);
  };

  const useHttps = isEnabled(process.env.DEV_HTTPS);
  const httpsStrict = isEnabled(process.env.DEV_HTTPS_STRICT);
  const certFile = process.env.DEV_HTTPS_CERT_FILE?.trim();
  const keyFile = process.env.DEV_HTTPS_KEY_FILE?.trim();
  const passphrase = process.env.DEV_HTTPS_PASSPHRASE;

  let protocol = "http";
  let server = createServer(requestHandler);

  if (useHttps) {
    try {
      if (!certFile || !keyFile) {
        throw new Error("DEV_HTTPS_CERT_FILE and DEV_HTTPS_KEY_FILE are required when DEV_HTTPS=true");
      }

      const cert = readFileSync(certFile);
      const key = readFileSync(keyFile);
      server = createSecureServer({ cert, key, passphrase }, requestHandler);
      protocol = "https";
      log(`HTTPS enabled with certificate ${certFile}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (httpsStrict) {
        throw new Error(`[custom-server] HTTPS bootstrap failed: ${message}`);
      }

      log(`HTTPS bootstrap failed, falling back to HTTP: ${message}`);
    }
  }

  let shuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`Received ${signal}, shutting down...`);

    stopBackgroundServices();

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void gracefulShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
  });

  server.listen(port, hostname, () => {
    log(`Listening on ${protocol}://${hostname}:${port} (${dev ? "dev" : "prod"})`);
  });
}

void main();



