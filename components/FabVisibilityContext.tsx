"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type FabVisibilityContextValue = {
  fabHidden: boolean;
  setFabHidden: (hidden: boolean) => void;
};

const FabVisibilityContext = createContext<FabVisibilityContextValue | null>(null);

export function FabVisibilityProvider({ children }: { children: ReactNode }) {
  const [fabHidden, setFabHidden] = useState(false);

  return (
    <FabVisibilityContext.Provider value={{ fabHidden, setFabHidden }}>
      {children}
    </FabVisibilityContext.Provider>
  );
}

export function useFabVisibility() {
  const context = useContext(FabVisibilityContext);

  if (!context) {
    throw new Error("useFabVisibility must be used within a FabVisibilityProvider");
  }

  return context;
}
