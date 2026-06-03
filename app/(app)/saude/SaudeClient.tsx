"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, X, Download, Scale, HeartPulse, Activity, Trophy, TrendingDown, Star, AlertCircle, Droplets, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Minus } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { PageHeader } from "@/components/PageHeader";
import toast from "react-hot-toast";

interface Medicao {
  id: string;
  data_medicao: string;
  peso_kg: number;
  imc: number;
  pressao_sistolica: number;
  pressao_diastolica: number;
  glicemia: number;
  circunferencia_abdominal_cm: number;
  humor: string;
  energia: string;
  observacoes: string;
}

interface Sintoma {
  id: string;
  data: string;
  tipo: string;
  intensidade: number;
  descricao: string;
  duracao_horas: number;
}

interface Achievements {
  lost5kg: boolean;
  tenWeeks: boolean;
  imcBelow30: boolean;
}

type Tab = "Peso" | "Pressão" | "Sintomas";

export function SaudeClient({ userId, alturaCm, initialMedicoes, initialSintomas, achievements }: { 
  userId: string, 
  alturaCm: number | null, 
  initialMedicoes: Medicao[], 
  initialSintomas: Sintoma[],
  achievements: Achievements 
}) {
  const [medicoes, setMedicoes] = useState<Medicao[]>(initialMedicoes);
  const [sintomas, setSintomas] = useState<Sintoma[]>(initialSintomas);
  const [activeTab, setActiveTab] = useState<Tab>("Peso");
  
  const [showMedicaoForm, setShowMedicaoForm] = useState(false);
  const [showSintomaForm, setShowSintomaForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodoGrafico, setPeriodoGrafico] = useState<number>(30);

  // Form Medicao
  const [dataMedicao, setDataMedicao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [peso, setPeso] = useState("");
  const [pressaoSis, setPressaoSis] = useState("");
  const [pressaoDia, setPressaoDia] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [circAbdominal, setCircAbdominal] = useState("");
  const [humor, setHumor] = useState("");
  const [energia, setEnergia] = useState("");
  const [obsMedicao, setObsMedicao] = useState("");

  // Form Sintoma
  const [dataSintoma, setDataSintoma] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [tipoSintoma, setTipoSintoma] = useState("");
  const [intensidade, setIntensidade] = useState("5");
  const [descricaoSintoma, setDescricaoSintoma] = useState("");
  const [duracao, setDuracao] = useState("");

  const handleMedicaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('medicoes_saude').insert({
        user_id: userId,
        data_medicao: new Date(dataMedicao).toISOString(),
        peso_kg: peso ? parseFloat(peso) : null,
        pressao_sistolica: pressaoSis ? parseInt(pressaoSis) : null,
        pressao_diastolica: pressaoDia ? parseInt(pressaoDia) : null,
        glicemia: glicemia ? parseInt(glicemia) : null,
        circunferencia_abdominal_cm: circAbdominal ? parseFloat(circAbdominal) : null,
        humor: humor || null,
        energia: energia || null,
        observacoes: obsMedicao || null
      }).select().single();
      if (error) throw error;
      setMedicoes([data, ...medicoes].sort((a, b) => new Date(b.data_medicao).getTime() - new Date(a.data_medicao).getTime()));
      setShowMedicaoForm(false);
      setPeso(""); setPressaoSis(""); setPressaoDia(""); setGlicemia(""); setCircAbdominal(""); setHumor(""); setEnergia(""); setObsMedicao("");
    } catch (error) { console.error(error); toast.error("Erro ao salvar medição."); } finally { setLoading(false); }
  };

  const handleSintomaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('sintomas').insert({
        user_id: userId,
        data: new Date(dataSintoma).toISOString(),
        tipo: tipoSintoma,
        intensidade: parseInt(intensidade),
        descricao: descricaoSintoma || null,
        duracao_horas: duracao ? parseInt(duracao) : null
      }).select().single();
      if (error) throw error;
      setSintomas([data, ...sintomas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
      setShowSintomaForm(false);
    } catch (error) { console.error(error); toast.error("Erro ao salvar sintoma."); } finally { setLoading(false); }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Tipo Registro,Data,Peso(kg),IMC,Pressao Sistolica,Pressao Diastolica,Glicemia,Circunferencia(cm),Humor,Energia,Tipo Sintoma,Intensidade,Duracao(h),Observacoes\n";
    medicoes.forEach(m => {
      csvContent += ["Medição", format(new Date(m.data_medicao), "dd/MM/yyyy HH:mm"), m.peso_kg || "", m.imc || "", m.pressao_sistolica || "", m.pressao_diastolica || "", m.glicemia || "", m.circunferencia_abdominal_cm || "", m.humor || "", m.energia || "", "", "", "", `"${m.observacoes || ""}"`].join(",") + "\n";
    });
    sintomas.forEach(s => {
      csvContent += ["Sintoma", format(new Date(s.data), "dd/MM/yyyy HH:mm"), "", "", "", "", "", "", "", "", s.tipo || "", s.intensidade || "", s.duracao_horas || "", `"${s.descricao || ""}"`].join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mounjaro_dados_saude_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartDataMedicoes = [...medicoes].reverse().map(m => ({
    name: format(new Date(m.data_medicao), "dd/MM"),
    peso: m.peso_kg,
    pressaoSis: m.pressao_sistolica,
    pressaoDia: m.pressao_diastolica
  }));

  const pesoAtual = medicoes[0]?.peso_kg;
  const pesoAnterior = medicoes[1]?.peso_kg;
  const deltaPeso = pesoAtual && pesoAnterior ? (pesoAtual - pesoAnterior).toFixed(1) : null;

  return (
    <div className="space-y-6 pb-32">
      <PageHeader 
        title="Peso & Saúde" 
        action={<button onClick={exportCSV} className="text-slate-400"><Download className="h-5 w-5" /></button>}
      />

      <div className="flex gap-2 p-1 bg-slate-100 rounded-full">
        {(["Peso", "Pressão", "Sintomas"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === tab ? "bg-forest text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Peso" && (
        <div className="space-y-6 page-transition-enter">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peso Atual</p>
            <div className="flex items-end justify-center gap-1 mt-2">
              <span className="text-5xl font-black text-slate-900">{pesoAtual || "--"}</span>
              <span className="text-lg font-bold text-slate-400 mb-1.5">kg</span>
            </div>
            {deltaPeso && (
              <div className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                parseFloat(deltaPeso) < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {parseFloat(deltaPeso) < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {deltaPeso}kg desde a última pesagem
              </div>
            )}
          </div>

          {/* Conquistas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { ok: achievements.lost5kg, icon: <TrendingDown size={20} />, label: "5kg perdidos" },
              { ok: achievements.tenWeeks, icon: <Trophy size={20} />, label: "10+ semanas" },
              { ok: achievements.imcBelow30, icon: <CheckCircle2 size={20} />, label: "IMC < 30" },
            ].map((a) => (
              <div
                key={a.label}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] border text-center transition-colors ${
                  a.ok ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-white border-slate-50 text-slate-300"
                }`}
              >
                {a.icon}
                <span className={`text-[10px] font-bold leading-tight ${a.ok ? "text-amber-700" : "text-slate-400"}`}>{a.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50">
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDataMedicoes.filter(d => d.peso)}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d8653" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2d8653" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="peso" stroke="#2d8653" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <button 
            onClick={() => setShowMedicaoForm(true)}
            className="fixed bottom-24 left-5 right-5 z-40 bg-forest text-white py-4 rounded-2xl font-bold shadow-lg shadow-forest/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Scale size={20} />
            Pesar agora
          </button>
        </div>
      )}

      {activeTab === "Pressão" && (
        <div className="space-y-6 page-transition-enter">
           <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Evolução da Pressão</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartDataMedicoes.filter(d => d.pressaoSis)}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                   <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} hide />
                   <Tooltip />
                   <Line type="monotone" dataKey="pressaoSis" stroke="#ef4444" strokeWidth={3} dot={false} />
                   <Line type="monotone" dataKey="pressaoDia" stroke="#3b82f6" strokeWidth={3} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      )}

      {activeTab === "Sintomas" && (
        <div className="space-y-6 page-transition-enter">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "nausea", label: "Náusea", icon: <Droplets size={20} /> },
              { id: "fadiga", label: "Fadiga", icon: <Activity size={20} /> },
              { id: "dor_cabeca", label: "Cefaleia", icon: <AlertCircle size={20} /> },
              { id: "constipacao", label: "Constipação", icon: <Minus size={20} /> },
              { id: "tontura", label: "Tontura", icon: <Activity size={20} /> },
              { id: "insonia", label: "Insônia", icon: <Star size={20} /> }
            ].map(s => (
              <button 
                key={s.id}
                onClick={() => { setTipoSintoma(s.id); setShowSintomaForm(true); }}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[24px] border border-slate-50 shadow-sm active:bg-forest active:text-white transition-colors group"
              >
                <div className="p-3 bg-slate-50 rounded-full group-active:bg-white/20 text-forest group-active:text-white transition-colors">
                  {s.icon}
                </div>
                <span className="text-sm font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(showMedicaoForm || showSintomaForm) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowMedicaoForm(false); setShowSintomaForm(false); }} />
          <div className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-xl animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-6">{showMedicaoForm ? "Nova Medição" : "Registrar Sintoma"}</h2>
            
            {showMedicaoForm ? (
              <form onSubmit={handleMedicaoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase ml-1">Peso (kg)</label>
                     <input type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} className="input-standard mt-1" placeholder="00.0" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase ml-1">Glicemia</label>
                     <input type="number" value={glicemia} onChange={e => setGlicemia(e.target.value)} className="input-standard mt-1" placeholder="mg/dL" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase ml-1">Sistólica</label>
                     <input type="number" value={pressaoSis} onChange={e => setPressaoSis(e.target.value)} className="input-standard mt-1" placeholder="120" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase ml-1">Diastólica</label>
                     <input type="number" value={pressaoDia} onChange={e => setPressaoDia(e.target.value)} className="input-standard mt-1" placeholder="80" />
                   </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
                  {loading ? <LoadingSpinner size="sm" /> : "Salvar Medição"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSintomaSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Intensidade (1-10)</label>
                  <input type="range" min="1" max="10" value={intensidade} onChange={e => setIntensidade(e.target.value)} className="w-full accent-forest mt-2" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>LEVE</span><span>MODERADO</span><span>INTENSO</span>
                  </div>
                </div>
                <textarea value={descricaoSintoma} onChange={e => setDescricaoSintoma(e.target.value)} className="input-standard mt-1" placeholder="Descrição (opcional)" rows={3} />
                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
                  {loading ? <LoadingSpinner size="sm" /> : "Salvar Sintoma"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
