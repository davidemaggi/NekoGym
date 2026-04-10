"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  completePasswordLoginWithTotp,
  loginWithMagicLinkToken,
  loginWithPassword,
  loginUser,
  registerUser,
  requestLoginOtp,
  requestMagicLoginLink,
  requestPasswordReset,
  resendEmailVerificationForEmail,
  resetPasswordFromToken,
  sendEmailVerification,
  verifyEmailFromToken,
  verifyLoginOtp,
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

async function getClientIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return requestHeaders.get("x-real-ip");
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

export async function loginWithPasswordAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");
  let challengeToken: string | null = null;

  if (!email || !password) {
    redirect(`/${locale}/login?error=Invalid%20input&method=password`);
  }

  try {
    const result = await loginWithPassword({ email, password, locale });
    if (result.requiresTwoFactor) {
      challengeToken = result.challengeToken;
    }
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}&method=password`);
  }

  if (challengeToken) {
    redirect(
      `/${locale}/login?method=password&step=2fa&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challengeToken)}`
    );
  }

  redirect(`/${locale}`);
}

export async function completePassword2faAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const challenge = asString(formData, "challenge");
  const code = asString(formData, "code");

  if (!challenge || !code) {
    redirect(`/${locale}/login?error=Invalid%20input&method=password&step=2fa&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challenge)}`);
  }

  try {
    await completePasswordLoginWithTotp({
      locale,
      challengeToken: challenge,
      code,
    });
  } catch (error) {
    redirect(
      `/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}&method=password&step=2fa&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challenge)}`
    );
  }

  redirect(`/${locale}`);
}

export async function requestLoginOtpAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const clientIp = await getClientIp();
  let challengeToken: string | null = null;

  if (!email) {
    redirect(`/${locale}/login?error=Invalid%20input&method=otp`);
  }

  try {
    const challenge = await requestLoginOtp({ locale, email, clientIp: clientIp ?? undefined });
    if (challenge) {
      challengeToken = challenge;
    }
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}&method=otp`);
  }

  if (challengeToken) {
    redirect(
      `/${locale}/login?method=otp&step=verify&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challengeToken)}&info=${encodeURIComponent(locale === "it" ? "Codice inviato sui canali disponibili." : "Code sent on available channels.")}`
    );
  }

  // Response uniforme per evitare user enumeration.
  redirect(
    `/${locale}/login?method=otp&step=verify&email=${encodeURIComponent(email)}&info=${encodeURIComponent(locale === "it" ? "Se l'account esiste, abbiamo inviato un codice sui canali disponibili." : "If the account exists, we sent a code on available channels.")}`
  );
}

export async function verifyLoginOtpAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();
  const challenge = asString(formData, "challenge");
  const code = asString(formData, "code");
  const clientIp = await getClientIp();

  if (!challenge || !code) {
    redirect(`/${locale}/login?error=Invalid%20input&method=otp&step=verify&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challenge)}`);
  }

  try {
    await verifyLoginOtp({ locale, challengeToken: challenge, code, clientIp: clientIp ?? undefined });
  } catch (error) {
    redirect(
      `/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}&method=otp&step=verify&email=${encodeURIComponent(email)}&challenge=${encodeURIComponent(challenge)}`
    );
  }

  redirect(`/${locale}`);
}

export async function requestMagicLinkAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const email = asString(formData, "email").toLowerCase();

  if (!email) {
    redirect(`/${locale}/login?error=Invalid%20input&method=magic`);
  }

  try {
    await requestMagicLoginLink({ locale, email });
  } catch {
    // Intentionally ignore to avoid user enumeration.
  }

  redirect(
    `/${locale}/login?method=magic&info=${encodeURIComponent(locale === "it" ? "Se l'account esiste, abbiamo inviato un magic link." : "If the account exists, we sent a magic link.")}`
  );
}

export async function magicLinkConsumeAction(formData: FormData) {
  const locale = sanitizeLocale(asString(formData, "locale"));
  const token = asString(formData, "token");

  if (!token) {
    redirect(`/${locale}/login?error=${encodeURIComponent(locale === "it" ? "Link non valido o scaduto." : "Invalid or expired link.")}`);
  }

  try {
    await loginWithMagicLinkToken({ locale, token });
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}&method=magic`);
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
  } catch (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(toErrorMessage(error))}`);
  }

  redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Email verificata con successo." : "Email verified successfully.")}`);
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
  } catch (error) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(toErrorMessage(error))}`);
  }

  redirect(`/${locale}/login?info=${encodeURIComponent(locale === "it" ? "Password aggiornata. Effettua il login." : "Password updated. Please sign in.")}`);
}

