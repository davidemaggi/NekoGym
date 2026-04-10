"use client";

import { useLayoutEffect } from "react";

export function ThemeInitializer() {
  useLayoutEffect(() => {
    try {
      const stored = window.localStorage.getItem("neko-theme");
      const theme = stored === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  return null;
}
