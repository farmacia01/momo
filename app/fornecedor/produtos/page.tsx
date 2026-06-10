"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Edit2, Trash2, X, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15];
const TIPO_PRODUTO_LABEL: Record<string, string> = {
  ampola_avulsa: "Ampola Avulsa",
  caixa: "Caixa Fechada",
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function MeusProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo_produto: "ampola_avulsa",
    dose_mg: "2.5",
    unidades_por_caixa: "1",
    preco: "",
    preco_promocional: "",
    estoque_disponivel: "10",
    ativo: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: fornecedor } = await supabase
      .from("fornecedores")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (fornecedor) {
      setFornecedorId(fornecedor.id);
      const { data: prods } = await supabase
        .from("fornecedor_produtos")
        .select("*")
        .eq("fornecedor_id", fornecedor.id)
        .order("dose_mg", { ascending: true });

      setProdutos(prods || []);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      tipo_produto: "ampola_avulsa",
      dose_mg: "2.5",
      unidades_por_caixa: "1",
      preco: "",
      preco_promocional: "",
      estoque_disponivel: "10",
      ativo: true,
    });
    setShowForm(true);
  }

  function openEdit(prod: any) {
    setEditing(prod);
    setForm({
      tipo_produto: prod.tipo_produto,
      dose_mg: String(prod.dose_mg),
      unidades_por_caixa: String(prod.unidades_por_caixa || 1),
      preco: String(prod.preco),
      preco_promocional: prod.preco_promocional ? String(prod.preco_promocional) : "",
      estoque_disponivel: String(prod.estoque_disponivel),
      ativo: prod.ativo,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!fornecedorId) return;
    if (!form.preco) {
      toast.error("Preço é obrigatório.");
      return;
    }
    setSaving(true);
    const payload = {
      fornecedor_id: fornecedorId,
      tipo_produto: form.tipo_produto,
      dose_mg: Number(form.dose_mg),
      unidades_por_caixa: form.tipo_produto === "caixa" && form.unidades_por_caixa ? Number(form.unidades_por_caixa) : null,
      preco: Number(form.preco),
      preco_promocional: form.preco_promocional ? Number(form.preco_promocional) : null,
      estoque_disponivel: form.estoque_disponivel ? Number(form.estoque_disponivel) : 0,
      ativo: form.ativo,
    };

    if (editing) {
      const { error } = await supabase.from("fornecedor_produtos").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao salvar."); setSaving(false); return; }
      toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("fornecedor_produtos").insert(payload);
      if (error) { toast.error("Erro ao criar."); setSaving(false); return; }
      toast.success("Produto cadastrado!");
    }
    setSaving(false);
    setShowForm(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("fornecedor_produtos").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Produto excluído.");
      setProdutos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-[800] text-text tracking-[-0.5px]">Meus Produtos</h2>
          <p className="text-[12px] font-medium text-muted mt-0.5">Gerencie seu catálogo</p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 w-10 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {produtos.length === 0 ? (
          <div
            className="text-center py-20 rounded-[28px] border border-dashed bg-surface border-surface-border"
          >
            <Package className="mx-auto mb-4" size={40} style={{ color: "var(--color-text-dim)" }} />
            <p className="text-muted font-medium text-sm">Nenhum produto cadastrado.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 text-sm font-bold text-ember hover:underline"
            >
              + Adicionar produto
            </button>
          </div>
        ) : (
          produtos.map((p) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={p.id}
              className="f-card p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="h-12 w-12 rounded-[16px] flex items-center justify-center font-black text-ember text-sm"
                    style={{ background: "var(--color-ember-glow)" }}
                  >
                    {p.dose_mg}
                  </div>
                  {p.preco_promocional != null && (
                    <div
                      className="absolute -top-2 -right-2 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm uppercase bg-ember"
                    >
                      Oferta
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text">{TIPO_PRODUTO_LABEL[p.tipo_produto]}</p>
                    {!p.ativo && (
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-mid text-text-dim"
                      >
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-xs font-bold text-ember">
                      {formatBRL(p.preco_promocional ?? p.preco)}
                    </p>
                    {p.preco_promocional != null && (
                      <span className="text-[10px] font-medium text-text-dim line-through">{formatBRL(p.preco)}</span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-text-dim">
                    Estoque:{" "}
                    <span className={p.estoque_disponivel <= 2 ? "text-warning font-bold" : "text-text-dim"}>
                      {p.estoque_disponivel} un
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="p-2.5 rounded-xl transition-all text-text-dim hover:text-ember hover:bg-ember/10"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(p)}
                  className="p-2.5 rounded-xl transition-all text-text-dim hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ProductFormModal
            editing={editing}
            form={form}
            setForm={setForm}
            saving={saving}
            onClose={() => setShowForm(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Excluir produto"
        message="Tem certeza que deseja remover este produto do seu catálogo?"
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DarkField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest ml-1 text-text-dim">{label}</label>
      {children}
    </div>
  );
}

function ProductFormModal({ editing, form, setForm, saving, onClose, onSave }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-[1001] w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl bg-surface border border-surface-border"
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-6 sm:hidden bg-surface-border" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-black text-text tracking-tight">{editing ? "Editar Produto" : "Novo Produto"}</h2>
            <p className="text-[13px] text-muted font-medium mt-0.5">Configure sua oferta no catálogo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full transition-transform active:scale-90 bg-surface-mid text-text-dim"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Tipo de produto */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.1em] ml-1">Tipo de Produto</label>
            <div className="grid grid-cols-2 gap-3">
              {(["ampola_avulsa", "caixa"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tipo_produto: t })}
                  className={`rounded-2xl py-4 text-[13px] font-bold transition-all border ${
                    form.tipo_produto === t
                      ? "bg-ember text-white border-ember shadow-ember scale-[1.02]"
                      : "bg-surface-mid text-muted border-transparent hover:border-surface-border"
                  }`}
                >
                  {TIPO_PRODUTO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Dose */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.1em] ml-1">Dose (mg)</label>
            <div className="flex flex-wrap gap-2">
              {DOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, dose_mg: String(d) })}
                  className={`min-w-[56px] px-4 py-3 rounded-xl text-[13px] font-bold transition-all border ${
                    form.dose_mg === String(d)
                      ? "bg-ember text-white border-ember shadow-ember-sm"
                      : "bg-surface-mid text-muted border-transparent hover:border-surface-border"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {form.tipo_produto === "caixa" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <DarkField label="Unidades por caixa">
                <input 
                  type="number" 
                  value={form.unidades_por_caixa} 
                  onChange={(e) => setForm({ ...form, unidades_por_caixa: e.target.value })} 
                  className="w-full h-14 rounded-2xl px-5 text-sm font-bold text-text bg-surface-mid border border-surface-border focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all" 
                  placeholder="Ex: 4" 
                />
              </DarkField>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Preço (R$)">
              <input 
                type="number" 
                step="0.01" 
                value={form.preco} 
                onChange={(e) => setForm({ ...form, preco: e.target.value })} 
                className="w-full h-14 rounded-2xl px-5 text-sm font-bold text-text bg-surface-mid border border-surface-border focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all" 
                placeholder="0,00" 
              />
            </DarkField>
            <DarkField label="Promoção (R$)">
              <input 
                type="number" 
                step="0.01" 
                value={form.preco_promocional} 
                onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })} 
                className="w-full h-14 rounded-2xl px-5 text-sm font-bold text-text bg-surface-mid border border-surface-border focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all" 
                placeholder="Opcional" 
              />
            </DarkField>
          </div>

          <DarkField label="Estoque disponível">
            <input 
              type="number" 
              value={form.estoque_disponivel} 
              onChange={(e) => setForm({ ...form, estoque_disponivel: e.target.value })} 
              className="w-full h-14 rounded-2xl px-5 text-sm font-bold text-text bg-surface-mid border border-surface-border focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all" 
            />
          </DarkField>

          <label className="flex items-center gap-4 cursor-pointer p-5 rounded-2xl transition-all bg-surface-mid border border-surface-border hover:border-ember/30 group">
            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                form.ativo ? "bg-ember border-ember shadow-ember-sm" : "bg-transparent border-surface-border group-hover:border-text-dim"
              }`}
              onClick={() => setForm({ ...form, ativo: !form.ativo })}
            >
              {form.ativo && <Check size={14} strokeWidth={4} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-bold text-text">Disponível para venda</p>
              <p className="text-[11px] font-medium text-text-dim mt-0.5">Ative para que o produto apareça nas buscas</p>
            </div>
          </label>

          <div className="pt-4">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex h-15 w-full items-center justify-center gap-3 rounded-full text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg"
              style={{ 
                height: "60px",
                background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", 
                boxShadow: "var(--shadow-ember)" 
              }}
            >
              {saving ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editing ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
