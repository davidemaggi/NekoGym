"use client";

import { Check } from "lucide-react";

import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { hexToRgba, type LessonTypeColorOption } from "@/lib/lesson-type-icons";
import { cn } from "@/lib/utils";

/** "kettlebell-swing.svg" → "Kettlebell swing": the spoken name of an icon. */
function iconName(iconPath: string): string {
  const base = iconPath.replace("/icons/lessontypes/", "").replace(/\.svg$/, "").replace(/[-_.]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Icon and colour of a lesson type, chosen by sight: a live preview, a grid of icons and a
 * palette of swatches. Both are native radio groups (posted as `iconSvg` and `colorHex`).
 */
export function LessonTypeAppearancePicker({
  prefix,
  locale,
  name,
  icon,
  onIconChange,
  color,
  onColorChange,
  icons,
  colors,
  labels,
}: {
  prefix: string;
  locale: string;
  name: string;
  icon: string;
  onIconChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  icons: string[];
  colors: LessonTypeColorOption[];
  labels: { icon: string; color: string; preview: string; previewPlaceholder: string };
}) {
  return (
    <div className="space-y-5">
      <div aria-live="polite" className="flex items-center gap-4 rounded-2xl bg-[var(--muted)] p-4">
        <span
          aria-hidden="true"
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: hexToRgba(color, 0.18), border: `1px solid ${hexToRgba(color, 0.45)}` }}
        >
          {icon ? <LessonTypeIcon iconPath={icon} colorHex={color} size={30} /> : null}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">{labels.preview}</p>
          <p className="mt-0.5 flex items-center gap-2 text-[17px] font-semibold leading-snug">
            {icon ? <LessonTypeIcon iconPath={icon} colorHex={color} size={18} /> : null}
            <span className={cn("min-w-0 truncate", name.trim() ? "" : "text-[var(--muted-foreground)]")}>
              {name.trim() || labels.previewPlaceholder}
            </span>
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="text-[15px] font-semibold">{labels.icon}</legend>
        <div className="mt-2 grid max-h-60 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5 overflow-y-auto rounded-xl border border-[var(--rule)] p-2">
          {icons.map((option) => {
            const selected = option === icon;
            return (
              <label
                key={option}
                title={iconName(option)}
                className={cn(
                  "relative inline-flex h-11 cursor-pointer items-center justify-center rounded-lg transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]",
                  selected ? "ring-2 ring-[var(--foreground)]" : "hover:bg-[var(--muted)]"
                )}
                style={selected ? { backgroundColor: hexToRgba(color, 0.18) } : undefined}
              >
                <input
                  type="radio"
                  name="iconSvg"
                  value={option}
                  checked={selected}
                  onChange={() => onIconChange(option)}
                  required
                  aria-label={iconName(option)}
                  className="sr-only"
                  id={`${prefix}-icon-${option}`}
                />
                {selected ? (
                  <LessonTypeIcon iconPath={option} colorHex={color} size={24} />
                ) : (
                  // Unchosen icons follow the theme's secondary ink, legible on light and dark surfaces.
                  <span
                    aria-hidden="true"
                    className="inline-block h-6 w-6 bg-[var(--muted-foreground)]"
                    style={{
                      maskImage: `url(${option})`,
                      WebkitMaskImage: `url(${option})`,
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center",
                    }}
                  />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-semibold">{labels.color}</legend>
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
          {colors.map((option) => {
            const selected = option.value === color;
            const spoken = locale === "it" ? option.labelIt : option.label;
            return (
              <label
                key={option.value}
                title={spoken}
                className="relative inline-flex h-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)] has-[:focus-visible]:ring-offset-2"
              >
                <input
                  type="radio"
                  name="colorHex"
                  value={option.value}
                  checked={selected}
                  onChange={() => onColorChange(option.value)}
                  required
                  aria-label={spoken}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition-shadow",
                    selected ? "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--foreground)]" : ""
                  )}
                  style={{ backgroundColor: option.value }}
                >
                  {selected ? <Check size={18} strokeWidth={3} /> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
