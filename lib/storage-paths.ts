import { resolve } from "node:path";

export const DATA_DIR = resolve(process.cwd(), "data");
export const SQLITE_DB_PATH = resolve(DATA_DIR, "nekogym.db");
export const SQLITE_DATABASE_URL = `file:${SQLITE_DB_PATH}`;
export const BACKUPS_DIR = resolve(DATA_DIR, "backups");
