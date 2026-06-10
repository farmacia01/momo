"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Send,
  Clock,
  CheckCircle,
  Syringe,
  Scale,
  Package,
  Salad,
  Heart,
  Activity,
  Smartphone,
  Zap,
  Info,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NOTIFICACOES, TIMING_NOTIFICACOES } from "@/lib/notificacoes-templates";

type Historico = { id: string; titulo: string; mensagem: string; segmento: string; total_enviado: number; criado_em: string };

const CATEGORIAS = [
  { key: "DOSES", label: "Doses", icon: Syringe, color: "text-blue-400" },
  { key: "PROGRESSO", label: "Progresso", icon: Scale, color: "text-purple-400" },
  { key: "ESTOQUE", label: "Estoque", icon: Package, color: "text-amber-400" },
  { key: "DIETA", label: "Dieta", icon: Salad, color: "text-green-400" },
  { key: "ENGAJAMENTO", label: "Engajamento", icon: Heart, color: "text-pink-400" },
  { key: "SAUDE", label: "Saúde", icon: Activity, color: "text-red-400" },
];

export function AdminNotificacoesClient({ historico: initialHistorico }: { historico: Historico[] }) {
  const [activeTab, setActiveTab] = useState("DOSES");
  const [historico, setHistorico] = useState(initialHistorico);
  const [sending, setSending] = useState<string | null>(null);

  async function handleDisparar(templateKey: string, category: string) {
    setSending(templateKey);
    try {
      const fullKey = `${category}.${templateKey}`;
      // Chama a nova API de broadcast para disparar para todos usando o template
      const res = await fetch("/api/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateKey,
          category: category,
          secret: "momo8878"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Disparo em massa concluído para ${data.successfullySent} usuários!`);
      
      // Adicionar ao histórico local (fictício para UI)
      const mockH: Historico = {
        id: Math.random().toString(),
        titulo: templateKey,
        mensagem: "Template Automático",
        segmento: "Todos",
        total_enviado: data.successfullySent,
        criado_em: new Date().toISOString()
      };
      setHistorico([mockH, ...historico]);
    } catch (e: any) {
      toast.error(e.message || "Erro ao disparar");
    } finally {
      setSending(null);
    }
  }

  const currentTemplates = (NOTIFICACOES as any)[activeTab];

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-[28px] font-black text-white tracking-tight leading-none">Centro de Notificações</h1>
        <p className="text-[rgba(255,255,255,0.35)] text-[14px] mt-2 font-medium">Gerencie templates e automações de push</p>
      </div>

      {/* Tabs das Categorias */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[20px] gap-1 overflow-x-auto no-scrollbar">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-[16px] text-[13px] font-bold transition-all whitespace-nowrap ${
              activeTab === cat.key 
              ? "bg-surface text-black shadow-lg" 
              : "text-white/40 hover:text-white/60 hover:bg-surface/5"
            }`}
          >
            <cat.icon size={16} className={activeTab === cat.key ? "text-text" : cat.color} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Templates */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {Object.keys(currentTemplates).map((key) => {
                const templateFn = currentTemplates[key];
                const preview = templateFn("Usuário", 5, "MJ-001"); // Mock params: (nome, número, código)
                const timing = (TIMING_NOTIFICACOES as any)[`${activeTab}.${key}`];

                return (
                  <div key={key} className="a-card p-5 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-8 w-8 rounded-lg bg-surface/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                          <Bell size={16} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            <Smartphone size={10} /> Push
                          </div>
                        </div>
                      </div>

                      {/* iPhone Style Preview */}
                      <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-white/5 shadow-inner">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#22c55e] flex items-center justify-center text-white shrink-0 shadow-lg">
                            <span className="text-[10px] font-black">M</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white leading-tight">{preview.title}</p>
                            <p className="text-[11px] text-white/50 mt-1 leading-snug line-clamp-2">{preview.body}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Descrição</p>
                      <p className="text-[11px] text-white/40 mb-4">{preview.desc || "Template de engajamento personalizado."}</p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase">
                          <Clock size={12} />
                          Horário: <span className="text-white/60">{timing?.hora ? `${timing.hora}:00` : "Dinâmico"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase">
                          <Zap size={12} />
                          Gatilho: <span className="text-white/60">{timing?.condicao || "Ação do usuário"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleDisparar(key, activeTab)}
                        disabled={!!sending}
                        className="flex-1 h-10 rounded-xl bg-surface text-black text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        {sending === key ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
                        Disparar agora
                      </button>
                      <button className="h-10 w-10 rounded-xl bg-surface/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar: Automação e Histórico */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status n8n */}
          <div className="a-card p-6 border-l-4 border-l-green-500">
            <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Motor de Automação
            </h4>
            <p className="text-[11px] text-white/30 mt-1 mb-4">Sincronizado com n8n (momo-rust-nu)</p>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface/[0.02] border border-white/[0.04]">
                <span className="text-[11px] font-bold text-white/60 uppercase">Envio Automático</span>
                <div className="h-5 w-10 bg-green-500 rounded-full relative">
                  <div className="absolute right-1 top-1 h-3 w-3 bg-surface rounded-full" />
                </div>
              </label>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/70 font-medium leading-relaxed">
                  As notificações agendadas são disparadas conforme o fuso horário (America/Sao_Paulo).
                </p>
              </div>
            </div>
          </div>

          {/* Histórico Recente */}
          <div className="a-card p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-surface/[0.01]">
               <h4 className="text-[12px] font-bold text-white/60 uppercase tracking-widest">Logs de Disparo</h4>
            </div>
            <div className="divide-y divide-white/[0.02]">
              {historico.length === 0 ? (
                <div className="p-10 text-center text-white/20 text-[11px] font-medium">Nenhum log disponível</div>
              ) : (
                historico.map((h) => (
                  <div key={h.id} className="p-4 hover:bg-surface/[0.01] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[12px] font-bold text-white truncate max-w-[150px]">{h.titulo}</p>
                      <span className="text-[10px] font-black text-green-500">{h.total_enviado} envios</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{h.segmento}</p>
                      <p className="text-[10px] text-white/20 font-mono">{format(new Date(h.criado_em), "HH:mm dd/MM")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
