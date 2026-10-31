import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

/** Segmented control for in-page views (tabs that switch panels without leaving the page). */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<readonly [T, string]>;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "gap-0.5 rounded-xl bg-[var(--muted)] p-1",
        // Four or more views split into an even 2×2 grid on phones instead of a ragged wrap.
        options.length > 3 ? "grid w-full grid-cols-2 sm:inline-flex sm:w-auto" : "inline-flex max-w-full",
        className
      )}
    >
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "min-h-11 shrink-0 rounded-lg px-3.5 py-2 text-center text-[15px] font-semibold leading-tight transition-colors",
            value === option
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** One settings group: a titled block separated from its siblings by a rule, never boxed. */
export function SettingsSection({
  title,
  description,
  children,
  aside,
  className,
}: {
  /** Omit when the surrounding tab already names the section. */
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Current state of the section (e.g. "Attiva"), shown next to the title. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-[var(--rule)] py-6 first:border-t-0 first:pt-2", className)}>
      {title || description || aside ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 max-w-prose">
            {title ? <h2 className="text-[17px] font-semibold leading-snug">{title}</h2> : null}
            {description ? <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">{description}</p> : null}
          </div>
          {aside}
        </div>
      ) : null}
      {children ? <div className="space-y-4">{children}</div> : null}
    </section>
  );
}

/** Checkbox with its label as a full 44px row target. */
export function CheckRow({
  checked,
  onChange,
  children,
  hint,
  name,
  value,
  defaultChecked,
  disabled,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children: ReactNode;
  hint?: ReactNode;
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex min-h-11 items-start gap-3 py-2.5 text-[16px]", disabled ? "opacity-55" : "cursor-pointer")}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        className="mt-0.5 h-5 w-5 shrink-0"
      />
      <span className="min-w-0">
        <span className="block leading-snug">{children}</span>
        {hint ? <span className="mt-0.5 block text-sm text-[var(--muted-foreground)]">{hint}</span> : null}
      </span>
    </label>
  );
}

const NOTE_TONES = {
  ok: { icon: CircleCheck, className: "bg-[var(--success-bg)] text-[var(--success-fg)]" },
  warn: { icon: CircleAlert, className: "bg-[var(--warning-bg)] text-[var(--warning-fg)]" },
  neutral: { icon: Info, className: "bg-[var(--muted)] text-[var(--foreground)]" },
} as const;

/** State chip: icon + words, colour never alone. */
export function StatusNote({ tone, children, className }: { tone: keyof typeof NOTE_TONES; children: ReactNode; className?: string }) {
  const { icon: Icon, className: toneClass } = NOTE_TONES[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold", toneClass, className)}>
      <Icon size={15} aria-hidden="true" className="shrink-0" />
      {children}
    </span>
  );
}
