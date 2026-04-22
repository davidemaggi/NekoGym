import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { KeyRound, Smartphone, WandSparkles } from "lucide-react";

import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_LOGO_SVG, sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { getSiteSettings } from "@/lib/site-settings";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [siteSettings, registeredUser] = await Promise.all([
    getSiteSettings(),
    prisma.user.findFirst({
      select: { id: true },
    }),
  ]);
  const hasRegisteredUsers = Boolean(registeredUser);
  const siteLogoSrc = sanitizeSiteLogoSvg(siteSettings?.siteLogoSvg ?? DEFAULT_SITE_LOGO_SVG);
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

  const methodClass = (target: "password" | "otp" | "magic") =>
    cn(
      "flex w-full items-center justify-start gap-2 rounded-md border px-3 py-3 text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
      activeMethod === target
        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
        : "border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--muted)] active:bg-[var(--muted)]/80"
    );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-center">
        <Image src={siteLogoSrc} alt={`${t.appName} logo`} width={150} height={150} priority />
      </div>
      <h1 className="text-2xl font-semibold">{activeTab === "login" ? t.auth.loginTitle : t.auth.registerTitle}</h1>

      <Tabs value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login" asChild>
            <Link href={loginTabHref}>{t.auth.tabLogin}</Link>
          </TabsTrigger>
          <TabsTrigger value="register" asChild>
            <Link href={registerTabHref}>{t.auth.tabRegister}</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-2">
          <div className="flex w-full flex-col gap-3">
            <Link href={methodHref("password")} className={methodClass("password")} aria-current={activeMethod === "password" ? "page" : undefined}>
              <KeyRound className="h-4 w-4" />
              <span>{t.auth.loginMethodPassword}</span>
            </Link>
            <Link href={methodHref("otp")} className={methodClass("otp")} aria-current={activeMethod === "otp" ? "page" : undefined}>
              <Smartphone className="h-4 w-4" />
              <span>{t.auth.loginMethodOtp}</span>
            </Link>
            <Link href={methodHref("magic")} className={methodClass("magic")} aria-current={activeMethod === "magic" ? "page" : undefined}>
              <WandSparkles className="h-4 w-4" />
              <span>{t.auth.loginMethodMagicLink}</span>
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {error ? (
        <p className="rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-fg)] dark:bg-red-900/30 dark:text-red-300">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {info ? (
        <p className="rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm text-[var(--success-fg)] dark:bg-emerald-900/30 dark:text-emerald-300">
          {decodeURIComponent(info)}
        </p>
      ) : null}

      {activeTab === "login" && activeMethod === "password" && !isPassword2faStep ? (
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
            <span className="mb-1 block">{t.auth.passwordLabel}</span>
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
            {t.auth.loginMethodPassword}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && isPassword2faStep ? (
        <form action={completePassword2faAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challenge" value={challenge} />
          <input type="hidden" name="email" value={initialEmail} />

          <div className="rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">{t.auth.twoFactorTitle}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t.auth.twoFactorHint}</p>
          </div>

          <OtpCodeField />

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {t.auth.verifyCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && activeMethod === "otp" && !isOtpVerifyStep ? (
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
            {t.auth.sendCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && isOtpVerifyStep ? (
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
            {t.auth.verifyCodeCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" && activeMethod === "magic" ? (
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
            {t.auth.sendMagicLinkCta}
          </button>
        </form>
      ) : null}

      {activeTab === "login" ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            <Link href={`/${locale}/forgot-password`} className="font-medium underline">
              {t.auth.forgotPasswordCta}
            </Link>
            {" · "}
            <Link
              href={`/${locale}/login?tab=login&method=${activeMethod}&resend=1${initialEmail ? `&email=${encodeURIComponent(initialEmail)}` : ""}`}
              className="font-medium underline"
            >
              {t.auth.resendVerificationCta}
            </Link>
          </p>

          {showResendVerification ? (
            <form action={resendVerificationAction} className="space-y-2">
              <input type="hidden" name="locale" value={locale} />
              <label className="block text-sm">
                <span className="mb-1 block">{t.auth.resendVerificationLabel}</span>
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
                className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                {t.auth.resendVerificationSubmitCta}
              </button>
            </form>
          ) : null}
        </>
      ) : (
        <>
          {!hasRegisteredUsers ? (
            <p className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]">
              {t.auth.firstUserHint}
            </p>
          ) : null}

          <form action={registerAction} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />

            <label className="block text-sm">
              <span className="mb-1 block">{t.auth.nameLabel}</span>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

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
              <span className="mb-1 block">{t.auth.passwordLabel}</span>
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
              {t.auth.registerCta}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
