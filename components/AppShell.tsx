"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Fab } from "./Fab";
import { FabVisibilityProvider, useFabVisibility } from "./FabVisibilityContext";
import { TrialBanner } from "./TrialBanner";
import { usePlano } from "@/hooks/usePlano";
import { PageTransition } from "./PageTransition";

/**
 * Application shell. Mobile-first: a centered content column with an expanding
 * FAB and a floating bottom navigation pill.
 */
function AppShellContent({ children }: { children: React.ReactNode }) {
  const { fabHidden } = useFabVisibility();
  const { isExpirado } = usePlano();
  const pathname = usePathname();

  return (
    <div className="app-container min-h-screen bg-bg">
      {/* Trial / acesso expirado: aparece acima de todo o conteúdo. */}
      <TrialBanner />
      <main 
        className="mx-auto w-full max-w-md px-6 pb-32 pt-6"
        style={{ paddingTop: isExpirado ? 'calc(44px + 1.5rem)' : '1.5rem' }}
      >
        <PageTransition key={pathname}>{children}</PageTransition>
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
