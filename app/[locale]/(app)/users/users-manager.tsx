"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen, LogOut, MessageSquare, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createUserAction,
  deleteUserAction,
  sendUserMessageAction,
  terminateUserSessionsAction,
  toggleUserActivationAction,
  updateUserAction,
} from "@/app/[locale]/(app)/users/actions";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UserItem = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  isDisabled: boolean;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
  membershipStatus: "ACTIVE" | "INACTIVE";
  trialEndsAt: string | null;
  subscriptionType: "NONE" | "WEEKLY" | "MONTHLY" | "FIXED";
  subscriptionLessons: number | null;
  subscriptionRemaining: number | null;
  subscriptionResetAt: string | null;
  subscriptionEndsAt: string | null;
  lessonTypeAccesses: Array<{ lessonTypeId: string; mode: "DENIED" | "REQUIRES_CONFIRMATION" | "ALLOWED" }>;
};

type FormPayload = {
  id?: string;
  locale: string;
  name: string;
  email: string;
  password: string;
  role: UserItem["role"];
  emailVerified: string;
  membershipStatus: UserItem["membershipStatus"];
  trialEndsAt: string;
  subscriptionType: UserItem["subscriptionType"];
  subscriptionLessons: string;
  subscriptionRemaining: string;
  subscriptionResetAt: string;
  subscriptionEndsAt: string;
  lessonTypeAccesses: Record<string, "DENIED" | "REQUIRES_CONFIRMATION" | "ALLOWED">;
};

type UsersManagerProps = {
  locale: string;
  users: UserItem[];
  lessonTypes: Array<{ id: string; name: string }>;
  labels: {
    title: string;
    description: string;
    createCta: string;
    createTitle: string;
    editTitle: string;
    createDescription: string;
    editDescription: string;
    tableTitle: string;
    empty: string;
    searchPlaceholder: string;
    filters: {
      allRoles: string;
    };
    columns: {
      name: string;
      email: string;
      role: string;
      membership: string;
      subscription: string;
      actions: string;
    };
    fields: {
      name: string;
      email: string;
      password: string;
      emailVerified: string;
      role: string;
      membershipStatus: string;
      trialEndsAt: string;
      subscriptionType: string;
      subscriptionLessons: string;
      subscriptionRemaining: string;
      subscriptionResetAt: string;
      subscriptionEndsAt: string;
      lessonTypeAccess: string;
    };
    tabs: {
      profile: string;
      membership: string;
      subscription: string;
      access: string;
    };
    actions: {
      save: string;
      reviewCreate: string;
      reviewUpdate: string;
      cancel: string;
      edit: string;
      message: string;
      sendMessage: string;
      delete: string;
      confirm: string;
      processing: string;
    };
    messageDialogTitle: string;
    messageDialogDescription: string;
    messagePlaceholder: string;
    confirmCreateTitle: string;
    confirmCreateDescription: string;
    confirmUpdateTitle: string;
    confirmUpdateDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    roleOptions: Record<UserItem["role"], string>;
    membershipOptions: Record<UserItem["membershipStatus"], string>;
    subscriptionOptions: Record<UserItem["subscriptionType"], string>;
    lessonTypeAccessOptions: {
      DENIED: string;
      REQUIRES_CONFIRMATION: string;
      ALLOWED: string;
    };
    passwordCreateHint: string;
    passwordKeepHint: string;
  };
};

type ConfirmationState =
  | { kind: "create"; payload: FormPayload }
  | { kind: "update"; payload: FormPayload }
  | { kind: "delete"; payload: { id: string; name: string } }
  | { kind: "toggleActivation"; payload: { id: string; name: string; disable: boolean } }
  | { kind: "terminateSessions"; payload: { id: string; name: string } };

