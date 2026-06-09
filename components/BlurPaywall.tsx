"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

interface BlurPaywallProps {
  children: React.ReactNode;
  ativo: boolean;
  mensagem?: string;
}

export function BlurPaywall({ children, ativo, mensagem }: BlurPaywallProps) {
  if (!ativo) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(6px)", userSelect: "none", pointerEvents: "none", opacity: 0.5 }}>
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: 20,
            padding: "20px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-float)",
            maxWidth: 260,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "rgba(255,101,0,0.12)",
              border: "1px solid rgba(255,101,0,0.2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Lock size={20} color="#ff6500" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>
            Seu trial expirou
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {mensagem || "Assine o Momo para continuar acompanhando seu tratamento"}
          </p>
          <Link
            href="/plano"
            style={{
              display: "block",
              background: "linear-gradient(135deg, #ff6500, #cc4c00)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(255,101,0,0.35)",
            }}
          >
            Ver planos — R$ 29,90/mês
          </Link>
          <p style={{ fontSize: 11, color: "var(--color-text-dim)", margin: "8px 0 0" }}>
            Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
