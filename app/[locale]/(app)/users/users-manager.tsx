"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createUserAction, deleteUserAction, updateUserAction } from "@/app/[locale]/(app)/users/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserItem = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
  membershipStatus: "ACTIVE" | "INACTIVE";
  trialEndsAt: string | null;
  subscriptionType: "NONE" | "WEEKLY" | "MONTHLY" | "FIXED";
  subscriptionLessons: number | null;
  subscriptionRemaining: number | null;
  subscriptionResetAt: string | null;
  subscriptionEndsAt: string | null;
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
};

type UsersManagerProps = {
  locale: string;
  users: UserItem[];
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
      role: string;
      membershipStatus: string;
      trialEndsAt: string;
      subscriptionType: string;
      subscriptionLessons: string;
      subscriptionRemaining: string;
      subscriptionResetAt: string;
      subscriptionEndsAt: string;
    };
    actions: {
      save: string;
      reviewCreate: string;
      reviewUpdate: string;
      cancel: string;
      edit: string;
      delete: string;
      confirm: string;
      processing: string;
    };
    confirmCreateTitle: string;
    confirmCreateDescription: string;
    confirmUpdateTitle: string;
    confirmUpdateDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    roleOptions: Record<UserItem["role"], string>;
    membershipOptions: Record<UserItem["membershipStatus"], string>;
    subscriptionOptions: Record<UserItem["subscriptionType"], string>;
    passwordCreateHint: string;
    passwordKeepHint: string;
  };
};

type ConfirmationState =
  | { kind: "create"; payload: FormPayload }
  | { kind: "update"; payload: FormPayload }
  | { kind: "delete"; payload: { id: string; name: string } };

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

export function UsersManager({ locale, users, labels }: UsersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserItem["role"] | "ALL">("ALL");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (!query) return true;
      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [users, search, roleFilter]);

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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>{labels.createCta}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.createTitle}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={askCreateConfirmation}>
              <UserFormFields labels={labels} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? labels.actions.processing : labels.actions.reviewCreate}
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
                    <tr key={user.id} className="border-b border-[var(--surface-border)]/70">
                      <td className="py-3 pr-2 font-medium">{user.name}</td>
                      <td className="py-3 pr-2">{user.email}</td>
                      <td className="py-3 pr-2">
                        <Badge variant="info">{labels.roleOptions[user.role]}</Badge>
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
                        <div className="inline-flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditUser(user)}>
                            {labels.actions.edit}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteUser(user);
                              setConfirmation({ kind: "delete", payload: { id: user.id, name: user.name } });
                            }}
                          >
                            {labels.actions.delete}
                          </Button>
                        </div>
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
                }}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? labels.actions.processing : labels.actions.reviewUpdate}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
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
                  : labels.deleteConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.kind === "create"
                ? labels.confirmCreateDescription
                : confirmation?.kind === "update"
                  ? labels.confirmUpdateDescription
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
  defaults,
}: {
  labels: UsersManagerProps["labels"];
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
  };
}) {
  const [subscriptionType, setSubscriptionType] = useState<UserItem["subscriptionType"]>(defaults?.subscriptionType ?? "NONE");

  return (
    <>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="emailVerified">Email verified</Label>
          <input
            id="emailVerified"
            name="emailVerified"
            type="checkbox"
            defaultChecked={defaults?.emailVerified ?? false}
            className="h-4 w-4 rounded border-[var(--surface-border)]"
          />
        </div>
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
    </>
  );
}


