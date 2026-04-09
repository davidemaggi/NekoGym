import { createHash, randomBytes } from "node:crypto";

import type { AuthTokenType, Prisma, UserRole as PrismaUserRole } from "@prisma/client";
import { cookies } from "next/headers";

import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
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

function appBaseUrl() {
  return process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

function buildLocalizedUrl(locale: string, pathWithQuery: string) {
  return `${appBaseUrl()}/${locale}${pathWithQuery}`;
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

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;

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
    emailNotVerified: isIt ? "Email non confermata." : "Email is not verified.",
    tokenInvalid: isIt ? "Link non valido o scaduto." : "Invalid or expired link.",
    emailAlreadyUsed: isIt ? "Email gia in uso." : "Email already in use.",
    passwordTooShort: isIt ? "Password troppo corta." : "Password too short.",
    currentPasswordInvalid: isIt ? "Password corrente non valida." : "Current password is invalid.",
  };
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

  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash: hashPassword(input.newPassword) },
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

export async function loginUser(input: { email: string; password: string; locale: string }) {
  const msg = authMessages(input.locale);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const isValid = verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials.");
  }

  if (!user.emailVerifiedAt) {
    throw new Error(msg.emailNotVerified);
  }

  await createSession(user.id);
  return user;
}

export async function logoutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  await clearSessionCookie();
}


