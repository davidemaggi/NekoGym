export type LessonTypeColorOption = {
  value: string;
  label: string;
};

export const LESSON_TYPE_COLOR_PALETTE: LessonTypeColorOption[] = [
  { value: "#2563EB", label: "Ocean Blue" },
  { value: "#4F46E5", label: "Indigo" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#9333EA", label: "Purple" },
  { value: "#C026D3", label: "Fuchsia" },
  { value: "#DB2777", label: "Magenta" },
  { value: "#E11D48", label: "Rose" },
  { value: "#DC2626", label: "Ruby" },
  { value: "#EA580C", label: "Amber Red" },
  { value: "#D97706", label: "Amber" },
  { value: "#CA8A04", label: "Gold" },
  { value: "#65A30D", label: "Lime" },
  { value: "#16A34A", label: "Green" },
  { value: "#059669", label: "Emerald" },
  { value: "#0D9488", label: "Teal" },
  { value: "#0891B2", label: "Cyan" },
  { value: "#0284C7", label: "Sky" },
  { value: "#1D4ED8", label: "Royal Blue" },
  { value: "#475569", label: "Slate" },
  { value: "#6B7280", label: "Stone" },
];

const LESSON_TYPE_COLOR_SET = new Set(LESSON_TYPE_COLOR_PALETTE.map((item) => item.value));
const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/;
const DEFAULT_LESSON_TYPE_COLOR = LESSON_TYPE_COLOR_PALETTE[0]?.value ?? "#2563EB";

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


export function isLessonTypeColorHex(value: string): boolean {
  return HEX_COLOR_REGEX.test(value) && LESSON_TYPE_COLOR_SET.has(value);
}

export function sanitizeLessonTypeColor(
  value: string | null | undefined,
  fallback: string = DEFAULT_LESSON_TYPE_COLOR
): string {
  if (!value) return fallback;
  const normalized = value.toUpperCase();
  return isLessonTypeColorHex(normalized) ? normalized : fallback;
}

export function hexToRgba(hex: string, alpha: number): string {
  const safe = sanitizeLessonTypeColor(hex);
  const r = Number.parseInt(safe.slice(1, 3), 16);
  const g = Number.parseInt(safe.slice(3, 5), 16);
  const b = Number.parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

