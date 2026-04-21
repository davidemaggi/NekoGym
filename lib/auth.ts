import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import type { AuthTokenType, Prisma, UserRole as PrismaUserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";

import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { buildTotpOtpauthUri, generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import { enqueueEmailForUser } from "@/server/outbox/queue";

export type UserRole = PrismaUserRole;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: Date | null;
};

const SESSION_COOKIE_NAME = "neko_session";
const SESSION_DAYS = 30;
const VERIFY_EMAIL_TTL_MINUTES = 24 * 60;
const RESET_PASSWORD_TTL_MINUTES = 60;
const EMAIL_CHANGE_TTL_MINUTES = 24 * 60;
const LOGIN_OTP_TTL_MINUTES = 10;
const LOGIN_MAGIC_LINK_TTL_MINUTES = 20;
const LOGIN_2FA_CHALLENGE_TTL_MINUTES = 10;
const TOTP_ISSUER = "NekoGym";
const OTP_REQUEST_WINDOW_MS_DEFAULT = 10 * 60 * 1000;
const OTP_REQUEST_MAX_PER_USER_DEFAULT = 5;
const OTP_REQUEST_MAX_PER_IP_DEFAULT = 20;
const OTP_VERIFY_WINDOW_MS_DEFAULT = 10 * 60 * 1000;
const OTP_VERIFY_MAX_FAILURES_PER_USER_DEFAULT = 8;
const OTP_VERIFY_MAX_FAILURES_PER_IP_DEFAULT = 25;

function parsePositiveIntEnv(input: string | undefined, fallback: number, min: number, max: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

const OTP_REQUEST_WINDOW_MS = parsePositiveIntEnv(
  process.env.AUTH_OTP_REQUEST_WINDOW_MS,
  OTP_REQUEST_WINDOW_MS_DEFAULT,
  10_000,
  24 * 60 * 60 * 1000
);
const OTP_REQUEST_MAX_PER_USER = parsePositiveIntEnv(
  process.env.AUTH_OTP_REQUEST_MAX_PER_USER,
  OTP_REQUEST_MAX_PER_USER_DEFAULT,
  1,
  500
);
const OTP_REQUEST_MAX_PER_IP = parsePositiveIntEnv(
  process.env.AUTH_OTP_REQUEST_MAX_PER_IP,
  OTP_REQUEST_MAX_PER_IP_DEFAULT,
  1,
  2_000
);
const OTP_VERIFY_WINDOW_MS = parsePositiveIntEnv(
  process.env.AUTH_OTP_VERIFY_WINDOW_MS,
  OTP_VERIFY_WINDOW_MS_DEFAULT,
  10_000,
  24 * 60 * 60 * 1000
);
const OTP_VERIFY_MAX_FAILURES_PER_USER = parsePositiveIntEnv(
  process.env.AUTH_OTP_VERIFY_MAX_FAILURES_PER_USER,
  OTP_VERIFY_MAX_FAILURES_PER_USER_DEFAULT,
  1,
  1_000
);
const OTP_VERIFY_MAX_FAILURES_PER_IP = parsePositiveIntEnv(
  process.env.AUTH_OTP_VERIFY_MAX_FAILURES_PER_IP,
  OTP_VERIFY_MAX_FAILURES_PER_IP_DEFAULT,
  1,
  5_000
);

function buildSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function newSessionToken() {
  return randomBytes(32).toString("hex");
}

function newOneTimeToken() {
  return randomBytes(32).toString("hex");
}

function hashOneTimeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashLoginCode(code: string) {
  return createHash("sha256").update(`login:${code}`).digest("hex");
}

function hashIp(input: string) {
  return createHash("sha256").update(`ip:${input}`).digest("hex");
}

function sanitizeClientIp(raw?: string | null) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  // x-forwarded-for can include a chain: keep first hop.
  return value.split(",")[0]?.trim() || null;
}

function otpRateLimitKey(input: { flow: "request" | "verify"; scope: "ip" | "user"; value: string }) {
  return `otp:${input.flow}:${input.scope}:${input.value}`;
}

async function consumeOtpRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const nextExpiresAt = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    const current = await tx.otpRateLimit.findUnique({
      where: { key },
      select: { count: true, expiresAt: true },
    });

    if (!current || current.expiresAt <= now) {
      await tx.otpRateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt: nextExpiresAt,
        },
        update: {
          count: 1,
          expiresAt: nextExpiresAt,
        },
      });
      return true;
    }

    if (current.count >= max) {
      return false;
    }

    await tx.otpRateLimit.update({
      where: { key },
      data: {
        count: {
          increment: 1,
        },
      },
    });
    return true;
  });
}

