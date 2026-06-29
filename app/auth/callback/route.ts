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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("dose_atual_mg, data_inicio_tratamento")
          .eq("id", user.id)
          .maybeSingle();
        const isUnconfigured = !profile?.dose_atual_mg && !profile?.data_inicio_tratamento;
        if (isUnconfigured) {
          return NextResponse.redirect(`${origin}/configuracoes/tratamento`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — bounce back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
