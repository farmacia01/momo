"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Image as ImageIcon, AlertTriangle, CheckCircle2, MapPin, Calendar as CalendarIcon, Clock, X, Droplet } from "lucide-react";
import { DoseIndicator } from "@/components/DoseIndicator";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";

interface Dose {
  id: string;
  data_aplicacao: string;
  dose_mg: number;
  lado_corpo: string;
  local_aplicacao: string;
  observacoes: string;
  foto_url: string | null;
}

export function DosesClient({ userId, initialDoses, currentDoseMg }: { userId: string, initialDoses: Dose[], currentDoseMg: number }) {
  const [doses, setDoses] = useState<Dose[]>(initialDoses);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [dataAplicacao, setDataAplicacao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [doseMg, setDoseMg] = useState(currentDoseMg.toString());
  const [localAplicacao, setLocalAplicacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const lastDose = doses.length > 0 ? doses[0] : null;
  const nextDoseDate = lastDose ? addDays(new Date(lastDose.data_aplicacao), 7) : new Date();
  const daysToNextDose = differenceInDays(nextDoseDate, new Date());
  
  const nextDoseLabel = daysToNextDose <= 0 
    ? "Hoje" 
    : daysToNextDose === 1 
      ? "Amanhã" 
      : `Em ${daysToNextDose} dias`;
  
  const nextDoseDay = format(nextDoseDate, "eeee", { locale: ptBR });

  const suggestedLocation = () => {
    if (!lastDose) return "abdômen esquerdo";
    const isLeft = lastDose.lado_corpo === 'esquerdo';
    const isAbdomen = lastDose.local_aplicacao?.toLowerCase().includes('abdômen');
    if (isAbdomen) return isLeft ? "abdômen direito" : "abdômen esquerdo";
    return isLeft ? "coxa direita" : "coxa esquerda";
  };

  const handleOpenForm = () => {
    if (!localAplicacao) {
      setLocalAplicacao(suggestedLocation());
    }
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFotoFile(e.target.files[0]);
    }
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
      if (localAplicacao.includes('esquerdo')) lado_corpo = 'esquerdo';
      if (localAplicacao.includes('direito')) lado_corpo = 'direito';

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
      setDataAplicacao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Erro ao registrar dose.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minhas Doses" 
        action={
          <button 
            onClick={handleOpenForm}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white shadow-sm transition-transform active:scale-90"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* Hero Card */}
      <div className="bg-forest rounded-[24px] p-6 text-white shadow-lg shadow-forest/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[12px] font-medium opacity-80 uppercase tracking-wider">Próxima dose</p>
          <h2 className="text-[20px] font-bold mt-1">
            {nextDoseLabel} · <span className="capitalize">{nextDoseDay}</span>
          </h2>
          <button 
            onClick={handleOpenForm}
            className="mt-5 bg-white text-forest px-6 py-2.5 rounded-full text-sm font-bold transition-transform active:scale-95"
          >
            Registrar agora
          </button>
        </div>
        <div className="absolute top-[-20px] right-[-20px] opacity-10">
          <Droplet size={120} />
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Nova Aplicação</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={dataAplicacao}
                  onChange={(e) => setDataAplicacao(e.target.value)}
                  className="input-standard mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Dose (mg)</label>
                <select
                  required
                  value={doseMg}
                  onChange={(e) => setDoseMg(e.target.value)}
                  className="input-standard mt-1"
                >
                  {[2.5, 5, 7.5, 10, 12.5, 15].map(v => (
                    <option key={v} value={v}>{v} mg</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Local da Aplicação</label>
                <select
                  required
                  value={localAplicacao}
                  onChange={(e) => setLocalAplicacao(e.target.value)}
                  className="input-standard mt-1"
                >
                  <option value="">Selecione o local</option>
                  <option value="abdômen esquerdo">Abdômen esquerdo</option>
                  <option value="abdômen direito">Abdômen direito</option>
                  <option value="coxa esquerda">Coxa esquerda</option>
                  <option value="coxa direita">Coxa direita</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Foto (Opcional)</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost flex-1 py-3 text-xs"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {fotoFile ? "Trocar" : "Escolher"}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Observações</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Como foi a aplicação?"
                className="input-standard mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-4 text-base"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Histórico */}
      <div className="space-y-4 relative">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Histórico</h3>
        
        {doses.length === 0 ? (
          <EmptyState icon={<Droplet />} title="Nenhuma dose" description="Comece registrando sua primeira dose." />
        ) : (
          <div className="space-y-4 relative pb-10">
            {/* Timeline Line */}
            <div className="absolute left-[22px] top-8 bottom-8 w-[2px] bg-slate-100" />
            
            {doses.map((dose) => (
              <div key={dose.id} className="relative flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50 transition-all active:scale-[0.98]">
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <Droplet className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {format(new Date(dose.data_aplicacao), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {dose.dose_mg}mg · <span className="capitalize">{dose.local_aplicacao}</span>
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">
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
    </div>
  );
}
