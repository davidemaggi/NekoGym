import { createServer } from "node:http";

import { loadEnvConfig } from "@next/env";
import next from "next";

loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

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

  const server = createServer((req, res) => {
    void handle(req, res);
  });

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
    log(`Listening on http://${hostname}:${port} (${dev ? "dev" : "prod"})`);
  });
}

void main();



