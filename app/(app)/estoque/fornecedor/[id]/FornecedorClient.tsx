"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Truck,
  Package,
  X,
  CheckCircle2,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Stars } from "@/components/Stars";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DoseBadge } from "@/components/DoseBadge";
import { sendPush, pedidoNotificacoes } from "@/lib/notifications";
import {
  nomeFornecedor,
  iniciais,
  formatBRL,
  precoVigente,
  TIPO_FORNECEDOR_LABEL,
  TIPO_PRODUTO_LABEL,
  type Fornecedor,
  type FornecedorProduto,
  type Avaliacao,
  type EnderecoEntrega,
} from "@/lib/fornecedores";

interface ProfileAddr extends EnderecoEntrega {
  nome?: string;
}

type Tab = "produtos" | "avaliacoes";

export function FornecedorClient({
  userId,
  fornecedor,
  produtos,
  avaliacoes,
  profile,
}: {
  userId: string;
  fornecedor: Fornecedor;
  produtos: FornecedorProduto[];
  avaliacoes: Avaliacao[];
  profile: ProfileAddr;
}) {
  const [tab, setTab] = useState<Tab>("produtos");
  const [pedido, setPedido] = useState<FornecedorProduto | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const nome = nomeFornecedor(fornecedor);

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Fornecedor" />

      {/* Hero header */}
      <div className="rounded-[24px] bg-surface p-6 shadow-premium border-none">
        <div className="flex items-start gap-4">
          {fornecedor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fornecedor.logo_url}
              alt={nome}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface text-xl font-bold text-ember">
              {iniciais(nome)}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-xl font-bold text-text leading-tight">{nome}</h2>
            <div className="mt-1.5">
              <Stars
                rating={fornecedor.avaliacao_media ?? 0}
                size={14}
                count={avaliacoes.length}
                showValue
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {fornecedor.tipo && (
                <span className="rounded-full bg-surface-mid px-2.5 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                  {TIPO_FORNECEDOR_LABEL[fornecedor.tipo]}
                </span>
              )}
              {typeof fornecedor.prazo_entrega_dias === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-mid px-2.5 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                  <Truck size={10} strokeWidth={2.5} /> {fornecedor.prazo_entrega_dias}d úteis
                </span>
              )}
            </div>
          </div>
        </div>
        {fornecedor.descricao && (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {fornecedor.descricao}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surface rounded-full shadow-premium gap-1">
        {(
          [
            ["produtos", "Produtos"],
            ["avaliacoes", "Avaliações"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full py-2.5 text-[13px] font-bold transition-all ${
              tab === id
                ? "bg-ember text-white shadow-lg shadow-forest/20"
                : "text-dim hover:bg-surface-mid"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "produtos" && (
        <div className="space-y-3">
          {produtos.length === 0 ? (
            <div className="rounded-[24px] bg-surface p-10 text-center shadow-premium">
               <Package className="h-10 w-10 text-gray-200 mx-auto mb-4" />
               <p className="text-sm font-bold text-text">Nenhum produto</p>
               <p className="text-xs text-muted mt-1">Este fornecedor ainda não cadastrou produtos.</p>
            </div>
          ) : (
            produtos.map((p) => (
              <ProdutoCard key={p.id} produto={p} onPedir={() => setPedido(p)} />
            ))
          )}
        </div>
      )}

      {tab === "avaliacoes" && (
        <div className="space-y-3">
          {avaliacoes.length === 0 ? (
            <div className="rounded-[24px] bg-surface p-10 text-center shadow-premium">
               <Stars rating={0} size={20} />
               <p className="text-sm font-bold text-text mt-4">Sem avaliações</p>
               <p className="text-xs text-muted mt-1">Ainda não há avaliações para este fornecedor.</p>
            </div>
          ) : (
            avaliacoes.map((a) => (
              <div
                key={a.id}
                className="rounded-[20px] bg-surface p-5 shadow-premium"
              >
                <div className="flex items-center justify-between">
                  <Stars rating={a.nota} size={14} />
                  <span className="text-[11px] font-bold text-dim">
                    {format(parseISO(a.created_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {a.comentario && (
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a.comentario}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {pedido && (
        <ConfirmarPedidoModal
          userId={userId}
          fornecedor={fornecedor}
          produto={pedido}
          profile={profile}
          onClose={() => setPedido(null)}
          onSuccess={(codigo) => {
            setPedido(null);
            setSucesso(codigo);
          }}
        />
      )}

      {sucesso && (
        <SucessoModal codigo={sucesso} onClose={() => setSucesso(null)} />
      )}
    </div>
  );
}

function ProdutoCard({
  produto,
  onPedir,
}: {
  produto: FornecedorProduto;
  onPedir: () => void;
}) {
  const temPromo = produto.preco_promocional != null;
  const esgotado = produto.estoque_disponivel <= 0;
  const baixo = produto.estoque_disponivel > 0 && produto.estoque_disponivel <= 5;

  return (
    <div className="rounded-[20px] bg-surface p-5 shadow-premium border-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DoseBadge mg={produto.dose_mg} className="bg-ember" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-mid px-2.5 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
            <Package size={10} strokeWidth={2.5} />
            {TIPO_PRODUTO_LABEL[produto.tipo_produto]}
            {produto.tipo_produto === "caixa" && produto.unidades_por_caixa
              ? ` · ${produto.unidades_por_caixa} un`
              : ""}
          </span>
        </div>
        <div className="text-right">
          {temPromo && (
            <p className="text-[11px] text-dim line-through">
              {formatBRL(produto.preco)}
            </p>
          )}
          <p className="text-lg font-black text-text tracking-tight">
            {formatBRL(precoVigente(produto))}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            esgotado
              ? "text-red-500"
              : baixo
                ? "text-amber-500"
                : "text-dim"
          }`}
        >
          {esgotado
            ? "Esgotado"
            : baixo
              ? `Apenas ${produto.estoque_disponivel} restantes`
              : "Em estoque"}
        </span>
        <button
          onClick={onPedir}
          disabled={esgotado}
          className="rounded-full bg-ember px-6 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-dim shadow-lg shadow-forest/20"
        >
          Pedir agora
        </button>
      </div>
    </div>
  );
}

function ConfirmarPedidoModal({
  userId,
  fornecedor,
  produto,
  profile,
  onClose,
  onSuccess,
}: {
  userId: string;
  fornecedor: Fornecedor;
  produto: FornecedorProduto;
  profile: ProfileAddr;
  onClose: () => void;
  onSuccess: (codigo: string) => void;
}) {
  const max = Math.max(1, produto.estoque_disponivel);
  const [quantidade, setQuantidade] = useState(1);
  const [obs, setObs] = useState("");
  const [end, setEnd] = useState<EnderecoEntrega>({
    cep: profile.cep ?? "",
    logradouro: profile.logradouro ?? "",
    numero: profile.numero ?? "",
    complemento: profile.complemento ?? "",
    bairro: profile.bairro ?? "",
    cidade: profile.cidade ?? "",
    estado: profile.estado ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unit = precoVigente(produto);
  const total = useMemo(() => unit * quantidade, [unit, quantidade]);
  const freteGratis =
    fornecedor.entrega_gratis_acima != null &&
    total >= fornecedor.entrega_gratis_acima;

  async function confirmar() {
    // Endereço de entrega é obrigatório para o fornecedor conseguir enviar.
    if (!end.logradouro?.trim() || !end.numero?.trim() || !end.cidade?.trim() || !end.estado?.trim() || !end.cep?.trim()) {
      setError("Preencha o endereço de entrega (CEP, logradouro, número, cidade e UF).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: insErr } = await supabase
        .from("pedidos")
        .insert({
          paciente_id: userId,
          fornecedor_id: fornecedor.id,
          produto_id: produto.id,
          quantidade,
          preco_unitario: unit,
          preco_total: total,
          endereco_entrega: end,
          observacoes_paciente: obs || null,
        })
        .select("codigo")
        .single();

      if (insErr) throw insErr;
      const codigo = (data?.codigo as string) ?? "—";

      // Notify the supplier via the robust specialized route
      try {
        const baseUrl = "https://momo-rust-nu.vercel.app";
        await fetch(`${baseUrl}/api/push/venda`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            evento: "NOVO_PEDIDO",
            pedidoId: (data as any).id || codigo, // Expecting ID, but route handles lookup
            secret: "momo8878"
          })
        });
      } catch (e) {
        console.error("[Push] Error calling specialized venda route:", e);
      }

      onSuccess(codigo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-bg p-8 shadow-2xl animate-slide-up z-[101]">
        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-gray-200" />
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Confirmar pedido</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-surface p-2 text-dim shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Resumo */}
        <div className="rounded-[24px] bg-surface p-6 shadow-premium">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoseBadge mg={produto.dose_mg} className="bg-ember" />
              <span className="text-[11px] font-bold text-dim uppercase tracking-wider">
                {TIPO_PRODUTO_LABEL[produto.tipo_produto]}
              </span>
            </div>
            <span className="text-sm font-bold text-text">
              {formatBRL(unit)} / un
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-bold text-text">Quantidade</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-full bg-surface-mid flex items-center justify-center text-lg font-bold text-gray-600 transition-all active:scale-90"
              >
                −
              </button>
              <span className="w-4 text-center text-lg font-black text-text">
                {quantidade}
              </span>
              <button
                onClick={() => setQuantidade((q) => Math.min(max, q + 1))}
                className="h-10 w-10 rounded-full bg-surface-mid flex items-center justify-center text-lg font-bold text-gray-600 transition-all active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
            <span className="text-base font-bold text-text">Total</span>
            <span className="text-2xl font-black text-ember tracking-tighter">
              {formatBRL(total)}
            </span>
          </div>
          {freteGratis && (
            <p className="mt-2 text-right text-[11px] font-bold text-[#16a34a] uppercase tracking-wider">
              ✓ Frete grátis aplicado
            </p>
          )}
        </div>

        {/* Endereço */}
        <div className="mt-8">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
            <MapPin size={16} className="text-ember" strokeWidth={2.5} /> Endereço de entrega
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-standard col-span-2"
              placeholder="Rua / logradouro"
              value={end.logradouro}
              onChange={(e) => setEnd({ ...end, logradouro: e.target.value })}
            />
            <input
              className="input-standard"
              placeholder="Número"
              value={end.numero}
              onChange={(e) => setEnd({ ...end, numero: e.target.value })}
            />
            <input
              className="input-standard"
              placeholder="Complemento"
              value={end.complemento}
              onChange={(e) => setEnd({ ...end, complemento: e.target.value })}
            />
            <input
              className="input-standard"
              placeholder="Bairro"
              value={end.bairro}
              onChange={(e) => setEnd({ ...end, bairro: e.target.value })}
            />
            <input
              className="input-standard"
              placeholder="CEP"
              value={end.cep}
              onChange={(e) => setEnd({ ...end, cep: e.target.value })}
            />
            <input
              className="input-standard"
              placeholder="Cidade"
              value={end.cidade}
              onChange={(e) => setEnd({ ...end, cidade: e.target.value })}
            />
            <input
              className="input-standard text-center"
              placeholder="UF"
              maxLength={2}
              value={end.estado}
              onChange={(e) =>
                setEnd({ ...end, estado: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>

        {/* Observações */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-text">
            Observações (opcional)
          </label>
          <textarea
            rows={2}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Pode deixar na portaria"
            className="input-standard resize-none"
          />
        </div>

        <button
          onClick={confirmar}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ember py-4.5 text-base font-bold text-white shadow-lg shadow-forest/30 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}

function SucessoModal({
  codigo,
  onClose,
}: {
  codigo: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fab-pop relative w-full max-w-sm rounded-[32px] bg-surface p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface">
          <CheckCircle2 className="h-12 w-12 text-ember" strokeWidth={2.5} />
        </div>
        <h2 className="mt-6 text-xl font-bold text-text">
          Pedido realizado!
        </h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Seu pedido foi enviado ao fornecedor. Acompanhe o status em Meus
          Pedidos.
        </p>
        <div className="mt-6 rounded-2xl bg-surface-mid py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-dim">
            Código do pedido
          </p>
          <p className="text-xl font-black text-ember tracking-tighter">{codigo}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/meus-pedidos"
            className="flex items-center justify-center gap-2 rounded-full bg-ember py-4 text-sm font-bold text-white shadow-lg shadow-forest/20 active:scale-[0.98]"
          >
            <ShoppingBag size={18} /> Ver meus pedidos
          </Link>
          <button
            onClick={onClose}
            className="rounded-full py-3 text-sm font-bold text-dim hover:text-gray-600 transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
