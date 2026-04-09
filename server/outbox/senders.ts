import nodemailer from "nodemailer";

import { getSmtpEnvConfig } from "@/lib/notifications-config";
import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "@/lib/webpush";

type OutboxItemWithUser = {
  id: string;
  userId: string;
  channel: "EMAIL" | "TELEGRAM" | "WEBPUSH";
  recipientEmail: string | null;
  subject: string | null;
  body: string;
  user: {
    email: string;
    telegramChatId: string | null;
  };
};

function buildTelegramText(subject: string | null, body: string): string {
  if (!subject) return body;
  return `*${subject}*\n\n${body}`;
}

export async function sendOutboxItem(item: OutboxItemWithUser): Promise<void> {
  if (item.channel === "EMAIL") {
    await sendEmail(item);
    return;
  }

  if (item.channel === "WEBPUSH") {
    await sendWebPush(item);
    return;
  }

  await sendTelegram(item);
}

async function sendEmail(item: OutboxItemWithUser): Promise<void> {
  const settings = getSmtpEnvConfig();

  if (!settings.host || !settings.fromEmail) {
    throw new Error("SMTP settings are incomplete");
  }

  if (settings.authEnabled && (!settings.user || !settings.hasPassword)) {
    throw new Error("SMTP auth enabled but credentials are missing");
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    ...(settings.authEnabled
      ? {
          auth: {
            user: settings.user,
            pass: process.env.SMTP_PASSWORD!,
          },
        }
      : {}),
  });

  await transporter.sendMail({
    from: settings.fromEmail,
    to: item.recipientEmail ?? item.user.email,
    subject: item.subject ?? "NekoGym notification",
    text: item.body,
  });
}

async function sendTelegram(item: OutboxItemWithUser): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const chatId = item.user.telegramChatId;
  if (!chatId) {
    throw new Error("User has no telegram chat id");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramText(item.subject, item.body),
      parse_mode: "Markdown",
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { ok?: boolean };
  if (!payload.ok) {
    throw new Error("Telegram sendMessage returned ok=false");
  }
}

async function sendWebPush(item: OutboxItemWithUser): Promise<void> {
  const subscriptions = await prisma.webPushSubscription.findMany({
    where: { userId: item.userId },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subscriptions.length === 0) {
    throw new Error("User has no web push subscription");
  }

  for (const sub of subscriptions) {
    try {
      await sendWebPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        {
          title: item.subject ?? "NekoGym",
          body: item.body,
          url: "/",
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      const isGone = message.includes("410") || message.includes("404");
      if (isGone) {
        await prisma.webPushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        continue;
      }

      throw error;
    }
  }
}

