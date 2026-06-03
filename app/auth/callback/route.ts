import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";

/**
 * OAuth callback. Supabase redirects here with a `code` query param after a
 * successful provider login (e.g. Google). We exchange it for a session
 * cookie, then send the user to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createRouteClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — bounce back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
