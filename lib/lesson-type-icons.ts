import { readdir } from "node:fs/promises";
import path from "node:path";

const LESSON_TYPE_ICONS_PUBLIC_DIR = path.join(process.cwd(), "public", "icons", "lessontypes");
const LESSON_TYPE_ICONS_BASE_PATH = "/icons/lessontypes";

export function isLessonTypeIconPath(value: string): boolean {
  return /^\/icons\/lessontypes\/[a-zA-Z0-9._-]+\.svg$/.test(value);
}

export function sanitizeLessonTypeIconPath(
  value: string | null | undefined,
  iconOptions: string[],
  fallback?: string
): string {
  if (value && isLessonTypeIconPath(value) && iconOptions.includes(value)) {
    return value;
  }

  return fallback ?? iconOptions[0] ?? "";
}

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

