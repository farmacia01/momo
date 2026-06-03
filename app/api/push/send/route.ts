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
  const { userId, title, body, url } = await request.json().catch(() => ({}));

  if (!userId || !title) {
    return NextResponse.json(
      { error: "userId and title are required" },
      { status: 400 },
    );
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:no-reply@mounjaro.app";

  if (!publicKey || !privateKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Missing config — acknowledge without failing the caller's flow.
    return NextResponse.json({ ok: true, skipped: "push not configured" });
  }

  webpush.setVapidDetails(email, publicKey, privateKey);

  const supabase = createServiceClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({ title, body, url: url ?? "/" });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      ),
    ),
  );

  // Clean up subscriptions that are gone (404/410).
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
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ ok: true, sent });
}
