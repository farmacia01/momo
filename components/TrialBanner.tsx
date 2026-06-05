"use client";

import { usePlano } from "@/hooks/usePlano";

/**
 * Thin banner shown at the top of the app while the user is on a trial
 * (or right after it expired). Turns amber when ≤ 2 days are left and red
 * once access has expired. Hidden for premium users.
 */
export function TrialBanner() {
  const { isTrial, diasRestantesTrial, isExpirado, loading } = usePlano();

  if (loading) return null;
  if (!isTrial && !isExpirado) return null;

  const urgente = diasRestantesTrial <= 2;

  return (
    <div
      style={{
        position: isExpirado ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: isExpirado ? "#ef4444" : urgente ? "#f59e0b" : "#1c4d2e",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
        {isExpirado
          ? "🔒 Seu trial expirou. Assine para continuar."
          : urgente
            ? `⚠️ Trial expira em ${diasRestantesTrial} dia(s)!`
            : `🌿 Trial gratuito — ${diasRestantesTrial} dias restantes`}
      </span>
      <a
        href="/plano"
        style={{
          background: "#fff",
          color: isExpirado ? "#ef4444" : "#1c4d2e",
          fontSize: 12,
          fontWeight: 800,
          padding: "6px 14px",
          borderRadius: 999,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {isExpirado ? "Assinar agora" : "Ver planos"}
      </a>
    </div>
  );
}
