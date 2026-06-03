"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Edit2, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TIPO_PRODUTO_LABEL, formatBRL } from "@/lib/fornecedores";
import toast from "react-hot-toast";

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15];

type Produto = {
  id: string;
  fornecedor_id: string;
  tipo_produto: "ampola_avulsa" | "caixa";
  dose_mg: number;
  unidades_por_caixa: number | null;
  preco: number;
  preco_promocional: number | null;
  estoque_disponivel: number;
  ativo: boolean;
};

const emptyForm = {
  tipo_produto: "ampola_avulsa" as "ampola_avulsa" | "caixa",
  dose_mg: "5",
  unidades_por_caixa: "",
  preco: "",
  preco_promocional: "",
  estoque_disponivel: "0",
  ativo: true,
};

export default function FornecedorProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: fornecedor } = await supabase
      .from("fornecedores")
      .select("id")
      .eq("user_id", session.user.id)
      .single();
    if (fornecedor) {
      setFornecedorId(fornecedor.id);
      const { data } = await supabase
        .from("fornecedor_produtos")
        .select("*")
        .eq("fornecedor_id", fornecedor.id)
        .order("dose_mg", { ascending: true });
      setProdutos((data as Produto[]) || []);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: Produto) {
    setEditing(p);
    setForm({
      tipo_produto: p.tipo_produto,
      dose_mg: String(p.dose_mg),
      unidades_por_caixa: p.unidades_por_caixa?.toString() || "",
      preco: String(p.preco),
      preco_promocional: p.preco_promocional?.toString() || "",
      estoque_disponivel: String(p.estoque_disponivel ?? 0),
      ativo: p.ativo,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!fornecedorId) return;
    if (!form.preco || Number(form.preco) <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }
    if (form.tipo_produto === "caixa" && !form.unidades_por_caixa) {
      toast.error("Informe as unidades por caixa.");
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
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Meus Produtos"
        showBack={false}
        action={
          <button onClick={openCreate} className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white shadow-sm">
            <Plus size={20} />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {produtos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
            <Package className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Nenhum produto cadastrado.</p>
            <button onClick={openCreate} className="mt-4 text-sm font-bold text-forest">+ Adicionar produto</button>
          </div>
        ) : (
          produtos.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-black">
                  {p.dose_mg}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{TIPO_PRODUTO_LABEL[p.tipo_produto]}</p>
                  <p className="text-xs font-bold text-forest">
                    {formatBRL(p.preco_promocional ?? p.preco)}
                    {p.preco_promocional != null && (
                      <span className="ml-2 text-[10px] font-medium text-slate-400 line-through">{formatBRL(p.preco)}</span>
                    )}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Estoque: {p.estoque_disponivel}{!p.ativo && " · inativo"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-slate-600"><Edit2 size={18} /></button>
                <button onClick={() => setDeleteTarget(p)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal criar/editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">{editing ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["ampola_avulsa", "caixa"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_produto: t })}
                      className={`rounded-xl py-3 text-xs font-bold transition-all ${
                        form.tipo_produto === t ? "bg-forest text-white shadow-md" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {TIPO_PRODUTO_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Dose (mg)</label>
                <div className="flex flex-wrap gap-2">
                  {DOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, dose_mg: String(d) })}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        form.dose_mg === String(d) ? "bg-forest text-white" : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {form.tipo_produto === "caixa" && (
                <Field label="Unidades por caixa">
                  <input type="number" value={form.unidades_por_caixa} onChange={(e) => setForm({ ...form, unidades_por_caixa: e.target.value })} className="input-standard" placeholder="Ex: 4" />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Preço (R$)">
                  <input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} className="input-standard" placeholder="0,00" />
                </Field>
                <Field label="Promoção (R$)">
                  <input type="number" step="0.01" value={form.preco_promocional} onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })} className="input-standard" placeholder="opcional" />
                </Field>
              </div>

              <Field label="Estoque disponível">
                <input type="number" value={form.estoque_disponivel} onChange={(e) => setForm({ ...form, estoque_disponivel: e.target.value })} className="input-standard" />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="h-5 w-5 rounded border-slate-200 text-forest focus:ring-forest" />
                <span className="text-sm font-medium text-slate-700">Produto ativo (visível para pacientes)</span>
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
              >
                {saving ? <LoadingSpinner size="sm" /> : editing ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </div>
          </div>
        </div>
      )}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">{label}</label>
      {children}
    </div>
  );
}
