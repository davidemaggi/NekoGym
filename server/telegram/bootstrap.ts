type Logger = (message: string) => void;

export function startTelegramBot(log: Logger): () => void {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set");
    return () => {};
  }

  // Placeholder bootstrap: keep initialization point centralized for future bot wiring.
  log("Telegram bot bootstrap initialized");

  return () => {
    log("Telegram bot stopped");
  };
}

