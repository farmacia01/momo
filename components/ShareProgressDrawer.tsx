"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ShareProgressData {
  /** Magnitude (kg) lost since the start — positive number. */
  pesoPerdido: number;
  semanas: number;
  imc: number;
  pesoInicial: number | null;
  pesoAtual: number | null;
  /** Average kg lost per week — positive number. */
  mediaSemana: number;
  /** Weight series, oldest → newest, for the mini chart. */
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

const WHATSAPP_GREEN = "#25D366";

export function ShareProgressDrawer({ open, onClose, data }: Props) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const [opts, setOpts] = useState<ShareOptions>({
    pesoPerdido: true,
    semanas: true,
    imc: true,
    grafico: true,
    pesoAtual: false, // oculto por padrão — privacidade
  });

  useEffect(() => setMounted(true), []);

  // Scale the fixed 400px card down to fit the drawer width.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const w = previewWrapRef.current?.clientWidth ?? 360;
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
    `🌿 *Meu progresso com Mounjaro*\n\n` +
    `📉 Perdi *${pesoPerdidoStr}kg* em *${data.semanas} semanas*\n` +
    `⚖️ IMC atual: *${imcStr}*\n` +
    `📊 Média: *${mediaStr}kg por semana*\n\n` +
    `Acompanho tudo pelo Momo 💚`;

  const shareText = `Já perdi ${pesoPerdidoStr}kg no meu tratamento com Mounjaro! 💪`;

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
      a.download = `momo-progresso-${mesLower}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Imagem salva na galeria! 📸");
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
        const file = new File([blob], "momo-progresso.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Meu progresso no Momo",
            text: shareText,
            files: [file],
          });
          return;
        }
      }

      // Desktop / sem suporte a compartilhar arquivos: copiar texto.
      await navigator.clipboard.writeText(shareText);
      toast.success("Link copiado! Cole no WhatsApp, Instagram ou onde quiser 📋");
    } catch (err: any) {
      // AbortError = usuário cancelou o share nativo; não é erro.
      if (err?.name !== "AbortError") {
        toast.error("Não foi possível compartilhar.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[121] flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[#f2f2f7] shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex-shrink-0 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          <div className="flex items-start justify-between px-6 pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-text">Compartilhar progresso</h2>
              <p className="text-xs font-medium text-dim">
                Mostre sua jornada para quem importa
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-muted"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4 pb-8">
          {/* Preview do card (escalado) */}
          <div ref={previewWrapRef} className="flex justify-center">
            <div
              style={{ width: 400 * scale, height: 500 * scale }}
              className="overflow-hidden rounded-[24px]"
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
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

          {/* Seleção do que mostrar */}
          <div>
            <p className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-dim">
              O que mostrar
            </p>
            <div className="flex flex-wrap gap-2">
              <OptionPill label="Peso perdido total" active={opts.pesoPerdido} onClick={() => setOpts((o) => ({ ...o, pesoPerdido: !o.pesoPerdido }))} />
              <OptionPill label="Semanas de tratamento" active={opts.semanas} onClick={() => setOpts((o) => ({ ...o, semanas: !o.semanas }))} />
              <OptionPill label="IMC atual" active={opts.imc} onClick={() => setOpts((o) => ({ ...o, imc: !o.imc }))} />
              <OptionPill label="Gráfico de evolução" active={opts.grafico} onClick={() => setOpts((o) => ({ ...o, grafico: !o.grafico }))} />
              <OptionPill label="Peso atual" active={opts.pesoAtual} onClick={() => setOpts((o) => ({ ...o, pesoAtual: !o.pesoAtual }))} />
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveImage}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-full bg-surface py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Download size={18} /> Salvar imagem
              </button>
              <button
                onClick={handleShare}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-full bg-ember py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Share2 size={18} /> Compartilhar
              </button>
            </div>
            <button
              onClick={handleWhatsApp}
              disabled={busy}
              style={{ backgroundColor: WHATSAPP_GREEN }}
              className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <WhatsAppIcon /> Compartilhar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- The shareable card (400×500) ---------- */

interface ProgressCardProps {
  data: ShareProgressData;
  opts: ShareOptions;
  pesoPerdidoStr: string;
  mediaStr: string;
  imcStr: string;
  mesAno: string;
}

const ProgressCard = forwardRef<HTMLDivElement, ProgressCardProps>(
  function ProgressCard({ data, opts, pesoPerdidoStr, mediaStr, imcStr, mesAno }, ref) {
    const cells = useMemo(() => {
      const list: { label: string; value: string }[] = [];
      if (opts.semanas) list.push({ label: "Tratamento", value: `${data.semanas} sem` });
      if (opts.imc) list.push({ label: "IMC atual", value: imcStr });
      if (opts.pesoAtual && data.pesoInicial != null && data.pesoAtual != null) {
        list.push({
          label: "Evolução",
          value: `${Math.round(data.pesoInicial)}kg → ${Math.round(data.pesoAtual)}kg`,
        });
      }
      if (opts.pesoPerdido) list.push({ label: "Por semana", value: `−${mediaStr}kg/sem` });
      return list;
    }, [opts, data, imcStr, mediaStr]);

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          height: 500,
          background: "linear-gradient(160deg, #1c4d2e 0%, #2d7a4f 60%, #3a9460 100%)",
          borderRadius: 24,
          padding: 32,
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#fff",
        }}
      >
        {/* Watermark pill */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          🌿 Mounjaro Tracker
        </div>

        {/* Topo */}
        <div>
          <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700 }}>Momo</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            Minha jornada com Mounjaro
          </div>
        </div>

        {/* Centro — métrica principal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {opts.pesoPerdido ? (
            <>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: -2,
                  lineHeight: 1,
                  color: "#fff",
                }}
              >
                −{pesoPerdidoStr}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginTop: 4 }}>
                kg perdidos
              </div>
            </>
          ) : (
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
              Minha evolução 💪
            </div>
          )}

          {/* Grid 2×2 */}
          {cells.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 24,
              }}
            >
              {cells.map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div>
          {opts.grafico && data.serie.length >= 2 && (
            <div style={{ marginBottom: 12 }}>
              <MiniChart serie={data.serie} />
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
              momo-rust-nu.vercel.app
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{mesAno}</span>
          </div>
        </div>
      </div>
    );
  },
);

/* ---------- Mini line chart (SVG) ---------- */

function MiniChart({ serie }: { serie: number[] }) {
  const W = 336;
  const H = 60;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const range = max - min || 1;
  const pts = serie.map((v, i) => {
    const x = (i / (serie.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return [x, y] as const;
  });
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={areaPath} fill="rgba(255,255,255,0.1)" />
      <path d={linePath} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Small UI bits ---------- */

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
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
        active
          ? "bg-ember text-white shadow-sm"
          : "bg-surface text-muted shadow-sm"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          active ? "border-white bg-surface/20" : "border-slate-300"
        }`}
      >
        {active && <Check size={11} strokeWidth={3.5} />}
      </span>
      {label}
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.59 5.319l-.999 3.648 3.909-.766zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
