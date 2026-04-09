type SmtpEnvConfig = {
  host: string;
  port: number;
  authEnabled: boolean;
  user: string;
  fromEmail: string;
  hasPassword: boolean;
};

type TelegramEnvConfig = {
  botUsername: string;
  hasBotToken: boolean;
};

function parseSmtpPort(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) return 587;
  return parsed;
}

export function getSmtpEnvConfig(): SmtpEnvConfig {
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const authEnabled = (process.env.SMTP_AUTH_ENABLED?.trim() || "false") === "true";
  const user = process.env.SMTP_USER?.trim() || "";
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || "";
  const hasPassword = Boolean(process.env.SMTP_PASSWORD?.trim());

  return {
    host,
    port,
    authEnabled,
    user,
    fromEmail,
    hasPassword,
  };
}

export function getTelegramEnvConfig(): TelegramEnvConfig {
  const botUsernameRaw = process.env.TELEGRAM_BOT_USERNAME?.trim() || "";
  const botUsername = botUsernameRaw.startsWith("@") ? botUsernameRaw.slice(1) : botUsernameRaw;

  return {
    botUsername,
    hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
  };
}

