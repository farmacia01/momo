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
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 20 }}>
      {/* Conteúdo desfocado por baixo — sempre renderizado */}
      <div
        style={{
          filter: "blur(5px)",
          userSelect: "none",
          pointerEvents: "none",
          opacity: 0.6,
          transform: "scale(1.02)",
        }}
      >
        {children}
      </div>

      {/* Overlay clareador por cima do blur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Card de bloqueio centralizado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "20px 20px 16px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            width: "100%",
            maxWidth: 280,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#e8f5ee",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            <Lock size={18} color="#1c4d2e" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
            Seu trial expirou
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5 }}>
            {mensagem || "Assine o Momo para continuar acompanhando seu tratamento"}
          </p>
          <Link
            href="/plano"
            style={{
              display: "block",
              background: "#1c4d2e",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "11px 16px",
              borderRadius: 999,
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            Ver planos — R$ 29,90/mês
          </Link>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
            Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
