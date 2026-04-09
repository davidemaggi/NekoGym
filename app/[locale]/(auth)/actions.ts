"use server";

import { redirect } from "next/navigation";

import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resendEmailVerificationForEmail,
  resetPasswordFromToken,
  sendEmailVerification,
  verifyEmailFromToken,
} from "@/lib/auth";
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
    const user = await registerUser({ name, email, password });
    await sendEmailVerification({ userId: user.id, locale });
  } catch (error) {
    redirect(`/${locale}/register?error=${encodeURIComponent(toErrorMessage(error))}`);
  }

  redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Controlla la tua email per confermare l'account." : "Check your email to verify your account.")}`);
}

export async function loginAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");

  if (!email || !password) {
    redirect(`/${locale}/login?error=Invalid%20input`);
  }

  try {
    await loginUser({ email, password, locale });
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}`);
  }

  redirect(`/${locale}`);
}

export async function resendVerificationAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();

  if (!email) {
    redirect(`/${locale}/login?error=Invalid%20input`);
  }

  try {
    await resendEmailVerificationForEmail({ email, locale });
  } catch {
    // Intentionally ignore to avoid user enumeration.
  }

  redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Se l'email esiste, abbiamo inviato un nuovo link di verifica." : "If the email exists, we sent a new verification link.")}`);
}

export async function verifyEmailAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const token = asString(formData, "token");

  if (!token) {
    redirect(`/${locale}/login?error=${encodeURIComponent(locale === "it" ? "Link non valido o scaduto." : "Invalid or expired link.")}`);
  }

  try {
    await verifyEmailFromToken({ token, locale });
    redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Email verificata con successo." : "Email verified successfully.")}`);
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}`);
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();

  if (!email) {
    redirect(`/${locale}/forgot-password?error=Invalid%20input`);
  }

  try {
    await requestPasswordReset({ email, locale });
  } catch {
    // Intentionally ignore to avoid user enumeration.
  }

  redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Se l'email esiste, abbiamo inviato il link di reset password." : "If the email exists, we sent a password reset link.")}`);
}

export async function resetPasswordAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const token = asString(formData, "token");
  const password = asString(formData, "password");

  if (!token || password.length < 8) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=Invalid%20input`);
  }

  try {
    await resetPasswordFromToken({ token, locale, newPassword: password });
    redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Password aggiornata. Effettua il login." : "Password updated. Please sign in.")}`);
  } catch (error) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(toErrorMessage(error))}`);
  }
}

