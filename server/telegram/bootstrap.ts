import { parseTelegramStartLinkToken } from "@/lib/telegram";
import { linkTelegramChatByToken } from "@/server/telegram/link-service";
import { getMyLessonsForTelegramChat } from "@/server/telegram/my-lessons-service";

type Logger = (message: string) => void;

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { username?: string };
  };
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result: T;
};

async function telegramApiCall<T>(token: string, method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Telegram API ${method} failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as TelegramApiResponse<T>;
  if (!payload.ok) {
    throw new Error(`Telegram API ${method} returned ok=false`);
  }

  return payload.result;
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  await telegramApiCall(token, "sendMessage", {
    chat_id: chatId,
    text,
  });
}

function parseCommand(text: string): { command: string; args: string[] } | null {
  const raw = text.trim();
  if (!raw.startsWith("/")) return null;

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const commandWithBot = parts[0].slice(1).toLowerCase();
  const command = commandWithBot.split("@")[0] ?? "";
  return {
    command,
    args: parts.slice(1),
  };
}

function formatLessonDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function handleLinkCommand(token: string, chatId: string, username: string | null, code: string | undefined) {
  if (!code) {
    await sendTelegramMessage(
      token,
      chatId,
      "Codice mancante. Usa /link <codice> dalla pagina impostazioni profilo su NekoGym."
    );
    return;
  }

  const result = await linkTelegramChatByToken({
    token: code,
    chatId,
    username,
  });

  if (result.ok) {
    await sendTelegramMessage(token, chatId, `Collegamento completato. Ciao ${result.userName}!`);
    return;
  }

  if (result.reason === "expired") {
    await sendTelegramMessage(token, chatId, "Codice scaduto. Generane uno nuovo dalle impostazioni profilo.");
    return;
  }

  if (result.reason === "in-use") {
    await sendTelegramMessage(token, chatId, "Questa chat Telegram e gia collegata a un altro utente.");
    return;
  }

  if (result.reason === "already-linked") {
    await sendTelegramMessage(token, chatId, "Chat gia collegata al tuo account.");
    return;
  }

  await sendTelegramMessage(token, chatId, "Codice non valido. Verifica e riprova.");
}

async function handleMyLessonsCommand(token: string, chatId: string) {
  const result = await getMyLessonsForTelegramChat(chatId);
  if (!result.ok) {
    await sendTelegramMessage(
      token,
      chatId,
      "Chat non collegata. Vai in NekoGym > Settings > Profilo e avvia la verifica Telegram."
    );
    return;
  }

  if (result.lessons.length === 0) {
    await sendTelegramMessage(token, chatId, `Nessuna lezione per ${result.userName} da oggi ai prossimi 7 giorni.`);
    return;
  }

  const header = `Lezioni di ${result.userName} (oggi + 7 giorni):`;
  const rows = result.lessons.map((lesson) => {
    const roleTags = [lesson.isTrainer ? "trainer" : null, lesson.isBooked ? "iscritto" : null]
      .filter(Boolean)
      .join(", ");
    const roleSuffix = roleTags ? ` [${roleTags}]` : "";
    const lessonName = lesson.courseName ?? lesson.lessonTypeName ?? "Lezione";
    const trainer = lesson.trainerName ? ` - trainer: ${lesson.trainerName}` : "";
    return `- ${formatLessonDate(lesson.startsAt)} | ${lessonName} | ${lesson.bookedCount}/${lesson.maxAttendees}${roleSuffix}${trainer}`;
  });

  await sendTelegramMessage(token, chatId, [header, ...rows].join("\n"));
}

export function startTelegramBot(log: Logger): () => void {
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!envToken) {
    log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set");
    return () => {};
  }

  const token = envToken;

  let stopped = false;
  let offset = 0;

  async function pollLoop() {
    while (!stopped) {
      try {
        const updates = await telegramApiCall<TelegramUpdate[]>(token, "getUpdates", {
          timeout: 25,
          offset,
        });

        for (const update of updates) {
          offset = Math.max(offset, update.update_id + 1);

          const text = update.message?.text;
          const chatId = update.message?.chat?.id;
          if (!text || typeof chatId !== "number") continue;

          const parsed = parseCommand(text);
          if (!parsed) continue;

          const chatIdValue = String(chatId);
          const username = update.message?.from?.username ?? null;

          if (parsed.command === "start") {
            const payloadToken = parsed.args[0] ? parseTelegramStartLinkToken(parsed.args[0]) : null;
            if (payloadToken) {
              await handleLinkCommand(token, chatIdValue, username, payloadToken);
            }
            continue;
          }

          if (parsed.command === "link") {
            await handleLinkCommand(token, chatIdValue, username, parsed.args[0]);
            continue;
          }

          if (parsed.command === "mylessons") {
            await handleMyLessonsCommand(token, chatIdValue);
          }
        }
      } catch (error) {
        log(`Telegram bot error: ${error instanceof Error ? error.message : "unknown error"}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  void pollLoop();
  log("Telegram bot polling started");

  return () => {
    stopped = true;
    log("Telegram bot stopped");
  };
}

