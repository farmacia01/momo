"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  StoryCard,
  TEMPLATES,
  CARD_W,
  CARD_H,
  type ShareProgressData,
  type TemplateType,
} from "./StoryCard";

// Re-export para backward compat (DashboardClient, SaudeClient importam daqui)
export type { ShareProgressData } from "./StoryCard";

// ── Constants ──────────────────────────────────────────────────────────────────

const EXPORT_SCALE = 3; // 360×3=1080  640×3=1920

// ── Helper ─────────────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  data: ShareProgressData;
}

export function ShareProgressDrawer({ open, onClose, data }: DrawerProps) {
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [scale, setScale]         = useState(1);
  const [template, setTemplate]   = useState<TemplateType>("weight");
  const [displayPeso, setDisplay] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  // open/close + counter animation
  useEffect(() => {
    if (!open) { setVisible(false); setDisplay(0); return; }
    const raf = requestAnimationFrame(() => setVisible(true));

    const target = data.pesoPerdido;
    const dur    = 1500;
    const t0     = performance.now();
    const tick   = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(rafRef.current); };
  }, [open, data.pesoPerdido]);

  // scale preview to fit container
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 320;
      setScale(Math.min(1, w / CARD_W));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const mesAno   = cap(format(new Date(), "MMMM yyyy", { locale: ptBR }));
  const mesLower = format(new Date(), "MMMM", { locale: ptBR });

  async function snapAndWait() {
    cancelAnimationFrame(rafRef.current);
    setDisplay(data.pesoPerdido);
    // Espera mais tempo p/ garantir que transform animations terminaram
    await new Promise<void>(r => setTimeout(r, 300));
  }

  async function getCanvas() {
    if (!cardRef.current) return null;
    const h2c = (await import("html2canvas")).default;
    return h2c(cardRef.current, {
      backgroundColor: null,
      scale: EXPORT_SCALE,
      useCORS: true,
      logging: false,
      // Captura exatamente o tamanho do card sem cortar
      width: CARD_W,
      height: CARD_H,
      scrollX: 0,
      scrollY: 0,
    });
  }

  function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise(r => canvas.toBlob(r, "image/png"));
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      await snapAndWait();
      const canvas = await getCanvas();
      if (!canvas) throw new Error();
      const blob = await toBlob(canvas);
      if (!blob) throw new Error();
      const file = new File([blob], `momo-conquista-${mesLower}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Minha conquista no Momo", files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href     = url;
        a.download = `momo-conquista-${mesLower}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PNG salvo! Cole no Story como figurinha 🎯");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Não foi possível compartilhar.");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes _spUp {
          from { transform: translateY(100%); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
      `}</style>

      <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: "var(--z-modal)" }}>

        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: "var(--z-overlay)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onClick={onClose}
        />

        {/* Sheet */}
        <div style={{
          position: "relative",
          width: "100%", maxWidth: 480, maxHeight: "96vh",
          display: "flex", flexDirection: "column",
          borderRadius: "32px 32px 0 0",
          overflow: "hidden",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "none",
          zIndex: "var(--z-modal)",
          animation: "_spUp 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>

          {/* Ember line */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#ff6500,rgba(255,101,0,0.35),transparent)", flexShrink: 0 }} />

          {/* Header */}
          <div style={{ flexShrink: 0, padding: "12px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Syne,sans-serif", letterSpacing: "-0.04em" }}>
                  Compartilhar conquista
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "Outfit,sans-serif" }}>
                  PNG transparente — cole como figurinha no Story
                </p>
              </div>
              <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Scrollable */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 48px" }}>

            {/* Preview — fundo gradiente para simular um "story" e visualizar o card transparente */}
            <div ref={wrapRef} style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
              <div style={{
                width:  CARD_W * scale,
                height: CARD_H * scale,
                overflow: "hidden",
                borderRadius: 22 * scale,
                background: "linear-gradient(145deg, #fdf8ef 0%, #f5ead5 50%, #fef9f0 100%)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
              }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <StoryCard
                    ref={cardRef}
                    template={template}
                    data={data}
                    displayPeso={displayPeso}
                    mesAno={mesAno}
                  />
                </div>
              </div>
            </div>

            {/* Template picker */}
            <SheetLabel>Formato</SheetLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 4, marginBottom: 24 }}>
              {TEMPLATES.map(tp => (
                <SheetPill key={tp.key} active={template === tp.key} onClick={() => setTemplate(tp.key)}>
                  {tp.emoji} {tp.label}
                </SheetPill>
              ))}
            </div>

            {/* Action */}
            <button
              onClick={handleShare}
              disabled={busy}
              style={{
                width: "100%", height: 54, borderRadius: 999,
                background: "linear-gradient(135deg,#ff6500,#cc3f00)",
                border: "none", color: "#fff",
                fontSize: 15, fontWeight: 800, fontFamily: "Outfit,sans-serif", letterSpacing: "0.04em",
                cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 8px 28px rgba(255,101,0,0.4)",
                transition: "transform 0.15s",
              }}
              onPointerDown={e => { if (!busy) e.currentTarget.style.transform = "scale(0.97)"; }}
              onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Share2 size={17} /> Compartilhar conquista
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ── Drawer UI ──────────────────────────────────────────────────────────────────

function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.26)", fontFamily: "Outfit,sans-serif" }}>
      {children}
    </p>
  );
}

function SheetPill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
        padding: "9px 14px", borderRadius: 999,
        fontSize: 12, fontWeight: 700, fontFamily: "Outfit,sans-serif",
        whiteSpace: "nowrap", cursor: "pointer",
        border: active ? "1.5px solid rgba(255,101,0,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
        background: active ? "rgba(255,101,0,0.13)" : "rgba(255,255,255,0.04)",
        color: active ? "#ff7a1a" : "rgba(255,255,255,0.36)",
        transition: "all 0.18s ease",
      }}
    >
      {children}
    </button>
  );
}

