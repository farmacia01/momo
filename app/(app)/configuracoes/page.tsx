import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import pkg from "@/package.json";
import { ConfiguracoesClient } from "./ConfiguracoesClient";

// Reads the user's profile + notification config per request.
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const [profileResult, inviteResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, cidade, estado, dose_atual_mg, referral_code")
      .eq("id", session.user.id)
      .single(),
    supabase
      .from("referral_invites")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", session.user.id),
  ]);

  const profile = profileResult.data;
  const inviteCount = inviteResult.count ?? 0;

  return (
    <ConfiguracoesClient
      userId={session.user.id}
      email={session.user.email ?? ""}
      nome={profile?.nome ?? null}
      cidade={profile?.cidade ?? null}
      estado={profile?.estado ?? null}
      doseMg={profile?.dose_atual_mg ?? null}
      appVersion={pkg.version}
      referralCode={profile?.referral_code ?? ""}
      inviteCount={inviteCount}
    />
  );
}
