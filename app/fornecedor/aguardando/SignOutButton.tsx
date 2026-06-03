"use client";

import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-transform active:scale-95"
    >
      <LogOut size={16} />
      Sair
    </button>
  );
}