async function clearOtpRateLimit(key: string) {
  await prisma.otpRateLimit.deleteMany({ where: { key } });
}

function generateSixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function getAppBaseUrl() {
  const raw = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

function buildLocalizedUrl(locale: string, pathWithQuery: string) {
  return `${getAppBaseUrl()}/${locale}${pathWithQuery}`;
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function createSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = buildSessionExpiry();

  await prisma.session.create({
    data: {
      token,
      expiresAt,
      userId,
    },
  });

  await setSessionCookie(token, expiresAt);
}

const getSessionWithUserByToken = cache(async (token: string) => {
  return prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isDisabled: true,
          role: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await getSessionWithUserByToken(token);

  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;
  if (session.user.isDisabled) return null;

  if (!session.user.emailVerifiedAt) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    emailVerifiedAt: session.user.emailVerifiedAt,
  };
}

async function createAuthToken(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  type: AuthTokenType;
  ttlMinutes: number;
  targetEmail?: string;
}) {
  const token = newOneTimeToken();
  const expiresAt = new Date(Date.now() + input.ttlMinutes * 60 * 1000);

  await input.tx.authToken.create({
    data: {
      userId: input.userId,
      type: input.type,
      tokenHash: hashOneTimeToken(token),
      targetEmail: input.targetEmail,
      expiresAt,
    },
  });

  return token;
}

function authMessages(locale: string) {
  const isIt = locale === "it";
  return {
    verifySubject: isIt ? "Conferma email NekoGym" : "Verify your NekoGym email",
    verifyBody: (link: string) =>
      isIt
        ? `Ciao,\n\nconferma il tuo indirizzo email cliccando questo link:\n${link}\n\nIl link scade in 24 ore.`
        : `Hello,\n\nconfirm your email address by clicking this link:\n${link}\n\nThe link expires in 24 hours.`,
    changeSubject: isIt ? "Conferma nuova email NekoGym" : "Confirm your new NekoGym email",
    changeBody: (link: string) =>
      isIt
        ? `Ciao,\n\nconferma la nuova email cliccando questo link:\n${link}\n\nFinche non confermi, la tua email corrente resta invariata.`
        : `Hello,\n\nconfirm your new email by clicking this link:\n${link}\n\nUntil you confirm, your current email remains unchanged.`,
    resetSubject: isIt ? "Reset password NekoGym" : "NekoGym password reset",
    resetBody: (link: string) =>
      isIt
        ? `Ciao,\n\nper impostare una nuova password clicca questo link:\n${link}\n\nIl link scade in 60 minuti.`
        : `Hello,\n\nto set a new password click this link:\n${link}\n\nThe link expires in 60 minutes.`,
    loginOtpSubject: isIt ? "Codice accesso NekoGym" : "NekoGym sign-in code",
    loginOtpEmailBody: (code: string) =>
      isIt
        ? `Ciao,\n\nusa questo codice per accedere: ${code}\n\nIl codice scade in ${LOGIN_OTP_TTL_MINUTES} minuti.`
        : `Hello,\n\nuse this code to sign in: ${code}\n\nThe code expires in ${LOGIN_OTP_TTL_MINUTES} minutes.`,
    loginOtpTelegramBody: (code: string) =>
      isIt
        ? `NekoGym: codice accesso ${code}. Scade in ${LOGIN_OTP_TTL_MINUTES} min.`
        : `NekoGym: sign-in code ${code}. Expires in ${LOGIN_OTP_TTL_MINUTES} min.`,
    loginOtpWebPushBody: (code: string) =>
      isIt
        ? `Codice accesso NekoGym: ${code}`
        : `NekoGym sign-in code: ${code}`,
    magicLinkSubject: isIt ? "Magic link accesso NekoGym" : "NekoGym magic sign-in link",
    magicLinkBody: (link: string) =>
      isIt
        ? `Ciao,\n\nclicca questo link per accedere:\n${link}\n\nIl link scade in ${LOGIN_MAGIC_LINK_TTL_MINUTES} minuti.`
        : `Hello,\n\nclick this link to sign in:\n${link}\n\nThe link expires in ${LOGIN_MAGIC_LINK_TTL_MINUTES} minutes.`,
    emailNotVerified: isIt ? "Email non confermata." : "Email is not verified.",
    tokenInvalid: isIt ? "Link non valido o scaduto." : "Invalid or expired link.",
    emailAlreadyUsed: isIt ? "Email gia in uso." : "Email already in use.",
    passwordTooShort: isIt ? "Password troppo corta." : "Password too short.",
    currentPasswordInvalid: isIt ? "Password corrente non valida." : "Current password is invalid.",
    loginCodeInvalid: isIt ? "Codice non valido o scaduto." : "Invalid or expired code.",
    loginCodeRateLimited: isIt ? "Troppi tentativi. Riprova tra qualche minuto." : "Too many attempts. Please try again in a few minutes.",
    twoFactorNotConfigured: isIt ? "2FA non configurata." : "Two-factor authentication is not configured.",
  };
}

