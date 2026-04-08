import { randomBytes } from "node:crypto";

import type { UserRole as PrismaUserRole } from "@prisma/client";
import { cookies } from "next/headers";

import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type UserRole = PrismaUserRole;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const SESSION_COOKIE_NAME = "neko_session";
const SESSION_DAYS = 30;

function buildSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function newSessionToken() {
  return randomBytes(32).toString("hex");
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

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
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

  await createSession(user.id);
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const isValid = verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials.");
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


