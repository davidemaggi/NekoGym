"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  labels: {
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
  };
};

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.setAttribute("data-theme", next);
}

export function ThemeToggle({ labels }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("neko-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("neko-theme", next);
  }

  const ariaLabel = theme === "dark" ? labels.themeToLight : labels.themeToDark;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--muted)]"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