function isUsableLoginToken(token: { consumedAt: Date | null; expiresAt: Date }) {
  return !token.consumedAt && token.expiresAt > new Date();
}

type LoginTargetUser = {
  id: string;
  email: string;
  name: string;
  isDisabled: boolean;
  emailVerifiedAt: Date | null;
  passwordHash: string;
  totpEnabled: boolean;
  totpSecret: string | null;
  telegramChatId: string | null;
  notifyByTelegram: boolean;
  notifyByWebPush: boolean;
};

function safeEqualString(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

async function getLoginTargetUserByEmail(email: string): Promise<LoginTargetUser | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isDisabled: true,
      emailVerifiedAt: true,
      passwordHash: true,
      totpEnabled: true,
      totpSecret: true,
      telegramChatId: true,
      notifyByTelegram: true,
      notifyByWebPush: true,
    },
  });
}

export async function sendEmailVerification(input: { userId: string; locale: string }) {
  const msg = authMessages(input.locale);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!user) return;

    const token = await createAuthToken({
      tx,
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      ttlMinutes: VERIFY_EMAIL_TTL_MINUTES,
    });
    const link = buildLocalizedUrl(input.locale, `/verify-email?token=${encodeURIComponent(token)}`);

    await enqueueEmailForUser(tx, {
      userId: user.id,
      subject: msg.verifySubject,
      body: msg.verifyBody(link),
      allowUnverifiedEmail: true,
    });
  });
}

export async function resendEmailVerificationForEmail(input: { email: string; locale: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt) return;

  await sendEmailVerification({ userId: user.id, locale: input.locale });
}

export async function requestEmailChange(input: { userId: string; locale: string; newEmail: string }) {
  const normalizedEmail = input.newEmail.trim().toLowerCase();
  const msg = authMessages(input.locale);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true, email: true } });
    if (!user) return;
    if (user.email.toLowerCase() === normalizedEmail) return;

    const owner = await tx.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { pendingEmail: normalizedEmail }],
        NOT: { id: input.userId },
      },
      select: { id: true },
    });
    if (owner) throw new Error(msg.emailAlreadyUsed);

    await tx.user.update({ where: { id: input.userId }, data: { pendingEmail: normalizedEmail } });

    const token = await createAuthToken({
      tx,
      userId: input.userId,
      type: "EMAIL_CHANGE",
      ttlMinutes: EMAIL_CHANGE_TTL_MINUTES,
      targetEmail: normalizedEmail,
    });

    const link = buildLocalizedUrl(input.locale, `/verify-email?token=${encodeURIComponent(token)}`);
    await enqueueEmailForUser(tx, {
      userId: input.userId,
      subject: msg.changeSubject,
      body: msg.changeBody(link),
      recipientEmail: normalizedEmail,
      allowUnverifiedEmail: true,
    });
  });
}

