import Link from "next/link";
import { notFound } from "next/navigation";
import { KeyRound, Mail, MessageSquareText } from "lucide-react";

import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

import {
  completePassword2faAction,
  loginWithPasswordAction,
  registerAction,
  requestLoginOtpAction,
  requestMagicLinkAction,
  resendVerificationAction,
  verifyLoginOtpAction,
} from "../actions";
import { OtpCodeField } from "@/components/ui/otp-code-field";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthField, AuthNotice, authSubmitClass } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    tab?: string;
    resend?: string;
  }>;
}) {
  const [{ locale }, { error, info, method, step, challenge, email, tab, resend }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);
  const registeredUser = await prisma.user.findFirst({ select: { id: true } });
  const hasRegisteredUsers = Boolean(registeredUser);
  const activeTab = tab === "register" ? "register" : "login";
  const activeMethod = method === "otp" || method === "magic" ? method : "password";
  const isPassword2faStep = activeMethod === "password" && step === "2fa" && Boolean(challenge);
  const isOtpVerifyStep = activeMethod === "otp" && step === "verify" && Boolean(challenge);
  const initialEmail = email ?? "";
  const showResendVerification = resend === "1";

  const loginTabHref = `/${locale}/login?tab=login${initialEmail ? `&email=${encodeURIComponent(initialEmail)}` : ""}`;
  const registerTabHref = `/${locale}/login?tab=register`;
  const methodHref = (nextMethod: "password" | "otp" | "magic") =>
    `/${locale}/login?tab=login&method=${nextMethod}${initialEmail ? `&email=${encodeURIComponent(initialEmail)}` : ""}`;

  const segmentClass = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-[15px] font-semibold leading-tight transition-colors",
      active
        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    );
  const methods = [
    { key: "password", label: t.auth.loginMethodPassword, icon: KeyRound },
    { key: "otp", label: t.auth.loginMethodOtp, icon: MessageSquareText },
    { key: "magic", label: t.auth.loginMethodMagicLink, icon: Mail },
  ] as const;
  const methodHint = activeMethod === "otp" ? t.auth.loginMethodOtpHint : activeMethod === "magic" ? t.auth.loginMethodMagicHint : null;
  const inStep = isPassword2faStep || isOtpVerifyStep;

  return (
    <section className="space-y-6">
      {/* The tabs below already say Accedi / Iscriviti: the heading names the gym. */}
      <AuthHeader fallbackName={t.appName} asHeading headingSuffix={activeTab === "login" ? t.auth.loginTitle : t.auth.registerTitle} />

      {!inStep ? (
        <nav aria-label={`${t.auth.tabLogin} / ${t.auth.tabRegister}`} className="grid grid-cols-2 gap-0.5 rounded-xl bg-[var(--muted)] p-1">
          <Link href={loginTabHref} aria-current={activeTab === "login" ? "page" : undefined} className={segmentClass(activeTab === "login")}>
            {t.auth.tabLogin}
          </Link>
          <Link href={registerTabHref} aria-current={activeTab === "register" ? "page" : undefined} className={segmentClass(activeTab === "register")}>
            {t.auth.tabRegister}
          </Link>
        </nav>
      ) : null}

      {error ? <AuthNotice tone="error">{decodeURIComponent(error)}</AuthNotice> : null}
      {error && activeTab === "register" ? (
        <ul className="-mt-3 flex flex-wrap gap-x-5 text-[15px]">
          <li>
            <Link href={loginTabHref} className="inline-flex min-h-11 items-center font-semibold underline decoration-[1.5px] underline-offset-4">
              {t.auth.hasAccount} {t.auth.loginCta}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/forgot-password`} className="inline-flex min-h-11 items-center font-semibold underline decoration-[1.5px] underline-offset-4">
              {t.auth.forgotPasswordCta}
            </Link>
          </li>
        </ul>
      ) : null}
      {info ? <AuthNotice tone="info">{decodeURIComponent(info)}</AuthNotice> : null}

      {activeTab === "login" && !inStep ? (
        <div className="space-y-2">
          <p id="login-method-label" className="text-sm font-semibold">{t.auth.loginMethodLabel}</p>
          <nav aria-labelledby="login-method-label" className="grid grid-cols-3 gap-0.5 rounded-xl bg-[var(--muted)] p-1">
            {methods.map(({ key, label, icon: Icon }) => (
              <Link key={key} href={methodHref(key)} aria-current={activeMethod === key ? "page" : undefined} className={segmentClass(activeMethod === key)}>
                <Icon size={16} aria-hidden="true" className="hidden shrink-0 sm:block" />
                {label}
              </Link>
            ))}
          </nav>
          {methodHint ? <p className="text-[15px] text-[var(--muted-foreground)]">{methodHint}</p> : null}
        </div>
      ) : null}

      {activeTab === "login" && activeMethod === "password" && !isPassword2faStep ? (
        <form action={loginWithPasswordAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <AuthField id="login-email" label={t.auth.emailLabel} name="email" type="email" autoComplete="email" required defaultValue={initialEmail} />
          <AuthField id="login-password" label={t.auth.passwordLabel} name="password" type="password" autoComplete="current-password" required minLength={8} />
          <button type="submit" className={authSubmitClass}>
            {t.auth.loginCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && isPassword2faStep ? (
        <form action={completePassword2faAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="email" value={initialEmail} />
          <div>
            <h2 className="text-[17px] font-semibold">{t.auth.twoFactorTitle}</h2>
            <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">{t.auth.twoFactorHint}</p>
          </div>
          <OtpCodeField id="login-2fa-code" />
          <button type="submit" className={authSubmitClass}>
            {t.auth.verifyCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && activeMethod === "otp" && !isOtpVerifyStep ? (
        <form action={requestLoginOtpAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <AuthField id="otp-email" label={t.auth.emailLabel} name="email" type="email" autoComplete="email" required defaultValue={initialEmail} />
          <button type="submit" className={authSubmitClass}>
            {t.auth.sendCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && isOtpVerifyStep ? (
        <form action={verifyLoginOtpAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="email" value={initialEmail} />
          <p className="text-[15px] text-[var(--muted-foreground)]">
            {t.auth.emailLabel}: <span className="break-all font-semibold text-[var(--foreground)]">{initialEmail}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="login-otp-code">{t.auth.loginMethodOtp}</Label>
            <OtpCodeField id="login-otp-code" />
          </div>
          <button type="submit" className={authSubmitClass}>
            {t.auth.verifyCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && activeMethod === "magic" ? (
        <form action={requestMagicLinkAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <AuthField id="magic-email" label={t.auth.emailLabel} name="email" type="email" autoComplete="email" required defaultValue={initialEmail} />
          <button type="submit" className={authSubmitClass}>
            {t.auth.sendMagicLinkCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" ? (
        <div className="space-y-4 border-t border-[var(--rule)] pt-4">
          <ul className="flex flex-col items-start gap-1 text-[15px]">
            <li>
              <Link href={`/${locale}/forgot-password`} className="inline-flex min-h-11 items-center font-semibold underline decoration-[1.5px] underline-offset-4">
                {t.auth.forgotPasswordCta}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/login?tab=login&method=${activeMethod}&resend=1${initialEmail ? `&email=${encodeURIComponent(initialEmail)}` : ""}`}
                className="inline-flex min-h-11 items-center font-semibold underline decoration-[1.5px] underline-offset-4"
              >
                {t.auth.resendVerificationCta}
              </Link>
            </li>
          </ul>

          {showResendVerification ? (
            <form action={resendVerificationAction} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <AuthField id="resend-email" label={t.auth.resendVerificationLabel} name="email" type="email" autoComplete="email" required defaultValue={initialEmail} />
              <Button type="submit" variant="outline" className="w-full">
                {t.auth.resendVerificationSubmitCta}
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <>
          {!hasRegisteredUsers ? <AuthNotice tone="info">{t.auth.firstUserHint}</AuthNotice> : null}
          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <AuthField id="register-name" label={t.auth.nameLabel} name="name" type="text" autoComplete="name" required />
            <AuthField id="register-email" label={t.auth.emailLabel} name="email" type="email" autoComplete="email" required defaultValue={initialEmail} />
            <AuthField id="register-password" label={t.auth.passwordLabel} hint={t.auth.passwordHint} name="password" type="password" autoComplete="new-password" required minLength={8} />
            <button type="submit" className={authSubmitClass}>
              {t.auth.registerCta}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
