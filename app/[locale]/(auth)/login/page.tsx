import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  completePassword2faAction,
  loginWithPasswordAction,
  requestLoginOtpAction,
  requestMagicLinkAction,
  resendVerificationAction,
  verifyLoginOtpAction,
} from "../actions";
import { OtpCodeField } from "@/components/ui/otp-code-field";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    info?: string;
    method?: string;
    step?: string;
    challenge?: string;
    email?: string;
  }>;
}) {
  const [{ locale }, { error, info, method, step, challenge, email }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);
  const activeMethod = method === "otp" || method === "magic" ? method : "password";
  const isPassword2faStep = activeMethod === "password" && step === "2fa" && Boolean(challenge);
  const isOtpVerifyStep = activeMethod === "otp" && step === "verify" && Boolean(challenge);
  const initialEmail = email ?? "";

  const passwordLabel = locale === "it" ? "Password" : "Password";
  const loginWithPasswordLabel = locale === "it" ? "Accedi con password" : "Sign in with password";
  const loginWithOtpLabel = locale === "it" ? "Codice 6 cifre" : "6-digit code";
  const loginWithMagicLabel = locale === "it" ? "Magic link" : "Magic link";
  const sendCodeLabel = locale === "it" ? "Invia codice" : "Send code";
  const verifyCodeLabel = locale === "it" ? "Verifica codice" : "Verify code";
  const sendMagicLabel = locale === "it" ? "Invia magic link" : "Send magic link";
  const twoFactorTitle = locale === "it" ? "Conferma 2FA" : "Confirm 2FA";
  const twoFactorHint =
    locale === "it"
      ? "Inserisci il codice dell'app authenticator per completare l'accesso con password."
      : "Enter your authenticator app code to complete password sign-in.";

  const tabClass = (tab: string) =>
    cn(
      "rounded-md border px-3 py-2 text-sm",
      activeMethod === tab
        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
        : "border-[var(--surface-border)] hover:bg-[var(--muted)]"
    );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.auth.loginTitle}</h1>

      <div className="grid grid-cols-3 gap-2">
        <Link href={`/${locale}/login?method=password`} className={tabClass("password")}>
          {loginWithPasswordLabel}
        </Link>
        <Link href={`/${locale}/login?method=otp`} className={tabClass("otp")}>
          {loginWithOtpLabel}
        </Link>
        <Link href={`/${locale}/login?method=magic`} className={tabClass("magic")}>
          {loginWithMagicLabel}
        </Link>
      </div>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {info ? (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {decodeURIComponent(info)}
        </p>
      ) : null}

      {activeMethod === "password" && !isPassword2faStep ? (
        <form action={loginWithPasswordAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <label className="block text-sm">
            <span className="mb-1 block">{t.auth.emailLabel}</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block">{passwordLabel}</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {loginWithPasswordLabel}
          </button>
        </form>
      ) : null}

      {isPassword2faStep ? (
        <form action={completePassword2faAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="email" value={initialEmail} />

          <div className="rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">{twoFactorTitle}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{twoFactorHint}</p>
          </div>

          <OtpCodeField />

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {verifyCodeLabel}
          </button>
        </form>
      ) : null}

      {activeMethod === "otp" && !isOtpVerifyStep ? (
        <form action={requestLoginOtpAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <label className="block text-sm">
            <span className="mb-1 block">{t.auth.emailLabel}</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {sendCodeLabel}
          </button>
        </form>
      ) : null}

      {isOtpVerifyStep ? (
        <form action={verifyLoginOtpAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="email" value={initialEmail} />

          <label className="block text-sm">
            <span className="mb-1 block">{t.auth.emailLabel}</span>
            <input
              name="email_visible"
              type="email"
              disabled
              value={initialEmail}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--muted)] px-3 py-2 text-sm"
            />
          </label>

          <OtpCodeField />

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {verifyCodeLabel}
          </button>
        </form>
      ) : null}

      {activeMethod === "magic" ? (
        <form action={requestMagicLinkAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <label className="block text-sm">
            <span className="mb-1 block">{t.auth.emailLabel}</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {sendMagicLabel}
          </button>
        </form>
      ) : null}

      <form action={resendVerificationAction} className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="block text-sm">
          <span className="mb-1 block">{locale === "it" ? "Reinvia verifica email" : "Resend email verification"}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          {locale === "it" ? "Reinvia link" : "Resend link"}
        </button>
      </form>

      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href={`/${locale}/forgot-password`} className="font-medium underline">
          {locale === "it" ? "Password dimenticata?" : "Forgot password?"}
        </Link>
      </p>

      <p className="text-sm text-[var(--muted-foreground)]">
        {t.auth.noAccount}{" "}
        <Link href={`/${locale}/register`} className="font-medium underline">
          {t.auth.registerCta}
        </Link>
      </p>
    </section>
  );
}