function toFormData(payload: FormPayload): FormData {
  const formData = new FormData();
  formData.set("locale", payload.locale);
  if (payload.id) formData.set("id", payload.id);
  formData.set("name", payload.name);
  formData.set("email", payload.email);
  formData.set("password", payload.password);
  formData.set("role", payload.role);
  formData.set("emailVerified", payload.emailVerified);
  formData.set("membershipStatus", payload.membershipStatus);
  formData.set("trialEndsAt", payload.trialEndsAt);
  formData.set("subscriptionType", payload.subscriptionType);
  formData.set("subscriptionLessons", payload.subscriptionLessons);
  formData.set("subscriptionRemaining", payload.subscriptionRemaining);
  formData.set("subscriptionResetAt", payload.subscriptionResetAt);
  formData.set("subscriptionEndsAt", payload.subscriptionEndsAt);
  for (const [lessonTypeId, mode] of Object.entries(payload.lessonTypeAccesses)) {
    formData.set(`lessonTypeAccess:${lessonTypeId}`, mode);
  }
  return formData;
}

function dateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function dateTimeInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function UsersManager({ locale, users, lessonTypes, labels }: UsersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [messageUser, setMessageUser] = useState<UserItem | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserItem["role"] | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const localActions = {
    activate: locale === "it" ? "Attiva" : "Activate",
    deactivate: locale === "it" ? "Disattiva" : "Deactivate",
    terminateSessions: locale === "it" ? "Termina sessioni" : "Terminate sessions",
    confirmDeactivateTitle: locale === "it" ? "Conferma disattivazione" : "Confirm deactivation",
    confirmDeactivateDescription:
      locale === "it"
        ? "Disattivando {name} verranno terminate tutte le sue sessioni e non potra piu effettuare il login."
        : "Deactivating {name} will terminate all sessions and block future logins.",
    confirmActivateTitle: locale === "it" ? "Conferma attivazione" : "Confirm activation",
    confirmActivateDescription:
      locale === "it"
        ? "Vuoi riattivare {name}? L'utente potra nuovamente effettuare il login."
        : "Do you want to re-activate {name}? The user will be able to sign in again.",
    confirmTerminateSessionsTitle: locale === "it" ? "Conferma terminazione sessioni" : "Confirm session termination",
    confirmTerminateSessionsDescription:
      locale === "it"
        ? "Terminare tutte le sessioni attive di {name}?"
        : "Terminate all active sessions for {name}?",
    disabledBadge: locale === "it" ? "Disattivato" : "Disabled",
    allStatuses: locale === "it" ? "Tutti gli stati" : "All statuses",
    statusActive: locale === "it" ? "Attivi" : "Active",
    statusDisabled: locale === "it" ? "Disattivati" : "Disabled",
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (statusFilter === "ACTIVE" && user.isDisabled) return false;
      if (statusFilter === "DISABLED" && !user.isDisabled) return false;
      if (!query) return true;
      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [users, search, roleFilter, statusFilter]);

  function askCreateConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload: FormPayload = {
      locale,
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "TRAINEE") as UserItem["role"],
      emailVerified: String(formData.get("emailVerified") ?? ""),
      membershipStatus: String(formData.get("membershipStatus") ?? "INACTIVE") as UserItem["membershipStatus"],
      trialEndsAt: String(formData.get("trialEndsAt") ?? ""),
      subscriptionType: String(formData.get("subscriptionType") ?? "NONE") as UserItem["subscriptionType"],
      subscriptionLessons: String(formData.get("subscriptionLessons") ?? ""),
      subscriptionRemaining: String(formData.get("subscriptionRemaining") ?? ""),
      subscriptionResetAt: String(formData.get("subscriptionResetAt") ?? ""),
      subscriptionEndsAt: String(formData.get("subscriptionEndsAt") ?? ""),
      lessonTypeAccesses: Object.fromEntries(
        lessonTypes.map((lessonType) => [
          lessonType.id,
          String(formData.get(`lessonTypeAccess:${lessonType.id}`) ?? "REQUIRES_CONFIRMATION") as FormPayload["lessonTypeAccesses"][string],
        ])
      ),
    };

    setConfirmation({ kind: "create", payload });
  }

  function askUpdateConfirmation(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload: FormPayload = {
      id,
      locale,
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "TRAINEE") as UserItem["role"],
      emailVerified: String(formData.get("emailVerified") ?? ""),
      membershipStatus: String(formData.get("membershipStatus") ?? "INACTIVE") as UserItem["membershipStatus"],
      trialEndsAt: String(formData.get("trialEndsAt") ?? ""),
      subscriptionType: String(formData.get("subscriptionType") ?? "NONE") as UserItem["subscriptionType"],
      subscriptionLessons: String(formData.get("subscriptionLessons") ?? ""),
      subscriptionRemaining: String(formData.get("subscriptionRemaining") ?? ""),
      subscriptionResetAt: String(formData.get("subscriptionResetAt") ?? ""),
      subscriptionEndsAt: String(formData.get("subscriptionEndsAt") ?? ""),
      lessonTypeAccesses: Object.fromEntries(
        lessonTypes.map((lessonType) => [
          lessonType.id,
          String(formData.get(`lessonTypeAccess:${lessonType.id}`) ?? "REQUIRES_CONFIRMATION") as FormPayload["lessonTypeAccesses"][string],
        ])
      ),
    };

    setConfirmation({ kind: "update", payload });
  }

  function submitConfirmedAction() {
    if (!confirmation) return;

    startTransition(async () => {
      let result;
      if (confirmation.kind === "create") {
        result = await createUserAction(toFormData(confirmation.payload));
      } else if (confirmation.kind === "update") {
        result = await updateUserAction(toFormData(confirmation.payload));
      } else if (confirmation.kind === "toggleActivation") {
        const formData = new FormData();
        formData.set("locale", locale);
        formData.set("id", confirmation.payload.id);
        formData.set("disable", confirmation.payload.disable ? "true" : "false");
        result = await toggleUserActivationAction(formData);
      } else if (confirmation.kind === "terminateSessions") {
        const formData = new FormData();
        formData.set("locale", locale);
        formData.set("id", confirmation.payload.id);
        result = await terminateUserSessionsAction(formData);
      } else {
        const formData = new FormData();
        formData.set("id", confirmation.payload.id);
        formData.set("locale", locale);
        result = await deleteUserAction(formData);
      }

      if (result.ok) {
        toast.success(result.message);
        setCreateOpen(false);
        setEditUser(null);
        setDeleteUser(null);
        setConfirmation(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function submitUserMessage() {
    if (!messageUser) return;

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("id", messageUser.id);
    formData.set("message", messageBody);

    startTransition(async () => {
      const result = await sendUserMessageAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setMessageUser(null);
        setMessageBody("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              <span>{labels.createCta}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.createTitle}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={askCreateConfirmation}>
              <UserFormFields labels={labels} lessonTypes={lessonTypes} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                  <Plus className="h-4 w-4" />
                  <span>{isPending ? labels.actions.processing : labels.actions.reviewCreate}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.tableTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as UserItem["role"] | "ALL")}
              className="h-10 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="ALL">{labels.filters.allRoles}</option>
              <option value="ADMIN">{labels.roleOptions.ADMIN}</option>
              <option value="TRAINER">{labels.roleOptions.TRAINER}</option>
              <option value="TRAINEE">{labels.roleOptions.TRAINEE}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "DISABLED")}
              className="h-10 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="ALL">{localActions.allStatuses}</option>
              <option value="ACTIVE">{localActions.statusActive}</option>
              <option value="DISABLED">{localActions.statusDisabled}</option>
            </select>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-left">
                    <th className="py-2 pr-2">{labels.columns.name}</th>
                    <th className="py-2 pr-2">{labels.columns.email}</th>
                    <th className="py-2 pr-2">{labels.columns.role}</th>
                    <th className="py-2 pr-2">{labels.columns.membership}</th>
                    <th className="py-2 pr-2">{labels.columns.subscription}</th>
                    <th className="py-2 text-right">{labels.columns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-[var(--surface-border)]/70 ${user.isDisabled ? "bg-[var(--muted)]/35 text-[var(--muted-foreground)]" : ""}`}
                    >
                      <td className="py-3 pr-2 font-medium">
                        <div className="inline-flex items-center gap-2">
                          {user.isDisabled ? <Lock className="h-4 w-4" /> : null}
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2">{user.email}</td>
                      <td className="py-3 pr-2">
                        <div className="inline-flex gap-2">
                          <Badge variant="info">{labels.roleOptions[user.role]}</Badge>
                          {user.isDisabled ? <Badge variant="warning">{localActions.disabledBadge}</Badge> : null}
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <Badge variant={user.membershipStatus === "ACTIVE" ? "success" : "warning"}>
                          {labels.membershipOptions[user.membershipStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-2">
                        <Badge variant={user.subscriptionType === "NONE" ? "neutral" : "info"}>
                          {labels.subscriptionOptions[user.subscriptionType]}
                          {user.subscriptionRemaining !== null ? ` (${user.subscriptionRemaining})` : ""}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{labels.columns.actions}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditUser(user)}>
                              <Pencil className="h-4 w-4" />
                              <span>{labels.actions.edit}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                setConfirmation({
                                  kind: "toggleActivation",
                                  payload: {
                                    id: user.id,
                                    name: user.name,
                                    disable: !user.isDisabled,
                                  },
                                })
                              }
                            >
                              {user.isDisabled ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              <span>{user.isDisabled ? localActions.activate : localActions.deactivate}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                setConfirmation({
                                  kind: "terminateSessions",
                                  payload: { id: user.id, name: user.name },
                                })
                              }
                            >
                              <LogOut className="h-4 w-4" />
                              <span>{localActions.terminateSessions}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setMessageUser(user);
                                setMessageBody("");
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>{labels.actions.message}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-100 dark:text-red-400 dark:focus:bg-red-900/40"
                              onSelect={() => {
                                setDeleteUser(user);
                                setConfirmation({ kind: "delete", payload: { id: user.id, name: user.name } });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{labels.actions.delete}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.editTitle}</DialogTitle>
            <DialogDescription>{labels.editDescription}</DialogDescription>
          </DialogHeader>

          {editUser ? (
            <form className="space-y-3" onSubmit={(event) => askUpdateConfirmation(event, editUser.id)}>
              <UserFormFields
                labels={labels}
                lessonTypes={lessonTypes}
                defaults={{
                  name: editUser.name,
                  email: editUser.email,
                  role: editUser.role,
                  emailVerified: Boolean(editUser.emailVerifiedAt),
                  membershipStatus: editUser.membershipStatus,
                  trialEndsAt: dateInputValue(editUser.trialEndsAt),
                  subscriptionType: editUser.subscriptionType,
                  subscriptionLessons: editUser.subscriptionLessons ? String(editUser.subscriptionLessons) : "",
                  subscriptionRemaining: editUser.subscriptionRemaining ? String(editUser.subscriptionRemaining) : "",
                  subscriptionResetAt: dateTimeInputValue(editUser.subscriptionResetAt),
                  subscriptionEndsAt: dateInputValue(editUser.subscriptionEndsAt),
                  lessonTypeAccesses: Object.fromEntries(editUser.lessonTypeAccesses.map((entry) => [entry.lessonTypeId, entry.mode])),
                }}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                  <Pencil className="h-4 w-4" />
                  <span>{isPending ? labels.actions.processing : labels.actions.reviewUpdate}</span>
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(messageUser)}
        onOpenChange={(open) => {
          if (!open) {
            setMessageUser(null);
            setMessageBody("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.messageDialogTitle}</DialogTitle>
            <DialogDescription>{labels.messageDialogDescription.replace("{name}", messageUser?.name ?? "")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="users-message-body">{labels.actions.message}</Label>
            <Textarea
              id="users-message-body"
              rows={5}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder={labels.messagePlaceholder}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMessageUser(null);
                setMessageBody("");
              }}
              disabled={isPending}
            >
              {labels.actions.cancel}
            </Button>
            <Button
              type="button"
              className="border-[#BEE3F8] bg-[#E6F4FF] text-[#1E5D85] hover:bg-[#D8EEFF] dark:border-[#2B5D86] dark:bg-[#123A56] dark:text-[#BFE6FF] dark:hover:bg-[#184666]"
              onClick={submitUserMessage}
              disabled={isPending || !messageBody.trim()}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{isPending ? labels.actions.processing : labels.actions.sendMessage}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmation(null);
            setDeleteUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.kind === "create"
                ? labels.confirmCreateTitle
                : confirmation?.kind === "update"
                  ? labels.confirmUpdateTitle
                  : confirmation?.kind === "toggleActivation"
                    ? confirmation.payload.disable
                      ? localActions.confirmDeactivateTitle
                      : localActions.confirmActivateTitle
                    : confirmation?.kind === "terminateSessions"
                      ? localActions.confirmTerminateSessionsTitle
                      : labels.deleteConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.kind === "create"
                ? labels.confirmCreateDescription
                : confirmation?.kind === "update"
                  ? labels.confirmUpdateDescription
                  : confirmation?.kind === "toggleActivation"
                    ? confirmation.payload.disable
                      ? localActions.confirmDeactivateDescription.replace("{name}", confirmation.payload.name)
                      : localActions.confirmActivateDescription.replace("{name}", confirmation.payload.name)
                    : confirmation?.kind === "terminateSessions"
                      ? localActions.confirmTerminateSessionsDescription.replace("{name}", confirmation.payload.name)
                      : labels.deleteConfirmDescription.replace("{name}", deleteUser?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{labels.actions.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={submitConfirmedAction} disabled={isPending}>
                {isPending ? labels.actions.processing : labels.actions.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function UserFormFields({
  labels,
  lessonTypes,
  defaults,
}: {
  labels: UsersManagerProps["labels"];
  lessonTypes: UsersManagerProps["lessonTypes"];
  defaults?: {
    name: string;
    email: string;
    role: UserItem["role"];
    emailVerified: boolean;
    membershipStatus: UserItem["membershipStatus"];
    trialEndsAt: string;
    subscriptionType: UserItem["subscriptionType"];
    subscriptionLessons: string;
    subscriptionRemaining: string;
    subscriptionResetAt: string;
    subscriptionEndsAt: string;
    lessonTypeAccesses: Record<string, "DENIED" | "REQUIRES_CONFIRMATION" | "ALLOWED">;
  };
}) {
  const [subscriptionType, setSubscriptionType] = useState<UserItem["subscriptionType"]>(defaults?.subscriptionType ?? "NONE");
  const [activeTab, setActiveTab] = useState<"profile" | "membership" | "subscription" | "access">("profile");
  const panelClass = (tab: "profile" | "membership" | "subscription" | "access") =>
    activeTab === tab ? "space-y-3" : "hidden";

  return (
    <>
      <div className="inline-flex rounded-md border border-[var(--surface-border)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={[
            "rounded px-3 py-1.5 text-xs font-medium",
            activeTab === "profile"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
          ].join(" ")}
        >
          {labels.tabs.profile}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("membership")}
          className={[
            "rounded px-3 py-1.5 text-xs font-medium",
            activeTab === "membership"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
          ].join(" ")}
        >
          {labels.tabs.membership}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={[
            "rounded px-3 py-1.5 text-xs font-medium",
            activeTab === "subscription"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
          ].join(" ")}
        >
          {labels.tabs.subscription}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("access")}
          className={[
            "rounded px-3 py-1.5 text-xs font-medium",
            activeTab === "access"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
          ].join(" ")}
        >
          {labels.tabs.access}
        </button>
      </div>

      <div className={panelClass("profile")}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">{labels.fields.name}</Label>
              <Input id="name" name="name" required defaultValue={defaults?.name ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{labels.fields.email}</Label>
              <Input id="email" name="email" type="email" required defaultValue={defaults?.email ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="password">{labels.fields.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!defaults}
                placeholder={defaults ? labels.passwordKeepHint : labels.passwordCreateHint}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                {defaults ? labels.passwordKeepHint : labels.passwordCreateHint}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">{labels.fields.role}</Label>
              <select
                id="role"
                name="role"
                defaultValue={defaults?.role ?? "TRAINEE"}
                className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
              >
                <option value="ADMIN">{labels.roleOptions.ADMIN}</option>
                <option value="TRAINER">{labels.roleOptions.TRAINER}</option>
                <option value="TRAINEE">{labels.roleOptions.TRAINEE}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="emailVerified">{labels.fields.emailVerified}</Label>
            <input
              id="emailVerified"
              name="emailVerified"
              type="checkbox"
              defaultChecked={defaults?.emailVerified ?? false}
              className="h-4 w-4 rounded border-[var(--surface-border)]"
            />
          </div>
      </div>

      <div className={panelClass("membership")}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="membershipStatus">{labels.fields.membershipStatus}</Label>
            <select
              id="membershipStatus"
              name="membershipStatus"
              defaultValue={defaults?.membershipStatus ?? "INACTIVE"}
              className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="ACTIVE">{labels.membershipOptions.ACTIVE}</option>
              <option value="INACTIVE">{labels.membershipOptions.INACTIVE}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="trialEndsAt">{labels.fields.trialEndsAt}</Label>
            <Input id="trialEndsAt" name="trialEndsAt" type="date" defaultValue={defaults?.trialEndsAt ?? ""} />
          </div>
        </div>
      </div>

      <div className={panelClass("subscription")}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subscriptionType">{labels.fields.subscriptionType}</Label>
              <select
                id="subscriptionType"
                name="subscriptionType"
                defaultValue={defaults?.subscriptionType ?? "NONE"}
                onChange={(event) => setSubscriptionType(event.target.value as UserItem["subscriptionType"])}
                className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
              >
                <option value="NONE">{labels.subscriptionOptions.NONE}</option>
                <option value="WEEKLY">{labels.subscriptionOptions.WEEKLY}</option>
                <option value="MONTHLY">{labels.subscriptionOptions.MONTHLY}</option>
                <option value="FIXED">{labels.subscriptionOptions.FIXED}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subscriptionLessons">{labels.fields.subscriptionLessons}</Label>
              <Input
                id="subscriptionLessons"
                name="subscriptionLessons"
                type="number"
                min={1}
                defaultValue={defaults?.subscriptionLessons ?? ""}
                disabled={subscriptionType === "NONE"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subscriptionRemaining">{labels.fields.subscriptionRemaining}</Label>
              <Input
                id="subscriptionRemaining"
                name="subscriptionRemaining"
                type="number"
                min={0}
                defaultValue={defaults?.subscriptionRemaining ?? ""}
                disabled={subscriptionType === "NONE"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subscriptionResetAt">{labels.fields.subscriptionResetAt}</Label>
              <Input
                id="subscriptionResetAt"
                name="subscriptionResetAt"
                type="datetime-local"
                defaultValue={defaults?.subscriptionResetAt ?? ""}
                disabled={subscriptionType === "NONE"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subscriptionEndsAt">{labels.fields.subscriptionEndsAt}</Label>
            <Input
              id="subscriptionEndsAt"
              name="subscriptionEndsAt"
              type="date"
              defaultValue={defaults?.subscriptionEndsAt ?? ""}
              disabled={subscriptionType === "NONE"}
            />
          </div>
      </div>

      <div className={panelClass("access")}>
        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">{labels.fields.lessonTypeAccess}</p>
          {lessonTypes.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">-</p>
          ) : (
            lessonTypes.map((lessonType) => (
              <div key={`access-${lessonType.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <Label htmlFor={`lessonTypeAccess-${lessonType.id}`}>{lessonType.name}</Label>
                <select
                  id={`lessonTypeAccess-${lessonType.id}`}
                  name={`lessonTypeAccess:${lessonType.id}`}
                  defaultValue={defaults?.lessonTypeAccesses?.[lessonType.id] ?? "REQUIRES_CONFIRMATION"}
                  className="h-10 min-w-52 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                >
                  <option value="REQUIRES_CONFIRMATION">{labels.lessonTypeAccessOptions.REQUIRES_CONFIRMATION}</option>
                  <option value="ALLOWED">{labels.lessonTypeAccessOptions.ALLOWED}</option>
                  <option value="DENIED">{labels.lessonTypeAccessOptions.DENIED}</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
