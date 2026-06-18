import { logEvent } from "./analytics.functions";

const SESSION_KEY = "alphastack:session";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function sessionId(): string {
  if (typeof window === "undefined") return uuid();
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Fire-and-forget; never block the UI.
  void logEvent({ data: { event, sessionId: sessionId(), props } }).catch(() => {});
}

export function newClientToken(): string {
  return uuid();
}