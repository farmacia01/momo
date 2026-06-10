import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/push/send
 * Body: { userId, title, body, url? }
 *
 * Sends a web-push notification to every registered device of `userId`.
 * Uses the service-role client to read push_subscriptions across users.
 * No-ops gracefully when VAPID / service env vars aren't configured.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, title, body: msgBody, url, tag } = body;
    const finalBody = msgBody ?? "";

    console.log(`[PushSend] Attempting to send to ${userId}: ${title}`);

    if (!userId || !title) {
      return NextResponse.json({ error: "userId and title are required" }, { status: 400 });
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "mailto:no-reply@momo.app";

    if (!publicKey || !privateKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("[PushSend] Configuration missing, skipping push");
      return NextResponse.json({ ok: true, skipped: "push not configured" });
    }

    webpush.setVapidDetails(vapidEmail, publicKey, privateKey);

    const supabase = createServiceClient();
    console.log("[PushSend] Service client created, fetching subscriptions...");
    
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription_json")
      .eq("user_id", userId);

    if (error) {
      console.error("[PushSend] Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!subs || subs.length === 0) {
      console.log("[PushSend] No subscriptions found for user");
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const payload = JSON.stringify({ 
      title, 
      body: finalBody, 
      url: url ?? "/" 
    });

    console.log(`[PushSend] Recording in-app notification for ${userId}`);
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      body: finalBody,
      url: url ?? "/",
      tag: tag ?? null,
      read: false,
    });

    console.log(`[PushSend] Sending to ${subs.length} endpoints...`);
    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          JSON.parse(s.subscription_json),
          payload,
        ),
      ),
    );

    const stale: string[] = [];
    results.forEach((r, i) => {
      if (
        r.status === "rejected" &&
        [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0)
      ) {
        stale.push(subs[i].id);
      }
    });
    
    if (stale.length > 0) {
      console.log(`[PushSend] Cleaning up ${stale.length} stale subscriptions`);
      await supabase.from("push_subscriptions").delete().in("id", stale);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[PushSend] Success: ${sent} notifications delivered`);
    return NextResponse.json({ ok: true, sent });

  } catch (err: any) {
    console.error("[PushSend] Global Exception:", err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
