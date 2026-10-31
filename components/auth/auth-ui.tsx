import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Server-side result message (error or info), announced to assistive tech. */
export function AuthNotice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl px-4 py-3 text-[15px] font-semibold",
        tone === "error" ? "bg-[var(--danger-bg)] text-[var(--danger-fg)]" : "bg-[var(--success-bg)] text-[var(--success-fg)]"
      )}
    >
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function AuthField({
  id,
  label,
  hint,
  ...inputProps
}: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...inputProps} />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-[var(--muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Full-width primary submit, 48px: the one action of each auth step. */
export const authSubmitClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[16px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]";
