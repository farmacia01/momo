"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Droplet, 
  Camera, 
  Minus, 
  Plus, 
  Bike, 
  Truck, 
  Banknote, 
  ChevronRight,
  Star
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatBRL, precoVigente } from "@/lib/fornecedores";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ProdutoDetalheClient({ 
  userId, 
  produto, 
  fornecedor, 
  avaliacoes, 
  initialProfile 
}: { 
  userId: string;
  produto: any;
  fornecedor: any;
  avaliacoes: any[];
  initialProfile: any;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avaliacoesRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [tipoEntrega, setTipoEntrega] = useState<"motoboy" | "padrao">(fornecedor.oferece_frete_full ? "motoboy" : "padrao");
  const [usarCod, setUsarCod] = useState(false);

  const price = precoVigente(produto);
  const hasPromo = produto.preco_promocional && produto.preco_promocional < produto.preco;
  const promoPercent = hasPromo ? Math.round((1 - produto.preco_promocional / produto.preco) * 100) : 0;

  // Calculos
  const subtotal = price * quantidade;
  const frete = tipoEntrega === "motoboy" ? Number(fornecedor.taxa_motoboy || 0) : 0; // Assuming padrão is free for now, or you can add supplier logic
  const taxaCod = usarCod ? (subtotal + frete) * (Number(fornecedor.cod_taxa_percentual || 0) / 100) : 0;
  const total = subtotal + frete + taxaCod;

  const scrollToAvaliacoes = () => {
    avaliacoesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = `${fornecedor.id}/${produto.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from('produto-fotos').upload(path, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('produto-fotos').getPublicUrl(path);
      
      await supabase.from('fornecedor_produtos').update({ foto_url: publicUrl }).eq('id', produto.id);
      
      produto.foto_url = publicUrl; // Optimistic update
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmarPedido = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (!profile?.logradouro || !profile?.cep) {
        toast.error("Por favor, preencha seu endereço nas configurações antes de pedir.");
        router.push("/configuracoes");
        return;
      }

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        paciente_id: userId,
        fornecedor_id: fornecedor.id,
        produto_id: produto.id,
        quantidade,
        preco_unitario: price,
        preco_total: total,
        status: 'novo',
        endereco_entrega: {
          logradouro: profile.logradouro,
          numero: profile.numero,
          complemento: profile.complemento,
          bairro: profile.bairro,
          cidade: profile.cidade,
          estado: profile.estado,
          cep: profile.cep
        },
        tipo_frete: tipoEntrega,
        taxa_frete: frete,
        cash_on_delivery: usarCod,
        tempo_estimado_minutos: tipoEntrega === "motoboy" ? fornecedor.tempo_entrega_minutos : null
      }).select().single();

      if (error) throw error;

      // Notify supplier
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: fornecedor.user_id,
          title: "Novo Pedido Recebido!",
          body: `Você recebeu um novo pedido de Mounjaro ${produto.dose_mg}mg.`,
          url: `/fornecedor/pedidos/${pedido.id}`
        })
      });

      toast.success("Pedido realizado com sucesso!");
      router.push(`/meus-pedidos/${pedido.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pedido.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg min-h-screen pb-32">
      {/* Hero */}
      <div className="relative h-[160px] px-6 pt-8" style={{ background: "linear-gradient(135deg, #1a0800, #2d1200)" }}>
        <button 
          onClick={() => router.back()}
          className="absolute top-8 left-6 w-[30px] h-[30px] rounded-full bg-black/20 flex items-center justify-center text-white backdrop-blur-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 top-12">
          <div className="relative w-[80px] h-[80px] rounded-[16px] bg-surface/15 border border-white/20 flex items-center justify-center backdrop-blur-md overflow-visible">
            {produto.foto_url ? (
              <img src={produto.foto_url} alt="Produto" className="w-full h-full object-cover rounded-[16px]" />
            ) : (
              <Droplet size={32} className="text-white/60" />
            )}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-[22px] h-[22px] rounded-full bg-[#4ade80] flex items-center justify-center text-[#052e16] shadow-md border-2 border-white"
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Camera size={12} strokeWidth={2.5} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUploadPhoto} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="relative px-6 -mt-6">
        <div className="bg-surface rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] space-y-4">
          
          <button onClick={scrollToAvaliacoes} className="flex items-center gap-1.5 active:scale-95 transition-transform">
            <div className="flex text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <span className="text-[11px] font-bold text-dim">({avaliacoes.length} avaliações)</span>
          </button>

          <div>
            <h1 className="text-[18px] font-bold text-text leading-tight">Mounjaro {produto.dose_mg}mg</h1>
            <p className="text-[11px] font-medium text-dim mt-1 uppercase tracking-widest">
              Ampola avulsa · {fornecedor.nome_fantasia || fornecedor.razao_social}
            </p>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-[24px] font-bold text-ember tracking-tight">{formatBRL(price)}</span>
            {hasPromo && (
              <>
                <span className="text-sm text-dim line-through mb-1">{formatBRL(produto.preco)}</span>
                <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5">
                  -{promoPercent}%
                </span>
              </>
            )}
          </div>

          <div className="h-[1px] bg-surface-border w-full" />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-text">Quantidade</span>
            <div className="flex items-center rounded-xl p-1 gap-4" style={{ background: "rgba(255,101,0,0.08)", border: "1px solid rgba(255,101,0,0.2)" }}>
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ember active:bg-ember/10 transition-colors"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-bold text-ember min-w-[20px] text-center">{quantidade}</span>
              <button
                onClick={() => setQuantidade(quantidade + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ember active:bg-ember/10 transition-colors"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Entrega */}
      <div className="px-6 mt-8 space-y-3">
        <h3 className="text-[11px] font-bold text-dim uppercase tracking-widest px-1">Tipo de entrega</h3>

        {fornecedor.oferece_frete_full && (
          <button 
            onClick={() => setTipoEntrega("motoboy")}
            className={`w-full bg-surface rounded-[16px] p-4 flex items-start gap-4 transition-all text-left ${
              tipoEntrega === "motoboy" ? "border-2 border-ember shadow-md shadow-ember/10" : "border border-surface-border"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] shrink-0">
              <Bike size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold text-text">Frete Full — Motoboy</p>
                <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Rápido</span>
              </div>
              <p className="text-[10px] font-medium text-dim mt-1">Entrega hoje em ~{fornecedor.tempo_entrega_minutos || 60} min</p>
            </div>
            <p className="text-xs font-bold text-ember">{Number(fornecedor.taxa_motoboy) > 0 ? formatBRL(fornecedor.taxa_motoboy) : "Grátis"}</p>
          </button>
        )}

        <button 
          onClick={() => setTipoEntrega("padrao")}
          className={`w-full bg-surface rounded-[16px] p-4 flex items-start gap-4 transition-all text-left ${
            tipoEntrega === "padrao" ? "border-2 border-ember shadow-md shadow-ember/10" : "border border-surface-border"
          }`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-ember shrink-0" style={{ background: "rgba(255,101,0,0.08)" }}>
            <Truck size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-text">Entrega Padrão</p>
            <p className="text-[10px] font-medium text-dim mt-1">2 a 5 dias úteis</p>
          </div>
          <p className="text-xs font-bold text-ember">Grátis</p>
        </button>
      </div>

      {/* COD */}
      {fornecedor.aceita_cod && (
        <div className="px-6 mt-4">
          <div className="bg-surface rounded-[16px] border border-surface-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fef9c3] flex items-center justify-center text-[#ca8a04]">
                <Banknote size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-text">Pagar na Entrega (COD)</p>
                {fornecedor.cod_taxa_percentual > 0 && (
                   <p className="text-[10px] font-medium text-amber-600 mt-0.5">Adicional de {fornecedor.cod_taxa_percentual}%</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setUsarCod(!usarCod)}
              className={`w-12 h-7 rounded-full relative transition-colors ${usarCod ? "bg-ember" : "bg-surface-border"}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-surface rounded-full transition-transform ${usarCod ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Avaliações */}
      <div ref={avaliacoesRef} className="px-6 mt-10 space-y-6">
        <h3 className="text-[14px] font-bold text-text px-1">Avaliações do Produto</h3>

        <div className="bg-surface rounded-[20px] border border-surface-border p-6 flex gap-6 items-center">
          <div className="text-center">
            <p className="text-4xl font-black text-text">{fornecedor.avaliacao_media?.toFixed(1) || "5.0"}</p>
            <div className="flex text-amber-400 justify-center my-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
            </div>
            <p className="text-[10px] font-bold text-dim">{avaliacoes.length} avaliações</p>
          </div>
          
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map(star => {
              const count = avaliacoes.filter(a => Math.round(a.nota) === star).length;
              const pct = avaliacoes.length ? (count / avaliacoes.length) * 100 : (star === 5 ? 100 : 0);
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted w-3">{star}</span>
                  <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {avaliacoes.length === 0 ? (
            <p className="text-xs text-dim text-center py-4">Este produto ainda não possui avaliações.</p>
          ) : (
            avaliacoes.map((av) => (
              <div key={av.id} className="bg-surface rounded-[16px] border border-surface-border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-muted">
                      {av.paciente?.nome?.substring(0, 2).toUpperCase() || "US"}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-text">{av.paciente?.nome || "Usuário Anônimo"}</p>
                      <div className="flex text-amber-400 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} fill={i < av.nota ? "currentColor" : "none"} className={i >= av.nota ? "text-surface-border" : ""} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-dim">
                    {formatDistanceToNow(new Date(av.criado_em), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                
                {av.comentario && (
                  <p className="text-xs text-muted leading-relaxed">{av.comentario}</p>
                )}

                {av.fotos_url && av.fotos_url.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {av.fotos_url.map((url: string, i: number) => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-surface-border overflow-hidden border border-slate-200">
                        <img src={url} alt="Avaliação" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Checkout Bar */}
      <div className="fixed bottom-[90px] left-6 right-6 z-40">
        <button 
          onClick={handleConfirmarPedido}
          disabled={loading}
          className="w-full h-[52px] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70" style={{ background: "linear-gradient(135deg, #ff6500, #e05500)", boxShadow: "0 8px 30px rgba(255,101,0,0.35)" }}
        >
          {loading ? <LoadingSpinner size="sm" /> : `Confirmar pedido — ${formatBRL(total)}`}
        </button>
      </div>
    </div>
  );
}
