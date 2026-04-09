import { prisma } from "@/lib/prisma";

type LinkResult =
  | { ok: true; userName: string }
  | { ok: false; reason: "invalid" | "expired" | "already-linked" | "in-use" };

export async function linkTelegramChatByToken(input: {
  token: string;
  chatId: string;
  username: string | null;
}): Promise<LinkResult> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const linkToken = await tx.telegramLinkToken.findUnique({
      where: { token: input.token },
      include: { user: true },
    });

    if (!linkToken || linkToken.consumedAt) {
      return { ok: false, reason: "invalid" };
    }

    if (linkToken.expiresAt <= now) {
      await tx.telegramLinkToken.update({
        where: { id: linkToken.id },
        data: { consumedAt: now },
      });
      return { ok: false, reason: "expired" };
    }

    const existingChatOwner = await tx.user.findFirst({
      where: {
        telegramChatId: input.chatId,
        id: { not: linkToken.userId },
      },
      select: { id: true },
    });

    if (existingChatOwner) {
      return { ok: false, reason: "in-use" };
    }

    if (linkToken.user.telegramChatId === input.chatId) {
      await tx.telegramLinkToken.update({
        where: { id: linkToken.id },
        data: { consumedAt: now },
      });
      return { ok: false, reason: "already-linked" };
    }

    await tx.user.update({
      where: { id: linkToken.userId },
      data: {
        telegramChatId: input.chatId,
        telegramUsername: input.username,
        telegramLinkedAt: now,
      },
    });

    await tx.telegramLinkToken.updateMany({
      where: {
        userId: linkToken.userId,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    return { ok: true, userName: linkToken.user.name };
  });
}

