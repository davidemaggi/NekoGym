import webpush from "web-push";

let configured = false;

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getWebPushPublicKey(): string {
  return getEnv("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY");
}

function ensureConfigured() {
  if (configured) return;

  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || "mailto:admin@nekogym.local";
  const publicKey = getWebPushPublicKey();
  const privateKey = getEnv("WEB_PUSH_VAPID_PRIVATE_KEY");

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendWebPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
    })
  );
}

