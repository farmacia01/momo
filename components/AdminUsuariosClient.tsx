"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, MoreVertical, ChevronRight, Crown, RotateCcw, Shield, ShieldOff, Store, User as UserIcon } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Usuario = {
  id: string; nome: string | null; email: string; plano_ativo: string | null;
  trial_expira_em: string | null; assinatura_expira_em: string | null;
  created_at: string; ultima_dose: string | null;
  is_fornecedor: boolean;
};

const FILTROS = [
  { key: "todos", label: "Todos" }, 
  { key: "pacientes", label: "Pacientes" },
  { key: "fornecedores", label: "Fornecedores" },
  { key: "premium", label: "Premium" },
  { key: "trial", label: "Trial" }, 
  { key: "expirado", label: "Expirado" }, 
  { key: "bloqueado", label: "Bloqueado" },
];

function isExpired(u: Usuario) {
  if (u.plano_ativo === "premium") return !!u.assinatura_expira_em && new Date(u.assinatura_expira_em) < new Date();
  if (u.plano_ativo === "trial") return !!u.trial_expira_em && new Date(u.trial_expira_em) < new Date();
  return false;
}

function planoBadge(u: Usuario) {
  if (u.plano_ativo === "bloqueado") return { label: "BLOQUEADO", cls: "a-badge-red" };
  if (isExpired(u)) return { label: "EXPIRADO", cls: "a-badge-gray" };
  if (u.plano_ativo === "premium") return { label: "PREMIUM", cls: "a-badge-green" };
  if (u.plano_ativo === "trial") return { label: "TRIAL", cls: "a-badge-yellow" };
  return { label: u.plano_ativo?.toUpperCase() || "–", cls: "a-badge-gray" };
}

function iniciais(nome: string | null) {
  if (!nome) return "?";
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AdminUsuariosClient({ usuarios: initial }: { usuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState(initial);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = usuarios.filter((u) => {
    const matchSearch = !search || (u.nome || "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    
    if (filtro === "pacientes") return !u.is_fornecedor;
    if (filtro === "fornecedores") return u.is_fornecedor;
    if (filtro === "premium") return u.plano_ativo === "premium" && !isExpired(u);
    if (filtro === "trial") return u.plano_ativo === "trial" && !isExpired(u);
    if (filtro === "expirado") return isExpired(u);
    if (filtro === "bloqueado") return u.plano_ativo === "bloqueado";
    return true;
  });

  async function handleAction(id: string, action: string) {
    setLoading(id + action);
    setActionMenu(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error((await res.json()).error);
      const updates: Record<string, Partial<Usuario>> = { dar_premium: { plano_ativo: "premium" }, resetar_trial: { plano_ativo: "trial" }, bloquear: { plano_ativo: "bloqueado" }, desbloquear: { plano_ativo: "trial" } };
      const msgs: Record<string, string> = { dar_premium: "Premium concedido por 30 dias", resetar_trial: "Trial resetado por 7 dias", bloquear: "Usuário bloqueado", desbloquear: "Usuário desbloqueado" };
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, ...(updates[action] || {}) } : u));
      toast.success(msgs[action] || "Ação realizada");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6" onClick={() => setActionMenu(null)}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[24px] font-black text-white tracking-tight">Usuários & Fornecedores</h1>
          <p className="text-[rgba(255,255,255,0.35)] text-[13px] mt-0.5">{usuarios.length} registros no total</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
             <p className="text-[10px] font-bold text-forest uppercase tracking-widest">Pacientes</p>
             <p className="text-lg font-black text-white">{usuarios.filter(u => !u.is_fornecedor).length}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Fornecedores</p>
             <p className="text-lg font-black text-white">{usuarios.filter(u => u.is_fornecedor).length}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="a-input pl-10" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => <button key={f.key} onClick={() => setFiltro(f.key)} className={`a-tab ${filtro === f.key ? "active" : ""}`}>{f.label}</button>)}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 a-card">
            <Users size={32} className="mx-auto mb-3 text-[rgba(255,255,255,0.12)]" />
            <p className="text-[rgba(255,255,255,0.25)] text-[13px]">Nenhum registro encontrado</p>
          </div>
        )}

        {filtered.map((u, i) => {
          const badge = planoBadge(u);
          const isMenuOpen = actionMenu === u.id;
          const isLoading = loading?.startsWith(u.id);

          return (
            <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="a-card px-4 py-3 flex items-center gap-3 group hover:border-[rgba(255,255,255,0.15)] transition-all">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${u.is_fornecedor ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-forest/10 border-forest/20 text-forest'}`}>
                {u.is_fornecedor ? <Store size={16} /> : <UserIcon size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-white truncate">{u.nome || "Sem nome"}</p>
                  {u.is_fornecedor && <span className="text-[8px] font-black bg-blue-500 text-white px-1 rounded leading-tight tracking-widest uppercase">FORNECEDOR</span>}
                  <span className={badge.cls}>{badge.label}</span>
                </div>
                <p className="text-[11px] text-[rgba(255,255,255,0.35)] truncate">{u.email}</p>
              </div>
              <div className="hidden md:block text-right shrink-0">
                <p className="text-[11px] text-[rgba(255,255,255,0.3)]">{format(new Date(u.created_at), "dd/MM/yyyy")}</p>
                {!u.is_fornecedor && u.ultima_dose && <p className="text-[10px] text-[rgba(255,255,255,0.2)]">Dose: {formatDistanceToNow(new Date(u.ultima_dose), { locale: ptBR, addSuffix: true })}</p>}
              </div>
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setActionMenu(isMenuOpen ? null : u.id)} className="h-8 w-8 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all" disabled={!!isLoading}>
                  <MoreVertical size={16} />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -8 }} className="absolute right-0 top-10 z-50 w-56 bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden">
                      <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <ChevronRight size={14} className="text-[rgba(255,255,255,0.4)]" />Ver perfil completo
                      </Link>
                      {!u.is_fornecedor && (
                        <>
                          <button onClick={() => handleAction(u.id, "dar_premium")} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#4ade80] hover:bg-[rgba(74,222,128,0.06)] transition-colors">
                            <Crown size={14} />Dar premium grátis (30d)
                          </button>
                          <button onClick={() => handleAction(u.id, "resetar_trial")} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.06)] transition-colors">
                            <RotateCcw size={14} />Resetar trial (7d)
                          </button>
                        </>
                      )}
                      <div className="border-t border-[rgba(255,255,255,0.06)]" />
                      {u.plano_ativo !== "bloqueado" ? (
                        <button onClick={() => handleAction(u.id, "bloquear")} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors">
                          <ShieldOff size={14} />Bloquear conta
                        </button>
                      ) : (
                        <button onClick={() => handleAction(u.id, "desbloquear")} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#4ade80] hover:bg-[rgba(74,222,128,0.06)] transition-colors">
                          <Shield size={14} />Desbloquear conta
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
