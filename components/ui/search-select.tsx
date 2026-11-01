"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchSelectOption = {
  value: string;
  label: string;
  /** Secondary line (e.g. email), also searched. */
  description?: string;
  /** Right-hand detail (e.g. plan usage tag). */
  meta?: ReactNode;
  /** Warning line under the label (e.g. "Piano esaurito"); never blocks the pick. */
  note?: string;
  disabled?: boolean;
};

/** Accent- and case-insensitive match, so "nicolo" finds "Nicolò". */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * A dropdown you can type into: a button shows the current choice; opening it gives a search
 * field and a filtered list (arrows to move, Enter to pick, Escape to close). When `name` is set
 * the value is posted through a hidden input, so it drops into an uncontrolled form like a select.
 * `loadOptions` lets the list be fetched the first time it opens (e.g. plan usage per lesson).
 */
export function SearchSelect({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  options: givenOptions,
  loadOptions,
  placeholder,
  searchPlaceholder,
  emptyText,
  loadingText,
  clearLabel,
  disabled,
  className,
  "aria-labelledby": labelledBy,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SearchSelectOption[];
  loadOptions?: () => Promise<SearchSelectOption[]>;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  loadingText?: string;
  /** When set, a first entry that clears the choice (e.g. "Nessun trainer"). */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  "aria-labelledby"?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState<SearchSelectOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const value = controlledValue ?? innerValue;

  const options = loaded ?? givenOptions;
  const entries = useMemo(() => {
    const needle = normalize(query.trim());
    const matches = needle
      ? options.filter((option) => normalize(`${option.label} ${option.description ?? ""}`).includes(needle))
      : options;
    return clearLabel && !needle ? [{ value: "", label: clearLabel } as SearchSelectOption, ...matches] : matches;
  }, [options, query, clearLabel]);
  const selected = options.find((option) => option.value === value) ?? null;

  function choose(option: SearchSelectOption) {
    if (option.disabled) return;
    if (controlledValue === undefined) setInnerValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  }

  function openChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setQuery("");
    setActive(0);
    if (loadOptions && !loaded && !loading) {
      setLoading(true);
      loadOptions()
        .then((result) => setLoaded(result))
        .catch(() => setLoaded(null))
        .finally(() => setLoading(false));
    }
  }

  function move(delta: number) {
    if (entries.length === 0) return;
    const next = (active + delta + entries.length) % entries.length;
    setActive(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = entries[active];
      if (option) choose(option);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={openChange}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-labelledby={labelledBy}
          aria-haspopup="listbox"
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] px-3.5 text-left text-[16px] transition-colors hover:border-[var(--foreground)] disabled:opacity-55",
            className
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", selected ? "" : "text-[var(--muted-foreground)]")}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.meta ? <span className="hidden shrink-0 sm:inline-flex">{selected.meta}</span> : null}
          <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] w-[min(26rem,calc(100vw-24px))] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-sheet)] outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>("input")?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b-2 border-[var(--rule)] px-3.5 focus-within:border-[var(--ring)]">
            <Search size={18} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
            <input
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={entries[active] ? `${listId}-${active}` : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              // The box's bottom rule turns violet on focus; the global focus outline would double it.
              style={{ outline: "none" }}
              className="h-12 w-full min-w-0 bg-transparent text-[16px] placeholder:text-[var(--muted-foreground)]"
            />
          </div>
          {loading ? (
            <p className="flex items-center gap-2 px-4 py-3 text-[15px] text-[var(--muted-foreground)]" role="status">
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              {loadingText}
            </p>
          ) : null}
          <ul ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1">
            {entries.length === 0 && !loading ? (
              <li className="px-3 py-3 text-[15px] text-[var(--muted-foreground)]">{emptyText}</li>
            ) : null}
            {entries.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value || "__clear"}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2",
                    index === active ? "bg-[var(--muted)]" : "",
                    option.disabled ? "cursor-not-allowed opacity-55" : ""
                  )}
                >
                  {/* The detail wraps under the name when the row is too narrow for both. */}
                  <span className="min-w-0 flex-1 basis-[11rem]">
                    <span className={cn("block truncate text-[15px]", option.value ? "font-semibold" : "text-[var(--muted-foreground)]")}>
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-sm text-[var(--muted-foreground)]">{option.description}</span>
                    ) : null}
                    {option.note ? <span className="block text-sm font-semibold text-[var(--warning-fg)]">{option.note}</span> : null}
                  </span>
                  {option.meta ? <span className="shrink-0">{option.meta}</span> : null}
                  <Check size={16} aria-hidden="true" className={cn("shrink-0", isSelected ? "opacity-100" : "hidden")} />
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
