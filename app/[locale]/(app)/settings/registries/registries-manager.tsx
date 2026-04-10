"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createLessonTypeAction,
  deleteLessonTypeAction,
  updateLessonTypeAction,
} from "@/app/[locale]/(app)/courses/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [activeTab, setActiveTab] = useState<"lessonTypes">("lessonTypes");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<LessonTypeItem | null>(null);
  const [deletingType, setDeletingType] = useState<LessonTypeItem | null>(null);
  const defaultIcon = iconOptions[0] ?? "";
  const defaultColor = colorOptions[0]?.value ?? "#2563EB";
  const [createIcon, setCreateIcon] = useState(defaultIcon);
  const [createColor, setCreateColor] = useState(defaultColor);
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState(defaultColor);

  useEffect(() => {
    setCreateIcon(defaultIcon);
  }, [defaultIcon]);

  useEffect(() => {
    setCreateColor(defaultColor);
  }, [defaultColor]);

  useEffect(() => {
    setEditIcon(editingType?.iconSvg ?? "");
    setEditColor(editingType?.colorHex ?? defaultColor);
  }, [defaultColor, editingType]);

  function iconFileName(iconPath: string) {
    return iconPath.replace("/icons/lessontypes/", "");
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

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
      </header>

      <div className="flex border-b border-[var(--surface-border)]">
        <button
          type="button"
          onClick={() => setActiveTab("lessonTypes")}
          className={[
            "px-3 py-2 text-sm",
            activeTab === "lessonTypes"
              ? "border-b-2 border-[var(--primary)] font-medium"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
        >
          {labels.tabs.lessonTypes}
        </button>
      </div>

      {activeTab === "lessonTypes" ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.lessonTypes.title}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">{labels.lessonTypes.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={createOpen}
                onOpenChange={(nextOpen) => {
                  setCreateOpen(nextOpen);
                  if (!nextOpen) {
                    setCreateIcon(defaultIcon);
                    setCreateColor(defaultColor);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button disabled={isPending}>
                    <Plus className="h-4 w-4" />
                    <span>{labels.lessonTypes.createCta}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{labels.lessonTypes.createCta}</DialogTitle>
                    <DialogDescription>{labels.lessonTypes.description}</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-3" onSubmit={onCreateLessonType}>
                    <div className="space-y-1">
                      <Label htmlFor="registry-lt-name">{labels.lessonTypes.nameLabel}</Label>
                      <Input id="registry-lt-name" name="name" required />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="registry-lt-description">{labels.lessonTypes.descriptionLabel}</Label>
                      <Textarea id="registry-lt-description" name="description" />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="registry-lt-icon">{labels.lessonTypes.iconSvgLabel}</Label>
                      <select
                        id="registry-lt-icon"
                        name="iconSvg"
                        required
                        value={createIcon}
                        onChange={(event) => setCreateIcon(event.target.value)}
                        className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>
                            {iconFileName(icon)}
                          </option>
                        ))}
                      </select>
                      {createIcon ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1">
                          <LessonTypeIcon iconPath={createIcon} colorHex={createColor} size={26} />
                          <span className="text-xs text-[var(--muted-foreground)]">{iconFileName(createIcon)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="registry-lt-color">{labels.lessonTypes.colorLabel}</Label>
                      <select
                        id="registry-lt-color"
                        name="colorHex"
                        required
                        value={createColor}
                        onChange={(event) => setCreateColor(event.target.value)}
                        className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                      >
                        {colorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({option.value})
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1">
                        <span
                          className="inline-block h-5 w-5 rounded"
                          style={{
                            backgroundColor: hexToRgba(createColor, 0.2),
                            border: `1px solid ${createColor}`,
                          }}
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">{createColor}</span>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isPending}>
                        <Plus className="h-4 w-4" />
                        <span>{isPending ? "..." : labels.lessonTypes.createCta}</span>
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {lessonTypes.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">{labels.lessonTypes.empty}</p>
              ) : (
                lessonTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between rounded-md border border-[var(--surface-border)] px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <LessonTypeIcon iconPath={type.iconSvg} colorHex={type.colorHex} size={20} />
                        <p className="text-sm font-medium">{type.name}</p>
                      </div>
                      {type.description ? <p className="text-xs text-[var(--muted-foreground)]">{type.description}</p> : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingType(type)}
                      disabled={isPending}
                    >
                      <Pencil className="h-4 w-4" />
                      <span>{labels.lessonTypes.editCta}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingType(type)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{labels.lessonTypes.deleteCta}</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={Boolean(editingType)} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.lessonTypes.updateTitle}</DialogTitle>
            <DialogDescription>{labels.lessonTypes.description}</DialogDescription>
          </DialogHeader>

          {editingType ? (
            <form className="space-y-3" onSubmit={onUpdateLessonType}>
              <div className="space-y-1">
                <Label htmlFor="edit-lt-name">{labels.lessonTypes.nameLabel}</Label>
                <Input id="edit-lt-name" name="name" required defaultValue={editingType.name} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-lt-description">{labels.lessonTypes.descriptionLabel}</Label>
                <Textarea id="edit-lt-description" name="description" defaultValue={editingType.description ?? ""} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-lt-icon">{labels.lessonTypes.iconSvgLabel}</Label>
                <select
                  id="edit-lt-icon"
                  name="iconSvg"
                  required
                  value={editIcon}
                  onChange={(event) => setEditIcon(event.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                >
                  {[...new Set([editingType.iconSvg, ...iconOptions])].map((icon) => (
                    <option key={icon} value={icon}>
                      {iconFileName(icon)}
                    </option>
                  ))}
                </select>
                {editIcon ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1">
                    <LessonTypeIcon iconPath={editIcon} colorHex={editColor} size={26} />
                    <span className="text-xs text-[var(--muted-foreground)]">{iconFileName(editIcon)}</span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-lt-color">{labels.lessonTypes.colorLabel}</Label>
                <select
                  id="edit-lt-color"
                  name="colorHex"
                  required
                  value={editColor}
                  onChange={(event) => setEditColor(event.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
                </select>
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1">
                  <span
                    className="inline-block h-5 w-5 rounded"
                    style={{
                      backgroundColor: hexToRgba(editColor, 0.2),
                      border: `1px solid ${editColor}`,
                    }}
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">{editColor}</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  <Pencil className="h-4 w-4" />
                  <span>{isPending ? "..." : labels.lessonTypes.updateCta}</span>
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
              <Button variant="secondary" disabled={isPending}>
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
                <Trash2 className="h-4 w-4" />
                <span>{isPending ? labels.lessonTypes.processing : labels.lessonTypes.deleteCta}</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}


