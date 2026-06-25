"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, differenceInMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Bell, ShoppingCart, Calculator, AlertTriangle, ExternalLink, Calendar as CalendarIcon, Tag, Share2, Save, X, PackageOpen, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PageHeader } from "@/components/PageHeader";

interface Compra {
  id: string;
  dose_mg: number;
  quantidade: number;
  data_compra: string;
  data_validade: string;
  preco_unitario: number;
  farmacia: string;
  lote: string;
  observacoes: string;
}

interface Alerta {
  id: string;
  quantidade_minima: number;
  dias_antecedencia_notificacao: number;
  ativo: boolean;
}

export function EstoqueClient({ userId, initialAmpolas, initialAlerta, profile, ampolasUsadas }: {
  userId: string;
  initialAmpolas: Compra[];
  initialAlerta: Alerta | null;
  profile: any;
  ampolasUsadas: number;
}) {
  const [compras, setCompras] = useState<Compra[]>(initialAmpolas);
  const [alerta, setAlerta] = useState<Alerta | null>(initialAlerta);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [doseMg, setDoseMg] = useState(profile?.dose_atual_mg?.toString() || "2.5");
  const [quantidade, setQuantidade] = useState("4");
  const [dataCompra, setDataCompra] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataValidade, setDataValidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [farmacia, setFarmacia] = useState("");

  const totalPurchased = compras.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
  const ampolasDisponiveis = Math.max(0, totalPurchased - ampolasUsadas);
  const qtdMinima = alerta?.quantidade_minima || 2;

  const statusColor = ampolasDisponiveis < qtdMinima ? "text-red-500" : ampolasDisponiveis < (qtdMinima + 2) ? "text-amber-500" : "text-ember";
  const heroBg = ampolasDisponiveis < qtdMinima
    ? "rgba(239,68,68,0.08)"
    : ampolasDisponiveis < (qtdMinima + 2)
      ? "rgba(245,158,11,0.06)"
      : "var(--color-surface)";

  const handleCompraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('estoque_ampolas').insert({
        user_id: userId,
        dose_mg: parseFloat(doseMg),
        quantidade: parseInt(quantidade),
        data_compra: dataCompra,
        data_validade: dataValidade || null,
        preco_unitario: precoUnitario ? parseFloat(precoUnitario.replace(',', '.')) : null,
        farmacia
      }).select().single();
      if (error) throw error;
      setCompras([data, ...compras].sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime()));
      setShowForm(false);
    } catch (err: any) { alert(err.message || "Erro."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 pb-32">
      <PageHeader 
        title="Meu Estoque" 
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ember text-white shadow-lg active:scale-90 transition-transform">
              <Plus size={20} />
            </button>
          </div>
        }
      />

      {/* Hero Card */}
      <div className="p-8 rounded-[24px] shadow-premium text-center transition-colors" style={{ background: heroBg }}>
        <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-2">Disponíveis</p>
        <h2 className={`text-7xl font-black tracking-tighter ${statusColor}`}>{ampolasDisponiveis}</h2>
        <p className="text-sm font-bold text-muted mt-4">Suficiente para <span className="text-text">{ampolasDisponiveis * 7} dias</span></p>
        
        {ampolasDisponiveis < qtdMinima && (
          <div className="mt-6 flex items-center justify-center gap-2 text-red-500 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={14} /> Estoque crítico
          </div>
        )}
      </div>

      {/* Histórico Simplificado (Horizontal ou Compacto) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold text-dim uppercase tracking-widest">Últimas Compras</h3>
          <button className="text-[10px] font-bold text-ember uppercase tracking-widest">Ver tudo</button>
        </div>
        {compras.length === 0 ? (
          <EmptyState icon={<PackageOpen />} title="Sem compras" description="Registre sua primeira compra." />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
            {compras.slice(0, 5).map(c => (
              <div key={c.id} className="min-w-[180px] bg-surface p-4 rounded-[20px] shadow-premium border border-surface-border">
                <p className="text-[13px] font-bold text-text">{c.quantidade} ampolas · {c.dose_mg}mg</p>
                <p className="text-[10px] text-dim font-medium mt-0.5">{format(new Date(c.data_compra), "dd/MM/yy")}</p>
                <div className="mt-3 pt-3 border-t border-surface-border flex justify-between items-baseline">
                  <p className="text-[10px] text-dim">Total</p>
                  <p className="text-xs font-black text-ember">R$ {(c.quantidade * (c.preco_unitario || 0)).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-t-[32px] pt-8 px-8 pb-24 shadow-2xl animate-slide-up z-[101]">
            <div className="w-12 h-1.5 bg-surface-border rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-bold text-text mb-8">Nova Compra</h2>
            <form onSubmit={handleCompraSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-dim uppercase ml-1">Qtd Ampolas</label>
                  <input type="number" required value={quantidade} onChange={e => setQuantidade(e.target.value)} className="input-standard mt-1.5" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dim uppercase ml-1">Dose (mg)</label>
                  <select value={doseMg} onChange={e => setDoseMg(e.target.value)} className="input-standard mt-1.5">
                    <option value="2.5">2.5mg</option>
                    <option value="5">5mg</option>
                    <option value="7.5">7.5mg</option>
                    <option value="10">10mg</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-dim uppercase ml-1">Preço Unitário</label>
                <input type="text" value={precoUnitario} onChange={e => setPrecoUnitario(e.target.value)} className="input-standard mt-1.5" placeholder="R$ 0,00" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-dim uppercase ml-1">Farmácia</label>
                <input type="text" value={farmacia} onChange={e => setFarmacia(e.target.value)} className="input-standard mt-1.5" placeholder="Nome da rede" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold mt-4">
                {loading ? <LoadingSpinner size="sm" /> : "Salvar Compra"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-surface rounded-[24px] shadow-premium text-center border-none">
      <div className="text-dim mb-4">{icon}</div>
      <h4 className="text-sm font-bold text-text">{title}</h4>
      <p className="text-xs text-muted mt-1">{description}</p>
    </div>
  );
}
