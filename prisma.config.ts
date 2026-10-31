import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

// Same resolution as lib/storage-paths.ts (NEKOGYM_DATA_DIR, default ./data).
const dataDir = resolve(process.cwd(), process.env.NEKOGYM_DATA_DIR?.trim() || "data");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${resolve(dataDir, "nekogym.db")}`,
  },
});
