"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen, LogOut, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  currentUserId: string;
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

export function UsersManager({ locale, currentUserId, users, lessonTypes, labels }: UsersManagerProps) {
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
        ? "Disattivando {name} verranno terminate tutte le sue sessioni e non potrà più effettuare il login."
        : "Deactivating {name} will terminate all sessions and block future logins.",
    confirmActivateTitle: locale === "it" ? "Conferma attivazione" : "Confirm activation",
    confirmActivateDescription:
      locale === "it"
        ? "Vuoi riattivare {name}? L'utente potrà di nuovo effettuare il login."
        : "Do you want to re-activate {name}? The user will be able to sign in again.",
    confirmTerminateSessionsTitle: locale === "it" ? "Conferma terminazione sessioni" : "Confirm session termination",
    confirmTerminateSessionsDescription:
      locale === "it"
        ? "Terminare tutte le sessioni attive di {name}?"
        : "Terminate all active sessions for {name}?",
    disabledBadge: locale === "it" ? "Disattivato" : "Disabled",
    remaining: locale === "it" ? "rimaste" : "left",
    perWeek: locale === "it" ? "a settimana" : "per week",
    perMonth: locale === "it" ? "al mese" : "per month",
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

  const roleFilters: Array<[UserItem["role"] | "ALL", string]> = [
    ["ALL", labels.filters.allRoles],
    ["ADMIN", labels.roleOptions.ADMIN],
    ["TRAINER", labels.roleOptions.TRAINER],
    ["TRAINEE", labels.roleOptions.TRAINEE],
  ];
  // Each role wears its own stock on the avatar, so the list scans by role at a glance.
  const roleStock: Record<UserItem["role"], string> = {
    ADMIN: "bg-[var(--stock-lilla)]",
    TRAINER: "bg-[var(--stock-azzurro)]",
    TRAINEE: "bg-[var(--stock-mint)]",
  };
  const initialsOf = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  // Plan as a ticket figure with its unit: "Pacchetto · 4/10 rimaste", "Mensile · 12 al mese".
  const planLabel = (user: UserItem) => {
    if (user.subscriptionType === "NONE") return labels.subscriptionOptions.NONE;
    const base = labels.subscriptionOptions[user.subscriptionType];
    if (user.subscriptionLessons === null) return base;
    if (user.subscriptionType === "FIXED") {
      return (
        <>
          {base} · <span className="tabular font-semibold text-[var(--foreground)]">{user.subscriptionRemaining ?? user.subscriptionLessons}/{user.subscriptionLessons}</span>{" "}
          {localActions.remaining}
        </>
      );
    }
    return (
      <>
        {base} · <span className="tabular font-semibold text-[var(--foreground)]">{user.subscriptionLessons}</span>{" "}
        {user.subscriptionType === "WEEKLY" ? localActions.perWeek : localActions.perMonth}
      </>
    );
  };

  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-5 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-6 lg:pt-10"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">{labels.description}</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button aria-label={labels.createCta} className="w-11 px-0 sm:w-auto sm:px-4">
                <Plus size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{labels.createCta}</span>
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
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
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
        </header>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:max-w-sm lg:flex-1">
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={labels.columns.role} className="inline-flex max-w-full overflow-x-auto rounded-xl bg-[var(--surface)]/70 p-1">
              {roleFilters.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={roleFilter === value}
                  onClick={() => setRoleFilter(value)}
                  className={cn(
                    "h-11 shrink-0 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
                    roleFilter === value
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                      : "text-[var(--stock-ink)]/75 hover:text-[var(--foreground)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "DISABLED")}
              aria-label={localActions.allStatuses}
              className="ui-select"
            >
              <option value="ALL">{localActions.allStatuses}</option>
              <option value="ACTIVE">{localActions.statusActive}</option>
              <option value="DISABLED">{localActions.statusDisabled}</option>
            </select>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="pt-6 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="-mx-4 pt-2 sm:mx-0">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-[var(--rule)] px-4 py-4 last:border-b-0 sm:px-0 lg:grid-cols-[2.75rem_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-[var(--stock-ink)]",
                  user.isDisabled ? "bg-[var(--muted)] text-[var(--muted-foreground)]" : roleStock[user.role]
                )}
              >
                {user.isDisabled ? <Lock size={16} /> : initialsOf(user.name)}
              </span>
              <div className="min-w-0">
                <p className={cn("text-[17px] font-semibold leading-snug", user.isDisabled ? "text-[var(--muted-foreground)]" : "")}>
                  {user.name}
                </p>
                <p className="text-[15px] text-[var(--muted-foreground)] [overflow-wrap:anywhere]">{user.email}</p>
              </div>
              <div className="col-span-2 col-start-2 row-start-2 flex flex-wrap items-center gap-1.5 lg:col-span-1 lg:col-start-3 lg:row-start-1">
                <span className="rounded-lg bg-[var(--muted)] px-2 py-0.5 text-[13px] font-semibold">{labels.roleOptions[user.role]}</span>
                {user.isDisabled ? (
                  <span className="rounded-lg bg-[var(--warning-bg)] px-2 py-0.5 text-[13px] font-semibold text-[var(--warning-fg)]">
                    {localActions.disabledBadge}
                  </span>
                ) : null}
                {user.role === "TRAINEE" ? (
                  <>
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[13px] font-semibold",
                        user.membershipStatus === "ACTIVE"
                          ? "bg-[var(--success-bg)] text-[var(--success-fg)]"
                          : "bg-[var(--warning-bg)] text-[var(--warning-fg)]"
                      )}
                    >
                      {labels.membershipOptions[user.membershipStatus]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">{planLabel(user)}</span>
                  </>
                ) : null}
              </div>
              <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 lg:col-start-4">
                <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setEditUser(user)}>
                  <Pencil size={16} aria-hidden="true" />
                  {labels.actions.edit}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${labels.columns.actions}: ${user.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      <MoreHorizontal size={20} aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditUser(user)}>
                    <Pencil className="h-4 w-4" />
                    <span>{labels.actions.edit}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={user.id === currentUserId}
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
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

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
                disableRoleSelection={editUser.id === currentUserId}
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
                {/* Deliberate Delete: removing an account lives here, behind its confirmation. */}
                {editUser.id !== currentUserId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] sm:mr-auto"
                    onClick={() => {
                      const target = editUser;
                      setEditUser(null);
                      setDeleteUser(target);
                      setConfirmation({ kind: "delete", payload: { id: target.id, name: target.name } });
                    }}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                    {labels.actions.delete}
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" onClick={() => setEditUser(null)}>
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
              variant="ghost"
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
              <Button variant="outline">{labels.actions.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant={
                  confirmation?.kind === "delete" ||
                  (confirmation?.kind === "toggleActivation" && confirmation.payload.disable)
                    ? "destructive"
                    : "default"
                }
                onClick={submitConfirmedAction}
                disabled={isPending}
              >
                {isPending ? labels.actions.processing : labels.actions.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFormFields({
  labels,
  lessonTypes,
  defaults,
  disableRoleSelection = false,
}: {
  labels: UsersManagerProps["labels"];
  lessonTypes: UsersManagerProps["lessonTypes"];
  disableRoleSelection?: boolean;
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
      <div role="group" className="flex max-w-full overflow-x-auto rounded-xl bg-[var(--muted)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          aria-pressed={activeTab === "profile"}
          className={[
            "h-11 shrink-0 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
            activeTab === "profile"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {labels.tabs.profile}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("membership")}
          aria-pressed={activeTab === "membership"}
          className={[
            "h-11 shrink-0 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
            activeTab === "membership"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {labels.tabs.membership}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          aria-pressed={activeTab === "subscription"}
          className={[
            "h-11 shrink-0 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
            activeTab === "subscription"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {labels.tabs.subscription}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("access")}
          aria-pressed={activeTab === "access"}
          className={[
            "h-11 shrink-0 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
            activeTab === "access"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {labels.tabs.access}
        </button>
      </div>

      <div className={panelClass("profile")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">{labels.fields.name}</Label>
              <Input id="name" name="name" required defaultValue={defaults?.name ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{labels.fields.email}</Label>
              <Input id="email" name="email" type="email" required defaultValue={defaults?.email ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="password">{labels.fields.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!defaults}
                aria-describedby="password-hint"
              />
              <p id="password-hint" className="text-sm text-[var(--muted-foreground)]">
                {defaults ? labels.passwordKeepHint : labels.passwordCreateHint}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">{labels.fields.role}</Label>
              {disableRoleSelection && defaults?.role ? (
                <>
                  <input type="hidden" name="role" value={defaults.role} />
                  <select
                    id="role"
                    defaultValue={defaults.role}
                    disabled
                    className="ui-select w-full"
                  >
                    <option value="ADMIN">{labels.roleOptions.ADMIN}</option>
                    <option value="TRAINER">{labels.roleOptions.TRAINER}</option>
                    <option value="TRAINEE">{labels.roleOptions.TRAINEE}</option>
                  </select>
                </>
              ) : (
                <select
                  id="role"
                  name="role"
                  defaultValue={defaults?.role ?? "TRAINEE"}
                  className="ui-select w-full"
                >
                  <option value="ADMIN">{labels.roleOptions.ADMIN}</option>
                  <option value="TRAINER">{labels.roleOptions.TRAINER}</option>
                  <option value="TRAINEE">{labels.roleOptions.TRAINEE}</option>
                </select>
              )}
            </div>
          </div>

          <label htmlFor="emailVerified" className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold">
            <input
              id="emailVerified"
              name="emailVerified"
              type="checkbox"
              defaultChecked={defaults?.emailVerified ?? false}
              className="h-5 w-5 rounded"
            />
            {labels.fields.emailVerified}
          </label>
      </div>

      <div className={panelClass("membership")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="membershipStatus">{labels.fields.membershipStatus}</Label>
            <select
              id="membershipStatus"
              name="membershipStatus"
              defaultValue={defaults?.membershipStatus ?? "INACTIVE"}
              className="ui-select w-full"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="subscriptionType">{labels.fields.subscriptionType}</Label>
              <select
                id="subscriptionType"
                name="subscriptionType"
                defaultValue={defaults?.subscriptionType ?? "NONE"}
                onChange={(event) => setSubscriptionType(event.target.value as UserItem["subscriptionType"])}
                className="ui-select w-full"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  className="ui-select min-w-52"
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