export async function requestPasswordReset(input: { email: string; locale: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const msg = authMessages(input.locale);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (!user) return;

    const token = await createAuthToken({
      tx,
      userId: user.id,
      type: "PASSWORD_RESET",
      ttlMinutes: RESET_PASSWORD_TTL_MINUTES,
    });
    const link = buildLocalizedUrl(input.locale, `/reset-password?token=${encodeURIComponent(token)}`);

    await enqueueEmailForUser(tx, {
      userId: user.id,
      subject: msg.resetSubject,
      body: msg.resetBody(link),
      allowUnverifiedEmail: true,
    });
  });
}

export async function verifyEmailFromToken(input: { token: string; locale: string }) {
  const msg = authMessages(input.locale);
  const hashed = hashOneTimeToken(input.token);

  await prisma.$transaction(async (tx) => {
    const token = await tx.authToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });
    if (!token || token.consumedAt || token.expiresAt <= new Date()) {
      throw new Error(msg.tokenInvalid);
    }

    if (token.type === "EMAIL_VERIFICATION") {
      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
      });
    }

    if (token.type === "EMAIL_CHANGE") {
      const target = token.targetEmail?.trim().toLowerCase();
      if (!target) throw new Error(msg.tokenInvalid);

      const owner = await tx.user.findFirst({
        where: { email: target, NOT: { id: token.userId } },
        select: { id: true },
      });
      if (owner) throw new Error(msg.emailAlreadyUsed);

      await tx.user.update({
        where: { id: token.userId },
        data: {
          email: target,
          pendingEmail: null,
          emailVerifiedAt: new Date(),
        },
      });
    }

    await tx.authToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
  });
}

export async function resetPasswordFromToken(input: { token: string; locale: string; newPassword: string }) {
  const msg = authMessages(input.locale);
  if (input.newPassword.length < 8) throw new Error(msg.passwordTooShort);

  const hashed = hashOneTimeToken(input.token);
  await prisma.$transaction(async (tx) => {
    const token = await tx.authToken.findUnique({ where: { tokenHash: hashed } });
    if (!token || token.type !== "PASSWORD_RESET" || token.consumedAt || token.expiresAt <= new Date()) {
      throw new Error(msg.tokenInvalid);
    }

    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash: hashPassword(input.newPassword) },
    });

    await tx.authToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: token.userId } });
  });
}

export async function changePassword(input: { userId: string; locale: string; currentPassword: string; newPassword: string }) {
  const msg = authMessages(input.locale);
  if (input.newPassword.length < 8) throw new Error(msg.passwordTooShort);

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error(msg.currentPasswordInvalid);
  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new Error(msg.currentPasswordInvalid);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { passwordHash: hashPassword(input.newPassword) },
    });
    await tx.session.deleteMany({
      where: { userId: input.userId },
    });
  });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Email already in use.");
  }

  const usersCount = await prisma.user.count();
  const role: UserRole = usersCount === 0 ? "ADMIN" : "TRAINEE";

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      role,
    },
  });
  return user;
}

export async function loginWithPassword(input: { email: string; password: string; locale: string }) {
  const msg = authMessages(input.locale);
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await getLoginTargetUserByEmail(normalizedEmail);

  if (!user || user.isDisabled || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid credentials.");
  }

  if (!user.emailVerifiedAt) {
    throw new Error(msg.emailNotVerified);
  }

  if (user.totpEnabled) {
    const challengeToken = await prisma.$transaction(async (tx) => {
      return createAuthToken({
        tx,
        userId: user.id,
        type: "LOGIN_2FA_CHALLENGE",
        ttlMinutes: LOGIN_2FA_CHALLENGE_TTL_MINUTES,
      });
    });

    return {
      requiresTwoFactor: true as const,
      challengeToken,
    };
  }

  await createSession(user.id);
  return {
    requiresTwoFactor: false as const,
  };
}

