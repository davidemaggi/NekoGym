"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

type LessonTypeItem = {
  id: string;
  name: string;
  description: string | null;
  iconSvg: string;
};

type RegistriesManagerProps = {
  locale: string;
  lessonTypes: LessonTypeItem[];
  iconOptions: string[];
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

export function RegistriesManager({ locale, lessonTypes, labels, iconOptions }: RegistriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"lessonTypes">("lessonTypes");
  const [editingType, setEditingType] = useState<LessonTypeItem | null>(null);
  const [deletingType, setDeletingType] = useState<LessonTypeItem | null>(null);
  const defaultIcon = iconOptions[0] ?? "";
  const [createIcon, setCreateIcon] = useState(defaultIcon);
  const [editIcon, setEditIcon] = useState("");

  useEffect(() => {
    setCreateIcon(defaultIcon);
  }, [defaultIcon]);

  useEffect(() => {
    setEditIcon(editingType?.iconSvg ?? "");
  }, [editingType]);

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
        setCreateIcon(defaultIcon);
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
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.subtitle}</p>
      </header>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("lessonTypes")}
          className={[
            "px-3 py-2 text-sm",
            activeTab === "lessonTypes"
              ? "border-b-2 border-zinc-900 font-medium dark:border-zinc-100"
              : "text-zinc-600 dark:text-zinc-300",
          ].join(" ")}
        >
          {labels.tabs.lessonTypes}
        </button>
      </div>

      {activeTab === "lessonTypes" ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.lessonTypes.title}</CardTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.lessonTypes.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {iconFileName(icon)}
                    </option>
                  ))}
                </select>
                {createIcon ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-800">
                    <Image src={createIcon} alt={iconFileName(createIcon)} width={26} height={26} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">{iconFileName(createIcon)}</span>
                  </div>
                ) : null}
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? "..." : labels.lessonTypes.createCta}
              </Button>
            </form>

            <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              {lessonTypes.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.lessonTypes.empty}</p>
              ) : (
                lessonTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Image src={type.iconSvg} alt={type.name} width={20} height={20} />
                        <p className="text-sm font-medium">{type.name}</p>
                      </div>
                      {type.description ? <p className="text-xs text-zinc-500">{type.description}</p> : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingType(type)}
                      disabled={isPending}
                    >
                      {labels.lessonTypes.editCta}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingType(type)}
                      disabled={isPending}
                    >
                      {labels.lessonTypes.deleteCta}
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
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {[...new Set([editingType.iconSvg, ...iconOptions])].map((icon) => (
                    <option key={icon} value={icon}>
                      {iconFileName(icon)}
                    </option>
                  ))}
                </select>
                {editIcon ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-800">
                    <Image src={editIcon} alt={iconFileName(editIcon)} width={26} height={26} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">{iconFileName(editIcon)}</span>
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "..." : labels.lessonTypes.updateCta}
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
                {isPending ? labels.lessonTypes.processing : labels.lessonTypes.deleteCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}



