"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format, differenceInWeeks, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, X, Scale, Activity, Trophy, TrendingDown, Star, AlertCircle, Droplets, ChevronDown, ChevronUp, TrendingUp, Target, Minus, Share2 } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, LineChart, Line } from 'recharts';
import { PageHeader } from "@/components/PageHeader";
import { ShareProgressDrawer } from "@/components/ShareProgressDrawer";
import { AchievementModal, type Achievement } from "@/components/AchievementModal";
import toast from "react-hot-toast";
import { usePlano } from "@/hooks/usePlano";
import { BlurPaywall } from "@/components/BlurPaywall";

interface Medicao {
  id: string;
  data_medicao: string;
  peso_kg: number;
  imc: number;
  pressao_sistolica: number;
  pressao_diastolica: number;
  glicemia: number;
  circunferencia_abdominal_cm: number;
  humor: 'ruim' | 'regular' | 'bom' | 'otimo' | 'excelente';
  energia: number;
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

type Tab = "Peso" | "Pressão" | "Sintomas";

export function SaudeClient({ userId, profile, initialMedicoes, initialSintomas }: { 
  userId: string, 
  profile: any, 
  initialMedicoes: Medicao[], 
  initialSintomas: Sintoma[]
}) {
  const [medicoes, setMedicoes] = useState<Medicao[]>(initialMedicoes);
  const [sintomas, setSintomas] = useState<Sintoma[]>(initialSintomas);
  const [activeTab, setActiveTab] = useState<Tab>("Peso");
  
  const [showMedicaoForm, setShowMedicaoForm] = useState(false);
  const [showSintomaForm, setShowSintomaForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodoGrafico, setPeriodoGrafico] = useState<number>(30); // 30, 60, 90, 0 (all)

  // Compartilhamento de progresso + celebração de conquistas
  const [shareOpen, setShareOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<Achievement | null>(null);
  const baselineUnlocked = useRef<Set<string> | null>(null);

  // Form Medicao
  const [dataMedicao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [peso, setPeso] = useState("");
  const [pressaoSis, setPressaoSis] = useState("");
  const [pressaoDia, setPressaoDia] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [circAbdominal, setCircAbdominal] = useState("");
  const [humor, setHumor] = useState<Medicao['humor']>("bom");
  const [energia, setEnergia] = useState<number>(7);
  const [obsMedicao, setObsMedicao] = useState("");
  const [showMeasures, setShowMeasures] = useState(false);
  const [showPressure, setShowPressure] = useState(false);

  // Form Sintoma
  const [dataSintoma] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [tipoSintoma, setTipoSintoma] = useState("");
  const [intensidade, setIntensidade] = useState("5");
  const [descricaoSintoma, setDescricaoSintoma] = useState("");
  const [duracao] = useState("");

  const handleMedicaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso) {
      toast.error("O peso é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const pesoNum = parseFloat(peso);
      const alturaM = (profile?.altura_cm || 0) / 100;
      const imc = alturaM > 0 ? pesoNum / (alturaM * alturaM) : null;

      const { data, error } = await supabase.from('medicoes_saude').insert({
        user_id: userId,
        data_medicao: new Date(dataMedicao).toISOString(),
        peso_kg: pesoNum,
        imc: imc,
        pressao_sistolica: pressaoSis ? parseInt(pressaoSis) : null,
        pressao_diastolica: pressaoDia ? parseInt(pressaoDia) : null,
        glicemia: glicemia ? parseInt(glicemia) : null,
        circunferencia_abdominal_cm: circAbdominal ? parseFloat(circAbdominal) : null,
        humor: humor,
        energia: energia,
        observacoes: obsMedicao || null
      }).select().single();

      if (error) throw error;

      // Se for a primeira medição ou se o peso inicial não estiver definido
      if (medicoes.length === 0 || !profile?.peso_inicial) {
        await supabase.from('profiles').update({ peso_inicial: pesoNum }).eq('id', userId);
      }

      setMedicoes([data, ...medicoes].sort((a, b) => new Date(b.data_medicao).getTime() - new Date(a.data_medicao).getTime()));
      setShowMedicaoForm(false);
      setPeso(""); setPressaoSis(""); setPressaoDia(""); setGlicemia(""); setCircAbdominal(""); setHumor("bom"); setEnergia(7); setObsMedicao("");
      toast.success("Peso registrado! 💪");
    } catch (error) { 
      console.error(error); 
      toast.error("Erro ao salvar medição."); 
    } finally { 
      setLoading(false); 
    }
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
      toast.success("Sintoma registrado!");
    } catch (error) { console.error(error); toast.error("Erro ao salvar sintoma."); } finally { setLoading(false); }
  };

  const pesoAtual = medicoes[0]?.peso_kg;
  const pesoInicial = profile?.peso_inicial || (medicoes.length > 0 ? medicoes[medicoes.length - 1].peso_kg : null);
  const deltaPeso = pesoAtual && pesoInicial ? (pesoAtual - pesoInicial) : 0;
  
  const imcAtual = medicoes[0]?.imc || 0;
  const getClassImc = (imc: number) => {
    if (imc <= 0) return { label: "Sem dados", color: "text-dim", bg: "bg-slate-400" };
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-blue-500", bg: "bg-blue-500" };
    if (imc < 25) return { label: "Normal", color: "text-green-500", bg: "bg-green-500" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-yellow-500", bg: "bg-yellow-500" };
    return { label: "Obesidade", color: "text-red-500", bg: "bg-red-500" };
  };
  const infoImc = getClassImc(imcAtual);

  const dataInicio = profile?.data_inicio_tratamento ? new Date(profile.data_inicio_tratamento) : null;
  const semanasTratamento = dataInicio ? Math.max(1, differenceInWeeks(new Date(), dataInicio)) : 1;
  const diasTratamento = dataInicio ? differenceInDays(new Date(), dataInicio) : 0;
  const mediaSemana = deltaPeso / semanasTratamento;

  const chartDataMedicoes = useMemo(() => {
    let data = [...medicoes].filter(m => m.peso_kg).reverse();
    if (periodoGrafico > 0) {
      const limitDate = subDays(new Date(), periodoGrafico);
      data = data.filter(m => new Date(m.data_medicao) >= limitDate);
    }
    return data.map((m, index) => {
      const prevPeso = index > 0 ? data[index-1].peso_kg : null;
      const delta = prevPeso ? m.peso_kg - prevPeso : 0;
      return {
        name: format(new Date(m.data_medicao), "dd MMM", { locale: ptBR }),
        peso: m.peso_kg,
        fullDate: format(new Date(m.data_medicao), "dd 'de' MMM, yyyy", { locale: ptBR }),
        delta: delta
      };
    });
  }, [medicoes, periodoGrafico]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface p-4 rounded-[10px] shadow-premium border border-surface-border min-w-[120px]">
          <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-1">{data.fullDate}</p>
          <p className="text-lg font-black text-text">{data.peso} kg</p>
          {data.delta !== 0 && (
            <p className={`text-[10px] font-bold flex items-center gap-1 ${data.delta < 0 ? "text-green-500" : "text-red-400"}`}>
              {data.delta < 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
              {Math.abs(data.delta).toFixed(1)}kg
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasFirstWeight = medicoes.length > 0;
  const isOneMonth = diasTratamento >= 30;
  const isTenWeeks = semanasTratamento >= 10;
  const isLost5kg = deltaPeso <= -5;
  const isLost10kg = deltaPeso <= -10;
  const isImcOk = imcAtual > 0 && imcAtual < 30;

  // Catálogo de conquistas (ordem = prioridade de celebração).
  const ACHIEVEMENTS: { id: string; emoji: string; name: string; unlocked: boolean }[] = [
    { id: "lost10", emoji: "🎯", name: "10 kg perdidos", unlocked: isLost10kg },
    { id: "lost5", emoji: "🔥", name: "5 kg perdidos", unlocked: isLost5kg },
    { id: "weeks10", emoji: "⭐", name: "10 semanas de tratamento", unlocked: isTenWeeks },
    { id: "month1", emoji: "🏆", name: "1 mês de tratamento", unlocked: isOneMonth },
    { id: "imcOk", emoji: "💪", name: "IMC abaixo de 30", unlocked: isImcOk },
    { id: "first", emoji: "⚖️", name: "Primeira pesagem", unlocked: hasFirstWeight },
  ];
  const unlockedKey = ACHIEVEMENTS.filter((a) => a.unlocked).map((a) => a.id).join(",");

  // Detecta conquistas recém-desbloqueadas. A primeira renderização apenas
  // registra a linha de base (não celebra o que o usuário já tinha).
  useEffect(() => {
    const current = new Set(ACHIEVEMENTS.filter((a) => a.unlocked).map((a) => a.id));
    if (baselineUnlocked.current === null) {
      baselineUnlocked.current = current;
      return;
    }
    const novo = ACHIEVEMENTS.find((a) => a.unlocked && !baselineUnlocked.current!.has(a.id));
    baselineUnlocked.current = current;
    if (novo) setCelebrate({ emoji: novo.emoji, name: novo.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedKey]);

  // Dados para o card de compartilhamento.
  const serieCompleta = useMemo(
    () => [...medicoes].filter((m) => m.peso_kg).reverse().map((m) => m.peso_kg),
    [medicoes],
  );
  const shareData = {
    pesoPerdido: deltaPeso < 0 ? -deltaPeso : 0,
    semanas: semanasTratamento,
    imc: imcAtual,
    pesoInicial: pesoInicial ?? null,
    pesoAtual: pesoAtual ?? null,
    mediaSemana: mediaSemana < 0 ? -mediaSemana : 0,
    serie: serieCompleta,
  };

  const currentIMCRealTime = useMemo(() => {
    const p = parseFloat(peso);
    const h = (profile?.altura_cm || 0) / 100;
    if (p > 0 && h > 0) return p / (h * h);
    return 0;
  }, [peso, profile?.altura_cm]);

  const classificationBP = (sis: number, dia: number) => {
    if (!sis || !dia) return null;
    if (sis < 120 && dia < 80) return { label: "Normal", color: "bg-green-500" };
    if (sis < 130 && dia < 80) return { label: "Elevada", color: "bg-yellow-500" };
    return { label: "Hipertensão", color: "bg-red-500" };
  };
  const infoBP = classificationBP(parseInt(pressaoSis), parseInt(pressaoDia));

  const yAxisTicks = useMemo(() => {
    if (chartDataMedicoes.length === 0) return [];
    const weights = chartDataMedicoes.map(d => d.peso);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    if (min === max) return [min - 1, min, min + 1];
    return [min, (min + max) / 2, max].map(v => parseFloat(v.toFixed(1)));
  }, [chartDataMedicoes]);

  const { isExpirado } = usePlano();

  return (
    <div className="space-y-6 pb-32">
      <PageHeader
        title="Peso & Saúde"
        action={
          <button
            onClick={() => setShareOpen(true)}
            title="Compartilhar progresso"
            aria-label="Compartilhar progresso"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ember shadow-sm transition-transform active:scale-90"
          >
            <Share2 className="h-5 w-5" />
            <span className="pointer-events-none absolute right-0 top-12 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Compartilhar progresso
            </span>
          </button>
        }
      />

      <BlurPaywall ativo={isExpirado} mensagem="Acompanhe sua evolução e registre sintomas no Premium">
        <div className="flex gap-2 p-1 bg-surface-border rounded-full mb-8">
          {(["Peso", "Sintomas"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${
                activeTab === tab 
                  ? "bg-ember text-white shadow-ember scale-[1.02]" 
                  : "text-muted hover:text-text hover:bg-surface-mid"
              }`}
            >
              {tab === "Peso" ? <Scale size={14} /> : <Activity size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Peso" && (
          <div className="space-y-6 page-transition-enter">
            <button
              onClick={() => setShowMedicaoForm(true)}
              className="w-full h-[52px] bg-ember text-white rounded-full font-bold text-sm shadow-ember flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              Nova Medição
            </button>

            {/* Hero Card "Peso Atual" */}
            <div className="relative overflow-hidden bg-gradient-to-br from-ember to-ember-dim p-6 rounded-[24px] shadow-lg text-white">
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-surface/10 blur-2xl" />
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">PESO ATUAL</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[52px] font-bold tracking-[-1.5px] leading-tight">
                  {pesoAtual ? pesoAtual.toFixed(1) : "––"}
                </span>
                <span className="text-2xl font-light opacity-80">kg</span>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5">
                  {!pesoAtual ? (
                    <span className="text-xs font-medium text-white/60">Registre seu primeiro peso</span>
                  ) : deltaPeso <= 0 ? (
                    <span className="text-xs font-bold text-[#4ade80] flex items-center gap-1">
                      ↓ −{Math.abs(deltaPeso).toFixed(1)} kg desde o início
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#fca5a5] flex items-center gap-1">
                      ↑ +{Math.abs(deltaPeso).toFixed(1)} kg desde o início
                    </span>
                  )}
                </div>
                <div className="px-3 py-1 rounded-full bg-surface/15 text-[10px] font-bold uppercase tracking-wider">
                  Semana {semanasTratamento}
                </div>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface p-4 rounded-[20px] shadow-sm border border-surface-border flex flex-col items-center justify-between">
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">IMC</p>
                <p className="text-xl font-black text-text mt-1">{imcAtual ? imcAtual.toFixed(1) : "--"}</p>
                <p className={`text-[10px] font-bold mt-1 ${infoImc.color}`}>{infoImc.label}</p>
                <div className="w-full h-1 bg-surface-mid rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${infoImc.bg}`} 
                    style={{ width: imcAtual > 0 ? `${Math.min(100, Math.max(0, ((imcAtual - 15) / 20) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className="bg-surface p-4 rounded-[20px] shadow-sm border border-surface-border flex flex-col items-center">
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">PERDIDO</p>
                <p className={`text-xl font-black mt-1 ${deltaPeso <= 0 ? "text-green-500" : "text-text"}`}>
                  {deltaPeso <= 0 ? `−${Math.abs(deltaPeso).toFixed(1)}` : `+${deltaPeso.toFixed(1)}`} kg
                </p>
                <p className="text-[10px] font-bold text-muted mt-1">desde o início</p>
              </div>
              <div className="bg-surface p-4 rounded-[20px] shadow-sm border border-surface-border flex flex-col items-center">
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">MÉDIA</p>
                <p className={`text-xl font-black mt-1 ${mediaSemana <= 0 ? "text-text" : "text-red-400"}`}>
                  {mediaSemana <= 0 ? `${Math.abs(mediaSemana).toFixed(1)}` : `+${mediaSemana.toFixed(1)}`}
                </p>
                <p className="text-[10px] font-bold text-muted mt-1">kg / sem</p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-surface p-5 rounded-[24px] shadow-premium border border-surface-border">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-text">Evolução</h3>
                <div className="flex gap-1 bg-surface-mid p-1 rounded-full border border-surface-border">
                  {[
                    { label: "30d", val: 30 }, 
                    { label: "60d", val: 60 }, 
                    { label: "90d", val: 90 }, 
                    { label: "Tudo", val: 0 }
                  ].map(p => (
                    <button 
                      key={p.label}
                      onClick={() => setPeriodoGrafico(p.val)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                        periodoGrafico === p.val ? "bg-ember text-white shadow-sm" : "text-muted hover:text-text"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[220px] w-full relative">
                {chartDataMedicoes.length < 2 && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-[1px]">
                    <Scale className="text-muted mb-2" size={32} />
                    <p className="text-xs font-bold text-muted">Sem dados suficientes</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataMedicoes}>
                    <defs>
                      <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6500" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ff6500" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-surface-border)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--color-text-dim)', fontWeight: 600 }} 
                      dy={10} 
                    />
                    <YAxis 
                      domain={['dataMin - 1', 'dataMax + 1']} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--color-text-dim)', fontWeight: 600 }}
                      ticks={yAxisTicks}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {profile?.peso_meta && (
                      <ReferenceLine 
                        y={profile.peso_meta} 
                        stroke="#fbbf24" 
                        strokeDasharray="5 5" 
                        label={{ position: 'right', value: 'Meta', fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }} 
                      />
                    )}

                    <Area 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#ff6500" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorPeso)" 
                      activeDot={(props: any) => {
                        const { cx, cy, index } = props;
                        if (index === chartDataMedicoes.length - 1) {
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={7} fill="rgba(255,101,0,0.2)" />
                              <circle cx={cx} cy={cy} r={4} fill="#ff6500" stroke="var(--color-surface)" strokeWidth={2} />
                            </g>
                          );
                        }
                        return <circle cx={cx} cy={cy} r={4} fill="#ff6500" stroke="var(--color-surface)" strokeWidth={2} />;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conquistas - Scroll Horizontal */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest px-1">Conquistas</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                {/* 1ª Pesagem */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${hasFirstWeight ? "bg-amber-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${hasFirstWeight ? "bg-amber-500/20 text-amber-500" : "text-muted"}`}>
                    <Scale size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${hasFirstWeight ? "text-amber-500" : "text-muted"}`}>1ª PESAGEM</p>
                  {!hasFirstWeight && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-muted w-0" />
                    </div>
                  )}
                </div>

                {/* 5kg */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${isLost5kg ? "bg-indigo-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${isLost5kg ? "bg-indigo-500/20 text-indigo-500" : "text-muted"}`}>
                    <TrendingDown size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${isLost5kg ? "text-indigo-500" : "text-muted"}`}>5KG PERDIDOS</p>
                  {!isLost5kg && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (Math.abs(deltaPeso) / 5) * 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* 10kg */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${isLost10kg ? "bg-blue-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${isLost10kg ? "bg-blue-500/20 text-blue-500" : "text-muted"}`}>
                    <Target size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${isLost10kg ? "text-blue-500" : "text-muted"}`}>10KG PERDIDOS</p>
                  {!isLost10kg && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (Math.abs(deltaPeso) / 10) * 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* 1 Mês */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${isOneMonth ? "bg-pink-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${isOneMonth ? "bg-pink-500/20 text-pink-500" : "text-muted"}`}>
                    <Trophy size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${isOneMonth ? "text-pink-500" : "text-muted"}`}>1 MÊS</p>
                  {!isOneMonth && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-pink-500" style={{ width: `${Math.min(100, (diasTratamento / 30) * 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* 10 semanas */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${isTenWeeks ? "bg-purple-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${isTenWeeks ? "bg-purple-500/20 text-purple-500" : "text-muted"}`}>
                    <Star size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${isTenWeeks ? "text-purple-500" : "text-muted"}`}>10 SEMANAS</p>
                  {!isTenWeeks && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (semanasTratamento / 10) * 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* IMC < 30 */}
                <div className={`flex-shrink-0 w-[110px] h-[110px] rounded-[20px] p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative overflow-hidden ${isImcOk ? "bg-emerald-500/10" : "bg-surface"}`}>
                  <div className={`p-2 rounded-full ${isImcOk ? "bg-emerald-500/20 text-emerald-500" : "text-muted"}`}>
                    <Activity size={20} />
                  </div>
                  <p className={`text-[11px] font-black leading-tight ${isImcOk ? "text-emerald-500" : "text-muted"}`}>IMC &lt; 30</p>
                  {!isImcOk && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-border">
                      <div className="h-full bg-emerald-500" style={{ width: `${imcAtual > 0 ? Math.min(100, (30 / imcAtual) * 100) : 0}%` }} />
                    </div>
                  )}
                </div>
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
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-surface rounded-[24px] border border-surface-border shadow-sm active:bg-ember active:text-white transition-colors group"
                >
                  <div className="p-3 bg-surface-mid rounded-full group-active:bg-surface/20 text-ember group-active:text-white transition-colors">
                    {s.icon}
                  </div>
                  <span className="text-sm font-bold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </BlurPaywall>

      {/* Drawer Redesigned */}
      {showMedicaoForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMedicaoForm(false)} />
          <div className="relative z-[101] w-full max-w-md rounded-t-[28px] shadow-xl animate-slide-up h-[92vh] flex flex-col overflow-hidden" style={{ background: "var(--color-surface-mid)" }}>
            <div className="flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--color-surface-border)" }} />
              <div className="px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-[18px] font-bold text-text">Nova Medição</h2>
                  <p className="text-xs font-medium text-dim capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <button onClick={() => setShowMedicaoForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted" style={{ background: "var(--color-surface-border)" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 pb-24">
              {/* Grupo 1: Peso */}
              <div className="bg-surface p-5 rounded-[20px] shadow-sm flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest">PESO (KG)</p>
                <input 
                  type="number" 
                  step="0.1" 
                  value={peso} 
                  onChange={e => setPeso(e.target.value)} 
                  placeholder="00.0"
                  className="text-[42px] font-bold text-text text-center bg-transparent border-none outline-none focus:ring-0 w-full"
                />
                
                {currentIMCRealTime > 0 && (
                  <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${getClassImc(currentIMCRealTime).bg} bg-opacity-10 ${getClassImc(currentIMCRealTime).color}`}>
                    IMC: {currentIMCRealTime.toFixed(1)} · {getClassImc(currentIMCRealTime).label}
                  </div>
                )}

                <div className="flex gap-2 w-full mt-2">
                  {[-1.0, -0.5, 0.5, 1.0].map(val => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => setPeso(prev => (Math.max(0, (parseFloat(prev) || 0) + val)).toFixed(1))}
                      className="flex-1 py-2 rounded-xl bg-surface-mid text-muted text-xs font-bold active:bg-surface-border"
                    >
                      {val > 0 ? `+${val}` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grupo 2: Medidas */}
              <div className="space-y-3">
                <button 
                  onClick={() => setShowMeasures(!showMeasures)}
                  className="w-full flex items-center justify-between text-dim text-[11px] font-bold uppercase tracking-widest px-1"
                >
                  Adicionar medidas corporais
                  {showMeasures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showMeasures && (
                  <div className="bg-surface p-5 rounded-[20px] shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-xs font-bold text-muted whitespace-nowrap">Circunferência Abdominal (cm)</label>
                      <input 
                        type="number" 
                        value={circAbdominal} 
                        onChange={e => setCircAbdominal(e.target.value)} 
                        placeholder="00"
                        className="w-20 bg-surface-mid border-none rounded-xl py-2 px-3 text-right text-sm font-bold focus:ring-2 focus:ring-forest/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grupo 3: Pressão */}
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPressure(!showPressure)}
                  className="w-full flex items-center justify-between text-dim text-[11px] font-bold uppercase tracking-widest px-1"
                >
                  Adicionar pressão arterial
                  {showPressure ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showPressure && (
                  <div className="bg-surface p-5 rounded-[20px] shadow-sm animate-fade-in space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-dim uppercase tracking-wider">Sistólica</label>
                        <input 
                          type="number" 
                          value={pressaoSis} 
                          onChange={e => setPressaoSis(e.target.value)} 
                          placeholder="120"
                          className="w-full bg-surface-mid border-none rounded-xl py-3 px-4 text-center text-lg font-bold focus:ring-2 focus:ring-forest/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-dim uppercase tracking-wider">Diastólica</label>
                        <input 
                          type="number" 
                          value={pressaoDia} 
                          onChange={e => setPressaoDia(e.target.value)} 
                          placeholder="80"
                          className="w-full bg-surface-mid border-none rounded-xl py-3 px-4 text-center text-lg font-bold focus:ring-2 focus:ring-forest/20"
                        />
                      </div>
                    </div>
                    {infoBP && (
                      <div className={`w-full py-2 rounded-full text-white text-[10px] font-black uppercase text-center tracking-widest ${infoBP.color}`}>
                        {infoBP.label}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grupo 4: Humor e Energia */}
              <div className="bg-surface p-5 rounded-[20px] shadow-sm space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-dim uppercase tracking-widest">HUMOR</p>
                  <div className="flex justify-between items-center">
                    {[
                      { val: 'ruim', emoji: '😔', label: 'Ruim' },
                      { val: 'regular', emoji: '😐', label: 'Regular' },
                      { val: 'bom', emoji: '🙂', label: 'Bom' },
                      { val: 'otimo', emoji: '😊', label: 'Ótimo' },
                      { val: 'excelente', emoji: '😄', label: 'Excelente' },
                    ].map(h => (
                      <button 
                        key={h.val}
                        type="button"
                        onClick={() => setHumor(h.val as Medicao['humor'])}
                        className={`flex flex-col items-center gap-1 transition-all ${humor === h.val ? "scale-110" : "opacity-40 grayscale-[50%]"}`}
                      >
                        <span className={`text-2xl p-2 rounded-full border-2 ${humor === h.val ? "border-forest bg-ember/5" : "border-transparent"}`}>
                          {h.emoji}
                        </span>
                        <span className="text-[9px] font-bold text-muted">{h.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-dim uppercase tracking-widest">ENERGIA</p>
                    <span className="text-sm font-black text-ember">{energia} / 10</span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="1" max="10" 
                      value={energia} 
                      onChange={e => setEnergia(parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full appearance-none cursor-pointer range-slider"
                    />
                    <div className="flex justify-between mt-2 text-[9px] font-bold text-dim">
                      <span>SEM ENERGIA</span>
                      <span>COM TUDO</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grupo 5: Observações */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest px-1">OBSERVAÇÕES (OPCIONAL)</p>
                <textarea 
                  value={obsMedicao}
                  onChange={e => setObsMedicao(e.target.value)}
                  placeholder="Como foi seu dia? Algo diferente?"
                  rows={3}
                  className="w-full bg-surface border-none rounded-[20px] p-4 text-sm font-medium focus:ring-2 focus:ring-forest/20 shadow-sm"
                />
              </div>
            </div>

            <div className="flex-shrink-0 p-6 bg-surface border-t border-surface-border">
              <button 
                onClick={handleMedicaoSubmit}
                disabled={loading}
                className="w-full h-[52px] bg-ember text-white rounded-full font-bold shadow-lg shadow-forest/20 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {loading ? <LoadingSpinner size="sm" /> : "Salvar medição"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sintoma Form */}
      {showSintomaForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSintomaForm(false)} />
          <div className="relative z-[101] w-full max-w-md bg-surface rounded-t-[32px] pt-6 px-6 pb-24 shadow-xl animate-slide-up">
            <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: "var(--color-surface-border)" }} />
            <h2 className="text-xl font-bold mb-6">Registrar Sintoma</h2>
            <form onSubmit={handleSintomaSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-dim uppercase ml-1">Intensidade (1-10)</label>
                <input type="range" min="1" max="10" value={intensidade} onChange={e => setIntensidade(e.target.value)} className="w-full accent-forest mt-2" />
                <div className="flex justify-between text-[10px] text-dim font-bold px-1">
                  <span>LEVE</span><span>MODERADO</span><span>INTENSO</span>
                </div>
              </div>
              <textarea value={descricaoSintoma} onChange={e => setDescricaoSintoma(e.target.value)} className="input-standard mt-1" placeholder="Descrição (opcional)" rows={3} />
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-[#1c4d2e] text-white rounded-full font-bold text-sm shadow-lg shadow-forest/20 mt-4 active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? <LoadingSpinner size="sm" /> : "Salvar Sintoma"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Compartilhamento de progresso */}
      <ShareProgressDrawer open={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />

      {/* Celebração de conquista desbloqueada */}
      <AchievementModal
        achievement={celebrate}
        onClose={() => setCelebrate(null)}
        onShare={() => {
          setCelebrate(null);
          setShareOpen(true);
        }}
      />
    </div>
  );
}
