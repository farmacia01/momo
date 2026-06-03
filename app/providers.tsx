"use client";

import { Toaster } from "react-hot-toast";

/**
 * Client-side providers shared across the whole app (toast notifications, and
 * a good place to add context providers later).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
          },
          success: {
            iconTheme: { primary: "#16a34a", secondary: "#fff" },
          },
        }}
      />
    </>
  );
}
