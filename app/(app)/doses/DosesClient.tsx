"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Image as ImageIcon, AlertTriangle, X, Droplet } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import { getTextoProximaDose, type CalculoDose } from "@/lib/utils/dose";
import { usePlano } from "@/hooks/usePlano";
import { BlurPaywall } from "@/components/BlurPaywall";
import { useTheme } from "@/app/providers";

interface Dose {
  id: string;
  data_aplicacao: string;
  dose_mg: number;
  lado_corpo: string;
  local_aplicacao: string;
  observacoes: string;
  foto_url: string | null;
}

export function DosesClient({
  userId,
  initialDoses,
  currentDoseMg,
  calculoDose
}: {
  userId: string,
  initialDoses: Dose[],
  currentDoseMg: number,
  calculoDose: CalculoDose
}) {
  const [doses, setDoses] = useState<Dose[]>(initialDoses);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dataAplicacao, setDataAplicacao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [doseMg, setDoseMg] = useState(currentDoseMg.toString());
  const [localAplicacao, setLocalAplicacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textosDose = getTextoProximaDose(calculoDose);

  const lastDose = doses.length > 0 ? doses[0] : null;
  const suggestedLocation = () => {
    if (!lastDose) return "abdômen esquerdo";
    const isLeft = lastDose.lado_corpo === 'esquerdo';
    const isAbdomen = lastDose.local_aplicacao?.toLowerCase().includes('abdômen');
    if (isAbdomen) return isLeft ? "abdômen direito" : "abdômen esquerdo";
    return isLeft ? "coxa direita" : "coxa esquerda";
  };

  const handleOpenForm = () => {
    if (!localAplicacao) setLocalAplicacao(suggestedLocation());
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFotoFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let foto_url = null;
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('doses').upload(fileName, fotoFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('doses').getPublicUrl(fileName);
        foto_url = publicUrl;
      }

      let lado_corpo = 'abdomen';
      if (localAplicacao.includes('esquerdo') || localAplicacao.includes('esquerda')) lado_corpo = 'esquerdo';
      if (localAplicacao.includes('direito') || localAplicacao.includes('direita')) lado_corpo = 'direito';

      const { data: newDose, error: insertError } = await supabase
        .from('doses')
        .insert({
          user_id: userId,
          data_aplicacao: new Date(dataAplicacao).toISOString(),
          dose_mg: parseFloat(doseMg),
          lado_corpo,
          local_aplicacao: localAplicacao,
          observacoes,
          foto_url
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.from('profiles').update({ dose_atual_mg: parseFloat(doseMg) }).eq('id', userId);

      setDoses([newDose, ...doses].sort((a, b) => new Date(b.data_aplicacao).getTime() - new Date(a.data_aplicacao).getTime()));
      setShowForm(false);
      setFotoFile(null);
      setObservacoes("");
      setLocalAplicacao("");
      setDataAplicacao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Erro ao registrar dose.");
    } finally {
      setLoading(false);
    }
  };

  const { isExpirado } = usePlano();

  // Theme-aware hero card
  const heroBg = calculoDose.isAtrasado
    ? { background: "linear-gradient(135deg, #7f1d1d, #ef4444)", boxShadow: "0 8px 24px rgba(239,68,68,0.25)" }
    : isDark
      ? { background: "linear-gradient(135deg, #1a0800, #2d1200)", border: "1px solid rgba(255,101,0,0.25)", boxShadow: "0 8px 24px rgba(255,101,0,0.15)" }
      : { background: "linear-gradient(135deg, #fff4ed, #ffe8cc)", border: "1px solid rgba(255,101,0,0.2)", boxShadow: "0 8px 24px rgba(255,101,0,0.08)" };

  const heroText = (calculoDose.isAtrasado || isDark) ? "#ffffff" : "var(--color-text)";
  const heroSubText = (calculoDose.isAtrasado || isDark) ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.45)";

  return (
    <div className="space-y-6 pb-32">
      <PageHeader
        title="Minhas Doses"
        action={
          <button
            onClick={handleOpenForm}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-90"
            style={{ background: "#ff6500", boxShadow: "0 4px 12px rgba(255,101,0,0.35)" }}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <BlurPaywall ativo={isExpirado} mensagem="Registre suas aplicações no plano Premium">
        {calculoDose.isAtrasado && (
          <div
            className="p-4 rounded-2xl flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Atenção!</p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Sua última dose foi há {calculoDose.diasAtraso + 7} dias. O recomendado é aplicar a cada 7 dias para manter a eficácia do tratamento.
              </p>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={heroBg}
        >
          <div className="relative z-10">
            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: heroSubText }}>
              {calculoDose.isAtrasado ? 'Dose Atrasada' : 'Próxima dose'}
            </p>
            <h2 className="text-[24px] font-bold mt-1" style={{ color: heroText }}>
              {textosDose.principal} · <span className="capitalize">{format(calculoDose.data, "eeee", { locale: ptBR })}</span>
            </h2>
            <p className="text-[13px] mt-1" style={{ color: heroSubText }}>{calculoDose.dataFormatada}</p>

            <button
              onClick={handleOpenForm}
              className="mt-5 px-6 py-2.5 rounded-full text-sm font-bold transition-transform active:scale-95"
              style={{ background: "#ff6500", color: "#fff", boxShadow: "0 4px 12px rgba(255,101,0,0.4)" }}
            >
              Registrar agora
            </button>
          </div>
          <div className="absolute top-[-20px] right-[-20px] opacity-10" style={{ color: heroText }}>
            <Droplet size={120} />
          </div>
        </div>

        {showForm && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Nova Aplicação</h2>
              <button
                onClick={() => setShowForm(false)}
                className="transition-opacity hover:opacity-60"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: "var(--color-text-muted)" }}>Data e Hora</label>
                  <input type="datetime-local" required value={dataAplicacao} onChange={(e) => setDataAplicacao(e.target.value)} className="input-standard mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: "var(--color-text-muted)" }}>Dose (mg)</label>
                  <select required value={doseMg} onChange={(e) => setDoseMg(e.target.value)} className="input-standard mt-1">
                    {[2.5, 5, 7.5, 10, 12.5, 15].map(v => <option key={v} value={v}>{v} mg</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: "var(--color-text-muted)" }}>Local da Aplicação</label>
                  <select required value={localAplicacao} onChange={(e) => setLocalAplicacao(e.target.value)} className="input-standard mt-1">
                    <option value="">Selecione o local</option>
                    <option value="abdômen esquerdo">Abdômen esquerdo</option>
                    <option value="abdômen direito">Abdômen direito</option>
                    <option value="coxa esquerda">Coxa esquerda</option>
                    <option value="coxa direita">Coxa direita</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: "var(--color-text-muted)" }}>Foto (Opcional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost flex-1 py-3 text-xs">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {fotoFile ? "Trocar" : "Escolher"}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase ml-1" style={{ color: "var(--color-text-muted)" }}>Observações</label>
                <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Como foi a aplicação?" className="input-standard mt-1" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-base">
                  {loading ? <LoadingSpinner size="sm" /> : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Histórico */}
        <div className="space-y-4 relative">
          <h3 className="text-sm font-bold uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Histórico</h3>

          {doses.length === 0 ? (
            <EmptyState icon={<Droplet />} title="Nenhuma dose" description="Comece registrando sua primeira dose." />
          ) : (
            <div className="space-y-3 relative pb-10">
              <div
                className="absolute left-[22px] top-8 bottom-8 w-[2px]"
                style={{ background: "var(--color-surface-border)" }}
              />

              {doses.map((dose) => (
                <div
                  key={dose.id}
                  className="relative flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
                >
                  <div
                    className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(255,101,0,0.12)", color: "#ff6500" }}
                  >
                    <Droplet className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                      {format(new Date(dose.data_aplicacao), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      {dose.dose_mg}mg · <span className="capitalize">{dose.local_aplicacao}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>
                      {differenceInDays(new Date(), new Date(dose.data_aplicacao)) === 0
                        ? "hoje"
                        : `há ${differenceInDays(new Date(), new Date(dose.data_aplicacao))} dias`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BlurPaywall>
    </div>
  );
}
