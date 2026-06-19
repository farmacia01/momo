"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ShareProgressData {
  /** kg lost since start — positive number */
  pesoPerdido: number;
  semanas: number;
  imc: number;
  pesoInicial: number | null;
  pesoAtual: number | null;
  /** Average kg lost per week — positive number */
  mediaSemana: number;
  /** Weight series, oldest → newest */
  serie: number[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: ShareProgressData;
}

interface ShareOptions {
  pesoPerdido: boolean;
  semanas: boolean;
  imc: boolean;
  grafico: boolean;
  pesoAtual: boolean;
}

export function ShareProgressDrawer({ open, onClose, data }: Props) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const [opts, setOpts] = useState<ShareOptions>({
    pesoPerdido: true,
    semanas: true,
    imc: true,
    grafico: true,
    pesoAtual: false,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const w = previewWrapRef.current?.clientWidth ?? 340;
      setScale(Math.min(1, w / 400));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const pesoPerdidoStr = data.pesoPerdido.toFixed(1);
  const mediaStr = data.mediaSemana.toFixed(1);
  const imcStr = data.imc > 0 ? data.imc.toFixed(1) : "--";
  const mesAno = capitalize(format(new Date(), "MMMM yyyy", { locale: ptBR }));
  const mesLower = format(new Date(), "MMMM", { locale: ptBR }).toLowerCase();

  const whatsappText =
    `🔥 *Meu progresso com Mounjaro*\n\n` +
    `📉 Perdi *${pesoPerdidoStr}kg* em *${data.semanas} semanas*\n` +
    `⚖️ IMC atual: *${imcStr}*\n` +
    `📊 Média: *${mediaStr}kg por semana*\n\n` +
    `Acompanho tudo pelo Momo 🌿`;

  const shareText = `Já perdi ${pesoPerdidoStr}kg no meu tratamento com Mounjaro! 🔥`;

  async function renderCanvas(): Promise<HTMLCanvasElement | null> {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function handleSaveImage() {
    if (busy) return;
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      if (!canvas) throw new Error("no-canvas");
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("no-blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `momo-conquista-${mesLower}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Imagem salva! 📸");
    } catch {
      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      const blob = canvas ? await canvasToBlob(canvas) : null;
      if (blob && navigator.canShare) {
        const file = new File([blob], "momo-conquista.png", {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Minha conquista no Momo",
            text: shareText,
            files: [file],
          });
          return;
        }
      }
      await navigator.clipboard.writeText(shareText);
      toast.success("Texto copiado! Cole onde quiser 📋");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Não foi possível compartilhar.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
      "_blank",
    );
  }

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes _spDrawerUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 flex items-end justify-center"
        style={{ zIndex: "var(--z-modal)" }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(4,2,0,0.75)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: "var(--z-overlay)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 480,
            maxHeight: "94vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "28px 28px 0 0",
            overflow: "hidden",
            background: "var(--color-surface-mid)",
            zIndex: "var(--z-modal)",
            animation: "_spDrawerUp 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Top ember accent bar */}
          <div
            style={{
              height: 3,
              background:
                "linear-gradient(90deg, #ff6500, rgba(255,101,0,0.4), transparent)",
              flexShrink: 0,
            }}
          />

          {/* Handle + header */}
          <div style={{ flexShrink: 0, padding: "10px 20px 16px" }}>
            <div
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                background: "var(--color-surface-border)",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    width: 20,
                    height: 2,
                    background: "#ff6500",
                    borderRadius: 1,
                    marginBottom: 8,
                  }}
                />
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    fontFamily: "Syne, sans-serif",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  Compartilhar conquista
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-dim)",
                    fontFamily: "Outfit, sans-serif",
                    margin: "4px 0 0",
                  }}
                >
                  Mostre sua evolução para o mundo
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--color-surface-border)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-dim)",
                  flexShrink: 0,
                }}
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 20px 36px",
            }}
          >
            {/* Card preview */}
            <div
              ref={previewWrapRef}
              style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
            >
              <div
                style={{
                  width: 400 * scale,
                  height: 500 * scale,
                  overflow: "hidden",
                  borderRadius: 24,
                  boxShadow:
                    "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,101,0,0.12)",
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <ProgressCard
                    ref={cardRef}
                    data={data}
                    opts={opts}
                    pesoPerdidoStr={pesoPerdidoStr}
                    mediaStr={mediaStr}
                    imcStr={imcStr}
                    mesAno={mesAno}
                  />
                </div>
              </div>
            </div>

            {/* Personalizar section */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "var(--color-text-dim)",
                  fontFamily: "Outfit, sans-serif",
                  marginBottom: 10,
                }}
              >
                Personalizar card
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <OptionPill
                  label="Peso perdido"
                  active={opts.pesoPerdido}
                  onClick={() =>
                    setOpts((o) => ({ ...o, pesoPerdido: !o.pesoPerdido }))
                  }
                />
                <OptionPill
                  label="Semanas"
                  active={opts.semanas}
                  onClick={() =>
                    setOpts((o) => ({ ...o, semanas: !o.semanas }))
                  }
                />
                <OptionPill
                  label="IMC atual"
                  active={opts.imc}
                  onClick={() => setOpts((o) => ({ ...o, imc: !o.imc }))}
                />
                <OptionPill
                  label="Gráfico"
                  active={opts.grafico}
                  onClick={() =>
                    setOpts((o) => ({ ...o, grafico: !o.grafico }))
                  }
                />
                <OptionPill
                  label="Peso atual"
                  active={opts.pesoAtual}
                  onClick={() =>
                    setOpts((o) => ({ ...o, pesoAtual: !o.pesoAtual }))
                  }
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Primary row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={handleSaveImage}
                  disabled={busy}
                  style={{
                    height: 48,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text)",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "Outfit, sans-serif",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "transform 0.15s ease",
                  }}
                  onPointerDown={(e) => !busy && (e.currentTarget.style.transform = "scale(0.97)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Download size={15} /> Salvar
                </button>
                <button
                  onClick={handleShare}
                  disabled={busy}
                  style={{
                    height: 48,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #ff6500, #cc3f00)",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "Outfit, sans-serif",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 6px 20px rgba(255,101,0,0.35)",
                    transition: "transform 0.15s ease",
                  }}
                  onPointerDown={(e) => !busy && (e.currentTarget.style.transform = "scale(0.97)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Share2 size={15} /> Compartilhar
                </button>
              </div>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                disabled={busy}
                style={{
                  height: 48,
                  borderRadius: 999,
                  background: "#25D366",
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "Outfit, sans-serif",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(37,211,102,0.25)",
                  transition: "transform 0.15s ease",
                }}
                onPointerDown={(e) => !busy && (e.currentTarget.style.transform = "scale(0.97)")}
                onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <WhatsAppIcon /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ─── Shareable card (400×500, all inline styles for html2canvas) ─── */

interface ProgressCardProps {
  data: ShareProgressData;
  opts: ShareOptions;
  pesoPerdidoStr: string;
  mediaStr: string;
  imcStr: string;
  mesAno: string;
}

const ProgressCard = forwardRef<HTMLDivElement, ProgressCardProps>(
  function ProgressCard(
    { data, opts, pesoPerdidoStr, mediaStr, imcStr, mesAno },
    ref,
  ) {
    const cells: { label: string; value: string }[] = [];
    if (opts.semanas) cells.push({ label: "semanas", value: `${data.semanas}` });
    if (opts.imc) cells.push({ label: "IMC atual", value: imcStr });
    if (opts.pesoPerdido)
      cells.push({ label: "por semana", value: `−${mediaStr}kg` });
    if (
      opts.pesoAtual &&
      data.pesoInicial != null &&
      data.pesoAtual != null
    ) {
      cells.push({
        label: "evolução",
        value: `${Math.round(data.pesoInicial)} → ${Math.round(data.pesoAtual)}kg`,
      });
    }

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          height: 500,
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          background: "transparent",
        }}
      >
        {/* Bottom ember glow */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 520,
            height: 320,
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(255,101,0,0.35) 0%, rgba(204,60,0,0.14) 40%, transparent 68%)",
            pointerEvents: "none",
          }}
        />

        {/* Top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: -40,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle at 0% 0%, rgba(255,101,0,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Subtle noise texture (SVG) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "28px 30px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                momo
              </div>
              <div
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  marginTop: 3,
                  letterSpacing: "0.08em",
                }}
              >
                minha jornada
              </div>
            </div>
            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.04em",
              }}
            >
              {mesAno}
            </div>
          </div>

          {/* Hero metric */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {opts.pesoPerdido ? (
              <div>
                {/* Big number row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 80,
                      fontWeight: 800,
                      color: "#ff6500",
                      lineHeight: 0.88,
                      letterSpacing: "-5px",
                    }}
                  >
                    −
                  </span>
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 80,
                      fontWeight: 800,
                      color: "#ffffff",
                      lineHeight: 0.88,
                      letterSpacing: "-5px",
                      textShadow: "0 0 60px rgba(255,255,255,0.15)",
                    }}
                  >
                    {pesoPerdidoStr}
                  </span>
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "-1px",
                      marginTop: 12,
                    }}
                  >
                    kg
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.38)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  perdidos no tratamento
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.04em",
                }}
              >
                Minha evolução 💪
              </div>
            )}

            {/* Stats grid */}
            {cells.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: cells.length === 1 ? "1fr" : "1fr 1fr",
                  gap: 8,
                  marginTop: 22,
                }}
              >
                {cells.map((c) => (
                  <div
                    key={c.label}
                    style={{
                      background: "rgba(255,255,255,0.055)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "11px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#ffffff",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      {c.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "Outfit, sans-serif",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.32)",
                        marginTop: 5,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div>
            {opts.grafico && data.serie.length >= 2 && (
              <div style={{ marginBottom: 14 }}>
                <MiniChart serie={data.serie} />
              </div>
            )}

            {/* Ember divider */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(255,101,0,0.55), rgba(255,101,0,0.18), transparent)",
                marginBottom: 12,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 10,
                  color: "rgba(255,101,0,0.55)",
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                }}
              >
                momo.app
              </span>
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Mounjaro Tracker
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

/* ─── Mini SVG chart with ember colors ─── */

function MiniChart({ serie }: { serie: number[] }) {
  const W = 340;
  const H = 54;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const range = max - min || 1;
  const pts = serie.map((v, i) => {
    const x = (i / (serie.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return [x, y] as const;
  });
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="spEmberFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,101,0,0.22)" />
          <stop offset="100%" stopColor="rgba(255,101,0,0.02)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spEmberFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#ff6500"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r={3.5} fill="#ff6500" />
      )}
    </svg>
  );
}

/* ─── Option toggle pill ─── */

function OptionPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "Outfit, sans-serif",
        letterSpacing: "0.02em",
        cursor: "pointer",
        border: active
          ? "1px solid rgba(255,101,0,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "rgba(255,101,0,0.12)"
          : "rgba(255,255,255,0.04)",
        color: active ? "#ff6500" : "rgba(255,255,255,0.42)",
        transition: "all 0.18s ease",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: active ? "2px solid #ff6500" : "2px solid rgba(255,255,255,0.2)",
          background: active ? "#ff6500" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.18s ease",
        }}
      >
        {active && (
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path
              d="M1 3.5l1.8 1.8L6 1.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/* ─── WhatsApp icon ─── */

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.59 5.319l-.999 3.648 3.909-.766zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
