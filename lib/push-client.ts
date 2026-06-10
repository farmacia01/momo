"use client";

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
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushStatus(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function subscribeToPush(userId: string): Promise<void> {
  if (!pushSupported()) {
    throw new Error("Seu navegador não suporta notificações push.");
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error("Erro de configuração: chave VAPID não encontrada.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Você precisa permitir as notificações no seu navegador.");
  }

  // navigator.serviceWorker.ready resolves once the SW is active (registered by PushRegistrar)
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
  });

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, subscription_json: JSON.stringify(sub) },
      { onConflict: "user_id" },
    );

  if (error) {
    throw new Error("Erro ao salvar sua inscrição no servidor.");
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  } catch (e) {
    console.error("[Push] Error unsubscribing:", e);
  }
}
