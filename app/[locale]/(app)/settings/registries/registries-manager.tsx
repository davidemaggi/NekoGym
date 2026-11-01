"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Plus, Trash2 } from "lucide-react";

import {
  createLessonTypeAction,
  deleteLessonTypeAction,
  updateLessonTypeAction,
} from "@/app/[locale]/(app)/courses/actions";
import { PageBand } from "@/components/layout/page-band";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LessonTypeAppearancePicker } from "@/components/lesson-types/lesson-type-appearance-picker";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import type { LessonTypeColorOption } from "@/lib/lesson-type-icons";
import { hexToRgba } from "@/lib/lesson-type-icons";

type LessonTypeItem = {
  id: string;
  name: string;
  description: string | null;
  iconSvg: string;
  colorHex: string;
};

type RegistriesManagerProps = {
  locale: string;
  lessonTypes: LessonTypeItem[];
  iconOptions: string[];
  colorOptions: LessonTypeColorOption[];
  labels: {
    title: string;
    subtitle: string;
    tabs: {
      lessonTypes: string;
    };
    lessonTypes: {
      title: string;
      description: string;
      nameLabel: string;
      descriptionLabel: string;
      iconSvgLabel: string;
      colorLabel: string;
      previewLabel: string;
      previewPlaceholder: string;
      createCta: string;
      editCta: string;
      updateTitle: string;
      updateCta: string;
      deleteCta: string;
      deleteConfirmTitle: string;
      deleteConfirmDescription: string;
      cancelCta: string;
      processing: string;
      empty: string;
    };
  };
};

export function RegistriesManager({ locale, lessonTypes, labels, iconOptions, colorOptions }: RegistriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<LessonTypeItem | null>(null);
  const [deletingType, setDeletingType] = useState<LessonTypeItem | null>(null);
  const defaultIcon = iconOptions[0] ?? "";
  const defaultColor = colorOptions[0]?.value ?? "#2563EB";
  const [createIcon, setCreateIcon] = useState(defaultIcon);
  const [createColor, setCreateColor] = useState(defaultColor);
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState(defaultColor);
  // The name typed in whichever type form is open, for the live preview.
  const [previewName, setPreviewName] = useState("");

  function openEdit(type: LessonTypeItem) {
    setPreviewName(type.name);
    setEditIcon(type.iconSvg);
    setEditColor(type.colorHex ?? defaultColor);
    setEditingType(type);
  }

  function onCreateLessonType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await createLessonTypeAction(formData);
      if (result.ok) {
        toast.success(result.message);
        form.reset();
        setCreateOpen(false);
        setCreateIcon(defaultIcon);
        setCreateColor(defaultColor);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onDeleteLessonType(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await deleteLessonTypeAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setDeletingType(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onUpdateLessonType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingType) return;

    const formData = new FormData(event.currentTarget);
    formData.set("id", editingType.id);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await updateLessonTypeAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setEditingType(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function renderTypeFields(prefix: string, icon: string, setIcon: (value: string) => void, color: string, setColor: (value: string) => void, icons: string[], defaults?: LessonTypeItem) {
    return (
      <>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-name`}>{labels.lessonTypes.nameLabel}</Label>
          <Input
            id={`${prefix}-name`}
            name="name"
            required
            defaultValue={defaults?.name}
            onChange={(event) => setPreviewName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-description`}>{labels.lessonTypes.descriptionLabel}</Label>
          <Textarea id={`${prefix}-description`} name="description" defaultValue={defaults?.description ?? ""} />
        </div>
        <LessonTypeAppearancePicker
          prefix={prefix}
          locale={locale}
          name={previewName}
          icon={icon}
          onIconChange={setIcon}
          color={color}
          onColorChange={setColor}
          icons={icons}
          colors={colorOptions}
          labels={{
            icon: labels.lessonTypes.iconSvgLabel,
            color: labels.lessonTypes.colorLabel,
            preview: labels.lessonTypes.previewLabel,
            previewPlaceholder: labels.lessonTypes.previewPlaceholder,
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageBand
        title={labels.title}
        description={labels.subtitle}
        action={
          <Dialog
            open={createOpen}
            onOpenChange={(nextOpen) => {
              setCreateOpen(nextOpen);
              if (!nextOpen) {
                setCreateIcon(defaultIcon);
                setCreateColor(defaultColor);
                setPreviewName("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button aria-label={labels.lessonTypes.createCta} className="w-11 px-0 sm:w-auto sm:px-4" disabled={isPending}>
                <Plus size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{labels.lessonTypes.createCta}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{labels.lessonTypes.createCta}</DialogTitle>
                <DialogDescription>{labels.lessonTypes.description}</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onCreateLessonType}>
                {renderTypeFields("registry-lt", createIcon, setCreateIcon, createColor, setCreateColor, iconOptions)}
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                    {labels.lessonTypes.cancelCta}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <Plus size={18} aria-hidden="true" />
                    {isPending ? labels.lessonTypes.processing : labels.lessonTypes.createCta}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <section aria-labelledby="lesson-types-heading" className="max-w-3xl">
        <h2 id="lesson-types-heading" className="text-[17px] font-semibold">{labels.lessonTypes.title}</h2>
        <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">{labels.lessonTypes.description}</p>

        {lessonTypes.length === 0 ? (
          <p className="mt-6 text-[15px] text-[var(--muted-foreground)]">{labels.lessonTypes.empty}</p>
        ) : (
          <ul className="mt-3 border-t border-[var(--rule)]">
            {lessonTypes.map((type) => (
              <li key={type.id} className="border-b border-[var(--rule)]">
                <button
                  type="button"
                  onClick={() => openEdit(type)}
                  disabled={isPending}
                  aria-label={`${labels.lessonTypes.editCta}: ${type.name}`}
                  className="flex min-h-16 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--surface)]/60"
                >
                  <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: hexToRgba(type.colorHex, 0.16) }}>
                    <LessonTypeIcon iconPath={type.iconSvg} colorHex={type.colorHex} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug">{type.name}</span>
                    {type.description ? (
                      <span className="mt-0.5 block text-[15px] text-[var(--muted-foreground)]">{type.description}</span>
                    ) : null}
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(editingType)} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.lessonTypes.updateTitle}</DialogTitle>
            <DialogDescription>{labels.lessonTypes.description}</DialogDescription>
          </DialogHeader>

          {editingType ? (
            <form className="space-y-4" onSubmit={onUpdateLessonType}>
              {renderTypeFields("edit-lt", editIcon, setEditIcon, editColor, setEditColor, [...new Set([editingType.iconSvg, ...iconOptions])], editingType)}
              <DialogFooter>
                {/* Deleting is deliberate: it lives here, away from the list. */}
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] sm:mr-auto"
                  disabled={isPending}
                  onClick={() => {
                    setDeletingType(editingType);
                    setEditingType(null);
                  }}
                >
                  <Trash2 size={18} aria-hidden="true" />
                  {labels.lessonTypes.deleteCta}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditingType(null)}>
                  {labels.lessonTypes.cancelCta}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? labels.lessonTypes.processing : labels.lessonTypes.updateCta}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingType)} onOpenChange={(open) => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.lessonTypes.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.lessonTypes.deleteConfirmDescription.replace("{name}", deletingType?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="ghost" disabled={isPending}>
                {labels.lessonTypes.cancelCta}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={isPending || !deletingType}
                onClick={() => {
                  if (!deletingType) return;
                  onDeleteLessonType(deletingType.id);
                }}
              >
                <Trash2 size={18} aria-hidden="true" />
                {isPending ? labels.lessonTypes.processing : labels.lessonTypes.deleteCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
