"use client";

import { BottomNav } from "./BottomNav";
import { Fab } from "./Fab";

/**
 * Application shell. Mobile-first: a centered content column with an expanding
 * FAB and a floating bottom navigation pill.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto w-full max-w-md px-6 pb-32 pt-6">
        <div>
          {children}
        </div>
      </main>
      <Fab />
      <BottomNav />
    </div>
  );
}
