"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  labels: {
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
  };
  className?: string;
};

// Stateless on purpose: the server cannot know the theme, so icon and label are chosen by the
// `.dark` class the inline script set before paint. No hydration mismatch, no flash.
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("neko-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--sidebar-link)] transition-colors hover:bg-[var(--sidebar-link-hover)]",
        className
      )}
    >
      <Moon size={18} aria-hidden="true" className="dark:hidden" />
      <Sun size={18} aria-hidden="true" className="hidden dark:block" />
      <span className="sr-only dark:hidden">{labels.themeToDark}</span>
      <span className="sr-only hidden dark:inline">{labels.themeToLight}</span>
    </button>
  );
}
