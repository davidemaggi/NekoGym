import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import {
  LESSON_TYPE_COLOR_PALETTE,
  sanitizeLessonTypeColor,
  sanitizeLessonTypeIconPath,
} from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";

import { RegistriesManager } from "@/app/[locale]/(app)/settings/registries/registries-manager";

export default async function RegistriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAnyRole(["ADMIN", "TRAINER"], locale);

  const lessonTypes = await prisma.lessonType.findMany({
    orderBy: { name: "asc" },
  });

  const iconOptions = await getLessonTypeIconOptions();

  const safeLessonTypes = lessonTypes.map((type) => ({
    ...type,
    iconSvg: sanitizeLessonTypeIconPath(type.iconSvg, iconOptions),
    colorHex: sanitizeLessonTypeColor(type.colorHex),
  }));

  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).registries;

  return (
    <RegistriesManager
      locale={locale}
      labels={labels}
      lessonTypes={safeLessonTypes}
      iconOptions={iconOptions}
      colorOptions={LESSON_TYPE_COLOR_PALETTE}
    />
  );
}

