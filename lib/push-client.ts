"use client";

import { supabase } from "@/lib/supabase";

/**
 * Converts a VAPID public key (base64) to a Uint8Array for PushManager subscription.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** Check if browser supports all required APIs for Web Push. */
export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Check if this specific device already has an active push subscription. */
export async function getPushStatus(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch (e) {
    console.error("[Push] Error checking status:", e);
    return false;
  }
}

/**
 * Refactored Subscribe Flow:
 * 1. Request Browser Permissions
 * 2. Ensure Service Worker is Active
 * 3. Get/Create Subscription via PushManager
 * 4. Sync with Supabase Database
 */
export async function subscribeToPush(userId: string): Promise<void> {
  console.log("[Push] Starting subscription flow for user:", userId);

  if (!pushSupported()) {
    throw new Error("Seu navegador não suporta notificações push.");
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.error("[Push] Missing VAPID public key in environment.");
    throw new Error("Erro de configuração: Chave VAPID não encontrada.");
  }

  // 1. Request permission first
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Você precisa permitir as notificações no seu navegador.");
  }

  // 2. Ensure SW is registered and ready
  // next-pwa registers /sw.js by default.
  let reg = await navigator.serviceWorker.getRegistration();
  
  if (!reg) {
    console.log("[Push] SW not found, registering manually...");
    reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }

  // Wait for the service worker to be ready (up to 15s)
  console.log("[Push] Waiting for service worker to be ready...");
  const readyReg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => 
      setTimeout(() => reject(new Error("O Service Worker demorou muito para ativar. Recarregue a página.")), 15000)
    )
  ]);

  // 3. Get or Create Push Subscription
  let sub = await readyReg.pushManager.getSubscription();
  
  if (!sub) {
    console.log("[Push] Creating new subscription...");
    const convertedKey = urlBase64ToUint8Array(vapidKey);
    sub = await readyReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource,
    });
  }

  console.log("[Push] Subscription obtained, syncing with Supabase...");

  // 4. Store in Supabase
  const json = sub.toJSON();
  
  // Clean up any old subscription for this specific endpoint for this user
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", sub.endpoint);

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh || null,
    auth: json.keys?.auth || null,
  });

  if (error) {
    console.error("[Push] Supabase Sync Error:", error);
    throw new Error("Erro ao salvar sua inscrição no servidor.");
  }

  console.log("[Push] Subscription successful!");
}

/**
 * Unsubscribe flow:
 * 1. Get browser subscription
 * 2. Unsubscribe via PushManager
 * 3. Remove from Supabase
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      console.log("[Push] Unsubscribing from browser...");
      await sub.unsubscribe();
      
      console.log("[Push] Removing from Supabase...");
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
    }
  } catch (e) {
    console.error("[Push] Error unsubscribing:", e);
  }
}
