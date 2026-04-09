import { randomBytes } from "node:crypto";

export const TELEGRAM_LINK_TOKEN_LENGTH = 32;
export const TELEGRAM_LINK_TOKEN_TTL_MINUTES = 30;

export function generateTelegramLinkToken(): string {
  // 16 random bytes encoded as hex => 32 chars.
  return randomBytes(16).toString("hex");
}

export function getTelegramBotUsername(): string | null {
  const raw = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!raw) return null;
  return raw.startsWith("@") ? raw.slice(1) : raw;
}

export function buildTelegramStartLink(token: string): string | null {
  const username = getTelegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=link_${token}`;
}

export function parseTelegramStartLinkToken(payload: string): string | null {
  const match = /^link_([a-f0-9]{32})$/i.exec(payload.trim());
  return match?.[1] ?? null;
}

