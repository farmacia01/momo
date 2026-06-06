"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, Star, Package, Phone, Mail, ExternalLink, Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Produto = { id: string; tipo_produto: string; dose_mg: number; preco: number; preco_promocional: number | null; estoque_disponivel: number; ativo: boolean };
type Fornecedor = {
  id: string; nome_fantasia: string | null; razao_social: string; cnpj: string;
  email_contato: string; telefone: string | null; whatsapp: string | null;
  tipo: string; endereco_cidade: string | null; endereco_estado: string | null;
  raio_entrega_km: number | null; status: string; avaliacao_media: number | null;
  total_pedidos: number | null; created_at: string; fornecedor_produtos: Produto[];
};

const TIPO_LABEL: Record<string, string> = { farmacia: "Farmácia", distribuidor: "Distribuidor", fabricante: "Fabricante" };
const TIPO_PRODUTO_LABEL: Record<string, string> = { ampola_avulsa: "Ampola avulsa", caixa: "Caixa" };
const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const TABS = [
  { key: "todos", label: "Todos" }, { key: "pendente", label: "Pendentes" },
  { key: "ativo", label: "Ativos" }, { key: "suspenso", label: "Suspensos" },
];

export function AdminFornecedoresClient({ fornecedores: initial }: { fornecedores: Fornecedor[] }) {
  const [fornecedores, setFornecedores] = useState(initial);
  const [tab, setTab] = useState("pendente");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; nome: string } | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const filtered = tab === "todos" ? fornecedores : fornecedores.filter((f) => f.status === tab);
  const pendingCount = fornecedores.filter((f) => f.status === "pendente").length;

  async function handleAction(id: string, action: string, motivo?: string) {
    setLoading(id + action);
    try {
      const res = await fetch(`/api/admin/fornecedores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setFornecedores((prev) => prev.map((f) => f.id === id ? { ...f, status: data.novoStatus } : f));
      const msgs: Record<string, string> = { aprovar: "Fornecedor aprovado!", rejeitar: "Fornecedor reprovado", suspender: "Fornecedor suspenso", reativar: "Fornecedor reativado" };
      toast.success(msgs[action] || "Ação realizada");
    } catch (e: any) {
      toast.error(e.message || "Erro ao executar ação");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-white tracking-tight">Fornecedores</h1>
          <p className="text-[rgba(255,255,255,0.35)] text-[13px] mt-0.5">{fornecedores.length} cadastrados</p>
        </div>
        {pendingCount > 0 && <span className="a-badge-red text-[12px] py-1 px-3">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const count = t.key === "todos" ? fornecedores.length : fornecedores.filter((f) => f.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`a-tab ${tab === t.key ? "active" : ""} flex items-center gap-1.5`}>
              {t.label}
              {count > 0 && (
                <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 leading-none"
                  style={{ background: t.key === "pendente" && count > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)", color: t.key === "pendente" && count > 0 ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 a-card">
            <Building2 size={32} className="mx-auto mb-3 text-[rgba(255,255,255,0.15)]" />
            <p className="text-[rgba(255,255,255,0.25)] text-[13px]">Nenhum fornecedor nesta categoria</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {filtered.map((f, i) => {
            const nome = f.nome_fantasia || f.razao_social;
            const produtosAtivos = f.fornecedor_produtos.filter((p) => p.ativo);
            const doses = Array.from(new Set(f.fornecedor_produtos.map((p) => `${p.dose_mg}mg`))).join(", ");
            const isLoading = loading?.startsWith(f.id);
            const statusBadge = f.status === "ativo" ? "a-badge-green" : f.status === "pendente" ? "a-badge-yellow" : f.status === "suspenso" ? "a-badge-red" : "a-badge-gray";
            const statusLabel = { ativo: "ATIVO", pendente: "PENDENTE", suspenso: "SUSPENSO", reprovado: "REPROVADO" }[f.status] || f.status.toUpperCase();

            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.04 }} className="a-card-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[16px] font-bold text-white">{nome}</h3>
                      <span className={statusBadge}>{statusLabel}</span>
                    </div>
                    <p className="text-[11px] text-[rgba(255,255,255,0.28)] mt-0.5">Cadastrado em {format(new Date(f.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
                  <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)]"><Building2 size={12} />{TIPO_LABEL[f.tipo] || f.tipo}</div>
                  {(f.endereco_cidade || f.endereco_estado) && <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)]"><MapPin size={12} />{[f.endereco_cidade, f.endereco_estado].filter(Boolean).join(", ")}</div>}
                  {f.raio_entrega_km && <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)]"><MapPin size={12} />Raio {f.raio_entrega_km}km</div>}
                </div>

                <div className="flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)]"><Package size={12} />{produtosAtivos.length} produto{produtosAtivos.length !== 1 ? "s" : ""}</span>
                  {doses && <span className="text-[rgba(255,255,255,0.35)]">{doses}</span>}
                </div>

                {(f.avaliacao_media || f.total_pedidos) && (
                  <div className="flex items-center gap-4 text-[12px]">
                    {f.avaliacao_media && <span className="flex items-center gap-1 text-[#fbbf24]"><Star size={11} fill="#fbbf24" />{f.avaliacao_media.toFixed(1)}</span>}
                    {f.total_pedidos !== null && <span className="text-[rgba(255,255,255,0.35)]">{f.total_pedidos} pedidos</span>}
                  </div>
                )}

                {f.status === "pendente" && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-3">
                    <p className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-wider">Dados para análise</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
                      <div className="bg-[rgba(255,255,255,0.03)] rounded-xl px-3 py-2">
                        <p className="text-[rgba(255,255,255,0.3)] text-[10px] font-bold uppercase mb-1">CNPJ</p>
                        <a href={`https://www.receita.fazenda.gov.br/pessoajuridica/cnpj/cnpjreva/cnpjrevafrm.asp?cnpj=${f.cnpj.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] flex items-center gap-1 hover:underline font-mono">
                          {f.cnpj} <ExternalLink size={10} />
                        </a>
                      </div>
                      <div className="bg-[rgba(255,255,255,0.03)] rounded-xl px-3 py-2">
                        <p className="text-[rgba(255,255,255,0.3)] text-[10px] font-bold uppercase mb-1">Contato</p>
                        <div className="flex gap-3">
                          <a href={`mailto:${f.email_contato}`} className="text-[#60a5fa] flex items-center gap-1 hover:underline"><Mail size={10} /> Email</a>
                          {(f.telefone || f.whatsapp) && <a href={`tel:${f.whatsapp || f.telefone}`} className="text-[#4ade80] flex items-center gap-1 hover:underline"><Phone size={10} /> Tel</a>}
                        </div>
                      </div>
                    </div>
                    {f.fornecedor_produtos.length > 0 && (
                      <div className="bg-[rgba(255,255,255,0.03)] rounded-xl px-3 py-3">
                        <p className="text-[rgba(255,255,255,0.3)] text-[10px] font-bold uppercase mb-2">Produtos cadastrados</p>
                        <div className="space-y-1.5">
                          {f.fornecedor_produtos.slice(0, 4).map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-[12px]">
                              <span className="text-[rgba(255,255,255,0.55)]">{TIPO_PRODUTO_LABEL[p.tipo_produto] || p.tipo_produto} · {p.dose_mg}mg</span>
                              <span className="text-white font-semibold">{formatBRL(p.preco_promocional || p.preco)}</span>
                            </div>
                          ))}
                          {f.fornecedor_produtos.length > 4 && <p className="text-[rgba(255,255,255,0.25)] text-[11px]">+{f.fornecedor_produtos.length - 4} mais...</p>}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => handleAction(f.id, "aprovar")} disabled={!!isLoading} className="a-btn-green flex items-center gap-2 flex-1 justify-center">
                        <Check size={14} />{isLoading ? "Aprovando..." : "Aprovar fornecedor"}
                      </button>
                      <button onClick={() => setRejectModal({ id: f.id, nome })} disabled={!!isLoading} className="a-btn-red flex items-center gap-2 flex-1 justify-center">
                        <X size={14} />Reprovar
                      </button>
                    </div>
                  </div>
                )}

                {f.status === "ativo" && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <button onClick={() => handleAction(f.id, "suspender")} disabled={!!isLoading} className="a-btn-red flex items-center gap-2 text-[12px] py-2">
                      <AlertTriangle size={13} />{isLoading ? "Suspendendo..." : "Suspender fornecedor"}
                    </button>
                  </div>
                )}

                {(f.status === "suspenso" || f.status === "reprovado") && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <button onClick={() => handleAction(f.id, "reativar")} disabled={!!isLoading} className="a-btn-green flex items-center gap-2 text-[12px] py-2">
                      <RefreshCw size={13} />{isLoading ? "Reativando..." : "Reativar fornecedor"}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-[rgba(0,0,0,0.7)]" onClick={() => setRejectModal(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="a-card-lg p-6 w-full max-w-md space-y-4">
              <div>
                <h3 className="text-[17px] font-bold text-white">Reprovar {rejectModal.nome}</h3>
                <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-0.5">Informe o motivo da reprovação.</p>
              </div>
              <textarea value={rejectMotivo} onChange={(e) => setRejectMotivo(e.target.value)} placeholder="Ex: CNPJ inválido, documentação incompleta..." className="a-input resize-none h-28" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="a-btn-ghost flex-1">Cancelar</button>
                <button onClick={async () => { if (!rejectMotivo.trim()) return; await handleAction(rejectModal.id, "rejeitar", rejectMotivo); setRejectModal(null); setRejectMotivo(""); }} disabled={!rejectMotivo.trim()} className="a-btn-red flex-1">Confirmar reprovação</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
