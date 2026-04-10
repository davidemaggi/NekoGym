import type { CSSProperties } from "react";

import { sanitizeLessonTypeColor } from "@/lib/lesson-type-icons";

type LessonTypeIconProps = {
  iconPath: string;
  colorHex?: string | null;
  size?: number;
  className?: string;
  title?: string;
};

export function LessonTypeIcon({ iconPath, colorHex, size = 16, className = "", title }: LessonTypeIconProps) {
  const color = sanitizeLessonTypeColor(colorHex);
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    maskImage: `url(${iconPath})`,
    maskRepeat: "no-repeat",
    maskPosition: "center",
    maskSize: "contain",
    WebkitMaskImage: `url(${iconPath})`,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
  };

  return <span aria-hidden="true" title={title} className={`inline-block shrink-0 ${className}`} style={style} />;
}

