"use server";

import { redirect } from "next/navigation";

import { loginUser, registerUser } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";

function sanitizeLocale(localeRaw: string): string {
  return isLocale(localeRaw) ? localeRaw : defaultLocale;
}

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected error.";
}

export async function registerAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const name = asString(formData, "name");
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");

  if (!name || !email || password.length < 8) {
    redirect(`/${locale}/register?error=Invalid%20input`);
  }

  try {
    await registerUser({ name, email, password });
  } catch (error) {
    redirect(`/${locale}/register?error=${encodeURIComponent(toErrorMessage(error))}`);
  }

  redirect(`/${locale}`);
}

export async function loginAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");

  if (!email || !password) {
    redirect(`/${locale}/login?error=Invalid%20input`);
  }

  try {
    await loginUser({ email, password });
  } catch {
    redirect(`/${locale}/login?error=Invalid%20credentials`);
  }

  redirect(`/${locale}`);
}

