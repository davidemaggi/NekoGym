import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

const LESSON_TYPE_ICONS_PUBLIC_DIR = path.join(process.cwd(), "public", "icons", "lessontypes");
const LESSON_TYPE_ICONS_BASE_PATH = "/icons/lessontypes";

export async function getLessonTypeIconOptions(): Promise<string[]> {
  try {
    const entries = await readdir(LESSON_TYPE_ICONS_PUBLIC_DIR, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".svg"))
      .map((entry) => `${LESSON_TYPE_ICONS_BASE_PATH}/${entry.name}`)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

