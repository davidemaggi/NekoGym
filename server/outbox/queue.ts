import type { Prisma } from "@prisma/client";

type UserNotificationTarget = {
  id: string;
  telegramChatId: string | null;
};

type EnqueueEmailInput = {
  userId: string;
  subject: string;
  body: string;
  recipientEmail?: string;
  allowUnverifiedEmail?: boolean;
};

export async function enqueueNotificationForUsers(
  tx: Prisma.TransactionClient,
  users: UserNotificationTarget[],
  input: {
    subject: string;
    body: string;
  }
) {
  if (users.length === 0) return 0;

  const eligibleUsers = await tx.user.findMany({
    where: {
      id: { in: users.map((user) => user.id) },
      emailVerifiedAt: { not: null },
    },
    select: {
      id: true,
      notifyByEmail: true,
      notifyByTelegram: true,
      notifyByWebPush: true,
    },
  });
  const eligibleById = new Map(eligibleUsers.map((user) => [user.id, user]));
  const filteredUsers = users.filter((user) => eligibleById.has(user.id));
  if (filteredUsers.length === 0) return 0;

  const pushUsers = await tx.webPushSubscription.findMany({
    where: { userId: { in: filteredUsers.map((user) => user.id) } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const pushEnabledIds = new Set(pushUsers.map((row) => row.userId));

  const rows = filteredUsers.flatMap((user) => {
    const prefs = eligibleById.get(user.id);
    if (!prefs) return [];

    const entries: Prisma.NotificationOutboxCreateManyInput[] = [];

    if (prefs.notifyByEmail) {
      entries.push({
        userId: user.id,
        channel: "EMAIL",
        subject: input.subject,
        body: input.body,
      });
    }

    if (prefs.notifyByTelegram && user.telegramChatId) {
      entries.push({
        userId: user.id,
        channel: "TELEGRAM",
        subject: input.subject,
        body: input.body,
      });
    }

    if (prefs.notifyByWebPush && pushEnabledIds.has(user.id)) {
      entries.push({
        userId: user.id,
        channel: "WEBPUSH",
        subject: input.subject,
        body: input.body,
      });
    }

    return entries;
  });

  if (rows.length === 0) return 0;

  const result = await tx.notificationOutbox.createMany({ data: rows });

  return result.count;
}

export async function enqueueEmailForUser(
  tx: Prisma.TransactionClient,
  input: EnqueueEmailInput
) {
  const row: Prisma.NotificationOutboxCreateManyInput = {
    userId: input.userId,
    channel: "EMAIL",
    subject: input.subject,
    body: input.body,
    recipientEmail: input.recipientEmail,
    allowUnverifiedEmail: input.allowUnverifiedEmail ?? false,
  };

  const result = await tx.notificationOutbox.createMany({ data: [row] });
  return result.count;
}