export async function completePasswordLoginWithTotp(input: {
  locale: string;
  challengeToken: string;
  code: string;
}) {
  const msg = authMessages(input.locale);
  const hashedToken = hashOneTimeToken(input.challengeToken);

  const challenge = await prisma.authToken.findUnique({
    where: { tokenHash: hashedToken },
    include: {
      user: {
        select: {
          id: true,
          isDisabled: true,
          emailVerifiedAt: true,
          totpEnabled: true,
          totpSecret: true,
        },
      },
    },
  });

  if (!challenge || challenge.type !== "LOGIN_2FA_CHALLENGE" || !isUsableLoginToken(challenge)) {
    throw new Error(msg.tokenInvalid);
  }
  if (challenge.user.isDisabled) {
    throw new Error(msg.tokenInvalid);
  }

  if (!challenge.user.emailVerifiedAt) {
    throw new Error(msg.emailNotVerified);
  }

  if (!challenge.user.totpEnabled || !challenge.user.totpSecret) {
    throw new Error(msg.twoFactorNotConfigured);
  }

  if (!verifyTotpCode({ secret: challenge.user.totpSecret, code: input.code })) {
    throw new Error(msg.loginCodeInvalid);
  }

  const consumed = await prisma.authToken.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  if (consumed.count === 0) {
    throw new Error(msg.tokenInvalid);
  }

  await createSession(challenge.user.id);
}

export async function requestLoginOtp(input: { locale: string; email: string; clientIp?: string }) {
  const msg = authMessages(input.locale);
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await getLoginTargetUserByEmail(normalizedEmail);

  if (!user || user.isDisabled || !user.emailVerifiedAt) {
    return null;
  }

  const clientIp = sanitizeClientIp(input.clientIp);
  const requestUserKey = otpRateLimitKey({
    flow: "request",
    scope: "user",
    value: user.id,
  });
  if (!(await consumeOtpRateLimit(requestUserKey, OTP_REQUEST_MAX_PER_USER, OTP_REQUEST_WINDOW_MS))) {
    throw new Error(msg.loginCodeRateLimited);
  }
  if (clientIp) {
    const requestIpKey = otpRateLimitKey({
      flow: "request",
      scope: "ip",
      value: hashIp(clientIp),
    });
    if (!(await consumeOtpRateLimit(requestIpKey, OTP_REQUEST_MAX_PER_IP, OTP_REQUEST_WINDOW_MS))) {
      throw new Error(msg.loginCodeRateLimited);
    }
  }

  const code = generateSixDigitCode();

  return prisma.$transaction(async (tx) => {
    const challengeToken = await createAuthToken({
      tx,
      userId: user.id,
      type: "LOGIN_OTP",
      ttlMinutes: LOGIN_OTP_TTL_MINUTES,
      targetEmail: hashLoginCode(code),
    });

    await enqueueEmailForUser(tx, {
      userId: user.id,
      subject: msg.loginOtpSubject,
      body: msg.loginOtpEmailBody(code),
      allowUnverifiedEmail: true,
    });

    const extraRows: Prisma.NotificationOutboxCreateManyInput[] = [];

    if (user.telegramChatId) {
      extraRows.push({
        userId: user.id,
        channel: "TELEGRAM",
        subject: msg.loginOtpSubject,
        body: msg.loginOtpTelegramBody(code),
      });
    }

    const hasPushSubscription = await tx.webPushSubscription.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (hasPushSubscription) {
      extraRows.push({
        userId: user.id,
        channel: "WEBPUSH",
        subject: msg.loginOtpSubject,
        body: msg.loginOtpWebPushBody(code),
      });
    }

    if (extraRows.length > 0) {
      await tx.notificationOutbox.createMany({ data: extraRows });
    }

    return challengeToken;
  });
}

