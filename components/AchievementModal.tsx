"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface Achievement {
  emoji: string;
  name: string;
}

interface Props {
  achievement: Achievement | null;
  onShare: () => void;
  onClose: () => void;
}

export function AchievementModal({ achievement, onShare, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!achievement) return;
    let cancelled = false;
    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      if (cancelled) return;
      const fire = (particleRatio: number, opts: Record<string, unknown>) =>
        confetti({
          origin: { y: 0.7 },
          colors: ["#ff6500", "#ff7a1a", "#ffaa66", "#ffffff", "#f59e0b"],
          particleCount: Math.floor(200 * particleRatio),
          ...opts,
        });
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    })();
    return () => { cancelled = true; };
  }, [achievement]);

  if (!mounted || !achievement) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-[131] w-full max-w-xs rounded-[28px] p-7 text-center shadow-2xl animate-fade-up"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
      >
        <div
          className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full text-[64px] leading-none"
          style={{ background: "rgba(255,101,0,0.1)", border: "1px solid rgba(255,101,0,0.2)" }}
        >
          <span>{achievement.emoji}</span>
        </div>
        <p className="text-sm font-black uppercase tracking-widest" style={{ color: "#ff6500" }}>
          Conquista desbloqueada!
        </p>
        <h3 className="mt-1 text-xl font-bold" style={{ color: "var(--color-text)" }}>{achievement.name}</h3>

        <div className="mt-6 space-y-3">
          <button
            onClick={onShare}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #ff6500, #cc4c00)", boxShadow: "0 4px 16px rgba(255,101,0,0.35)" }}
          >
            Compartilhar
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-full py-2.5 text-sm font-bold"
            style={{ color: "var(--color-text-dim)" }}
          >
            Depois
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
