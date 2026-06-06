"use client";

/**
 * Client-side Web Push enrollment. Registers the device with the browser's
 * push service and stores the subscription in `push_subscriptions` so the
 * server (/api/push/send) can deliver notifications to it later.
 *
 * Note: the service worker is disabled in development (see next.config.js),
 * so enrollment only works in a production build / deployed PWA.
 */

import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Whether this device currently has an active push subscription. */
export async function getPushStatus(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

/** Request permission, subscribe, and persist the subscription. */
export async function subscribeToPush(userId: string): Promise<void> {
  if (!pushSupported()) throw new Error("Notificações não são suportadas neste navegador.");

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) throw new Error("Chave VAPID pública não configurada.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificação negada.");

  // Se não há SW registrado, tenta registrar manualmente como fallback.
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!existing) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch {
      throw new Error("Recarregue a página e tente ativar novamente.");
    }
  }

  // Aguarda SW ativo com timeout de 15s para não travar indefinidamente.
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Recarregue a página e tente ativar novamente.")),
        15000
      )
    ),
  ]);

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
    });
  }

  const json = sub.toJSON();
  // Sem constraint única em endpoint: removemos qualquer registro antigo do
  // mesmo endpoint (RLS limita às linhas do próprio usuário) e inserimos novo.
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? null,
    auth: json.keys?.auth ?? null,
  });
  if (error) throw error;
}

/** Unsubscribe this device and remove its stored subscription. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}
