"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

interface BlurPaywallProps {
  children: React.ReactNode;
  ativo: boolean; // true = aplicar blur
  mensagem?: string;
}

export function BlurPaywall({ children, ativo, mensagem }: BlurPaywallProps) {
  if (!ativo) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {/* Conteúdo com blur */}
      <div
        style={{
          filter: "blur(6px)",
          userSelect: "none",
          pointerEvents: "none",
          opacity: 0.7,
          animation: "blurPulse 3s ease-in-out infinite",
        }}
      >
        {children}
      </div>

      {/* Overlay com CTA */}
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
        {/* Card central */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "20px 24px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            maxWidth: 260,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "#e8f5ee",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Lock size={20} color="#1c4d2e" />
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111",
              margin: "0 0 6px",
            }}
          >
            Seu trial expirou
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              margin: "0 0 16px",
              lineHeight: 1.5,
            }}
          >
            {mensagem ||
              "Assine o Momo para continuar acompanhando seu tratamento"}
          </p>

          <Link
            href="/plano"
            style={{
              display: "block",
              background: "#1c4d2e",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            Ver planos — R$ 29,90/mês
          </Link>
          <p
            style={{
              fontSize: 11,
              color: "#9ca3af",
              margin: "8px 0 0",
            }}
          >
            Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
