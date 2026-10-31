import { resolve } from "node:path";

// NEKOGYM_DATA_DIR lets a test/demo run point at a throwaway data folder; default is ./data.
export const DATA_DIR = resolve(process.cwd(), process.env.NEKOGYM_DATA_DIR?.trim() || "data");
export const SQLITE_DB_PATH = resolve(DATA_DIR, "nekogym.db");
export const SQLITE_DATABASE_URL = `file:${SQLITE_DB_PATH}`;
export const BACKUPS_DIR = resolve(DATA_DIR, "backups");