export async function verifyLoginOtp(input: {
  locale: string;
  challengeToken: string;
  code: string;
  clientIp?: string;
}) {
  const msg = authMessages(input.locale);
  const cleanCode = input.code.trim();

  const clientIp = sanitizeClientIp(input.clientIp);
  const ipKey = clientIp
    ? otpRateLimitKey({
        flow: "verify",
        scope: "ip",
        value: hashIp(clientIp),
      })
    : null;

  if (!/^\d{6}$/.test(cleanCode)) {
    if (ipKey) {
      await consumeOtpRateLimit(ipKey, OTP_VERIFY_MAX_FAILURES_PER_IP, OTP_VERIFY_WINDOW_MS);
    }
    throw new Error(msg.loginCodeInvalid);
  }

  const hashedToken = hashOneTimeToken(input.challengeToken);
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashedToken },
    include: { user: { select: { id: true, isDisabled: true, emailVerifiedAt: true } } },
  });

  if (!token || token.type !== "LOGIN_OTP" || !isUsableLoginToken(token)) {
    if (ipKey) {
      await consumeOtpRateLimit(ipKey, OTP_VERIFY_MAX_FAILURES_PER_IP, OTP_VERIFY_WINDOW_MS);
    }
    throw new Error(msg.loginCodeInvalid);
  }

  const userKey = otpRateLimitKey({
    flow: "verify",
    scope: "user",
    value: token.userId,
  });
  if (!(await consumeOtpRateLimit(userKey, OTP_VERIFY_MAX_FAILURES_PER_USER, OTP_VERIFY_WINDOW_MS))) {
    throw new Error(msg.loginCodeRateLimited);
  }

  if (ipKey && !(await consumeOtpRateLimit(ipKey, OTP_VERIFY_MAX_FAILURES_PER_IP, OTP_VERIFY_WINDOW_MS))) {
    throw new Error(msg.loginCodeRateLimited);
  }

  if (!token.targetEmail || !safeEqualString(token.targetEmail, hashLoginCode(cleanCode))) {
    throw new Error(msg.loginCodeInvalid);
  }
  if (token.user.isDisabled) {
    throw new Error(msg.loginCodeInvalid);
  }

  if (!token.user.emailVerifiedAt) {
    throw new Error(msg.emailNotVerified);
  }

  const consumed = await prisma.authToken.updateMany({
    where: {
      id: token.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  if (consumed.count === 0) {
    throw new Error(msg.loginCodeInvalid);
  }

  await Promise.all([clearOtpRateLimit(userKey), ...(ipKey ? [clearOtpRateLimit(ipKey)] : [])]);

  await createSession(token.user.id);
}

export async function requestMagicLoginLink(input: { locale: string; email: string }) {
  const msg = authMessages(input.locale);
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await getLoginTargetUserByEmail(normalizedEmail);

  if (!user || user.isDisabled || !user.emailVerifiedAt) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const token = await createAuthToken({
      tx,
      userId: user.id,
      type: "LOGIN_MAGIC_LINK",
      ttlMinutes: LOGIN_MAGIC_LINK_TTL_MINUTES,
    });
    const link = buildLocalizedUrl(input.locale, `/magic-link?token=${encodeURIComponent(token)}`);

    await enqueueEmailForUser(tx, {
      userId: user.id,
      subject: msg.magicLinkSubject,
      body: msg.magicLinkBody(link),
      allowUnverifiedEmail: true,
    });
  });
}

export async function loginWithMagicLinkToken(input: { locale: string; token: string }) {
  const msg = authMessages(input.locale);
  const hashed = hashOneTimeToken(input.token);

  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashed },
    include: {
      user: {
        select: {
          id: true,
          isDisabled: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!token || token.type !== "LOGIN_MAGIC_LINK" || !isUsableLoginToken(token)) {
    throw new Error(msg.tokenInvalid);
  }
  if (token.user.isDisabled) {
    throw new Error(msg.tokenInvalid);
  }

  if (!token.user.emailVerifiedAt) {
    throw new Error(msg.emailNotVerified);
  }

  const consumed = await prisma.authToken.updateMany({
    where: {
      id: token.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  if (consumed.count === 0) {
    throw new Error(msg.tokenInvalid);
  }

  await createSession(token.user.id);
}

export async function startTotpSetup(input: { userId: string; accountName: string; issuer?: string }) {
  const secret = generateTotpSecret();
  const otpauthUri = buildTotpOtpauthUri({
    secret,
    accountName: input.accountName,
    issuer: input.issuer ?? TOTP_ISSUER,
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      totpSecret: secret,
      totpEnabled: false,
    },
  });

  return { secret, otpauthUri };
}

export async function enableTotp(input: { userId: string; code: string; locale: string }) {
  const msg = authMessages(input.locale);
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      totpSecret: true,
    },
  });

  if (!user?.totpSecret) {
    throw new Error(msg.twoFactorNotConfigured);
  }

  if (!verifyTotpCode({ secret: user.totpSecret, code: input.code })) {
    throw new Error(msg.loginCodeInvalid);
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      totpEnabled: true,
    },
  });
}

export async function disableTotp(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpEnabled: false,
      totpSecret: null,
    },
  });
}

export async function logoutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  await clearSessionCookie();
}
