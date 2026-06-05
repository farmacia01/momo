"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import { BottomNav } from "./BottomNav";
import { Fab } from "./Fab";
import { FabVisibilityProvider, useFabVisibility } from "./FabVisibilityContext";
import { TrialBanner } from "./TrialBanner";
import { PageTransition } from "./PageTransition";
import { AppHeader } from "./AppHeader"; // Import new header
import { usePlano } from "@/hooks/usePlano";


function AppShellContent({ children }: { children: React.ReactNode }) {
  const { fabHidden } = useFabVisibility();
  const { isExpirado } = usePlano();
  const pathname = usePathname();
  
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  const userId = session?.user?.id;

  return (
    <div 
        className="app-container relative mx-auto w-full max-w-[430px] h-dvh overflow-hidden flex flex-col bg-background"
        style={{
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
        }}
    >
      {userId && <AppHeader userId={userId} />}
      
      <main className="w-full flex-1 overflow-y-auto">
        <TrialBanner />
        <div className="p-4" style={{ paddingBottom: '160px' }}>
          <PageTransition key={pathname}>{children}</PageTransition>
        </div>
      </main>

      {!fabHidden && <Fab />}
      <BottomNav />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FabVisibilityProvider>
      <AppShellContent>{children}</AppShellContent>
    </FabVisibilityProvider>
  );
}
