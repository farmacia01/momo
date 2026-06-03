"use client";

import { useState, useRef } from "react";
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
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  formatBRL, 
  precoVigente, 
  nomeFornecedor, 
  iniciais,
  type Fornecedor,
  type FornecedorProduto
} from "@/lib/fornecedores";
import { sendPush, pedidoNotificacoes } from "@/lib/notifications";
import { Stars } from "@/components/Stars";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

interface Review {
  id: string;
  nota: number;
  comentario: string | null;
  fotos_url: string[] | null;
  criado_em: string;
  paciente_id: string;
  profiles?: {
    nome: string | null;
  } | null;
}

export function ProdutoDetalheClient({
  userId,
  produto,
  fornecedor,
  avaliacoes,
  initialProfile,
}: {
  userId: string;
  produto: FornecedorProduto & { foto_url?: string };
  fornecedor: Fornecedor & { 
    oferece_frete_full?: boolean; 
    taxa_motoboy?: number; 
    aceita_cod?: boolean; 
    cod_taxa_percentual?: number;
    tempo_entrega_minutos?: number;
  };
  avaliacoes: Review[];
  initialProfile: any;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [qtd, setQtd] = useState(1);
  const [tipoFrete, setTipoFrete] = useState<"motoboy" | "padrao">("padrao");
  const [codAtivo, setCodAtivo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(produto.foto_url);
  const [visibleReviews, setVisibleReviews] = useState(3);

  const unitPrice = precoVigente(produto);
  const shippingPrice = tipoFrete === "motoboy" ? (Number(fornecedor.taxa_motoboy) || 0) : 0;
  
  const subtotal = unitPrice * qtd;
  const codFee = codAtivo ? (subtotal * (Number(fornecedor.cod_taxa_percentual) || 0) / 100) : 0;
  const total = subtotal + shippingPrice + codFee;

  // Review stats
  const avgRating = avaliacoes.length > 0 
    ? avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length 
    : 0;
    
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: avaliacoes.filter(a => a.nota === star).length,
    percentage: avaliacoes.length > 0 
      ? (avaliacoes.filter(a => a.nota === star).length / avaliacoes.length) * 100 
      : 0
  }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 2MB)");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${produto.id}-${Date.now()}.${fileExt}`;
      const filePath = `produtos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("produto-fotos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("produto-fotos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("fornecedor_produtos")
        .update({ foto_url: publicUrl })
        .eq("id", produto.id);

      if (updateError) throw updateError;

      setFotoUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      if (!initialProfile?.logradouro || !initialProfile?.numero || !initialProfile?.cidade) {
         toast.error("Complete seu endereço no perfil antes de pedir.");
         router.push('/configuracoes');
         return;
      }

      const { data: pedido, error: pedErr } = await supabase
        .from("pedidos")
        .insert({
          paciente_id: userId,
          fornecedor_id: fornecedor.id,
          produto_id: produto.id,
          quantidade: qtd,
          preco_unitario: unitPrice,
          preco_total: total,
          tipo_frete: tipoFrete,
          taxa_frete: shippingPrice,
          cash_on_delivery: codAtivo,
          endereco_entrega: {
            cep: initialProfile?.cep,
            logradouro: initialProfile?.logradouro,
            numero: initialProfile?.numero,
            complemento: initialProfile?.complemento,
            bairro: initialProfile?.bairro,
            cidade: initialProfile?.cidade,
            estado: initialProfile?.estado,
          },
          status: 'novo'
        })
        .select('id, codigo')
        .single();

      if (pedErr) throw pedErr;

      if (fornecedor.user_id) {
        await sendPush(fornecedor.user_id, pedidoNotificacoes.novoPedidoParaFornecedor(pedido.codigo));
      }

      toast.success("Pedido realizado com sucesso!");
      router.push(`/meus-pedidos/${pedido.id}`);
    } catch (err: any) {
      toast.error("Erro ao realizar pedido: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* HERO DO PRODUTO (topo) */}
      <div 
        className="relative h-[160px] w-full"
        style={{ background: 'linear-gradient(135deg, #1c4d2e, #3a9460)' }}
      >
        <button 
          onClick={() => router.back()}
          className="absolute left-4 top-4 z-20 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform active:scale-90"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative h-20 w-20 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <div className="h-full w-full rounded-2xl overflow-hidden flex items-center justify-center">
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt="Produto" className="h-full w-full object-cover" />
              ) : (
                <Droplet size={32} className="text-white/60" />
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4ade80] text-white shadow-md border-2 border-white transition-transform active:scale-90"
            >
              {uploading ? <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> : <Camera size={12} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleUpload}
            />
          </div>
        </div>
      </div>

      {/* CARD DE INFO (sobrepõe o hero com margin-top negativo) */}
      <div className="mx-4 -mt-8 relative z-20">
        <div className="rounded-[20px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
           <button 
             className="flex items-center gap-1.5 transition-opacity active:opacity-60"
             onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
           >
             <Stars rating={avgRating} size={14} />
             <span className="text-[11px] font-medium text-slate-400">({avaliacoes.length} avaliações)</span>
           </button>

           <h1 className="mt-2 text-[18px] font-bold text-[#111] leading-tight">
             {produto.tipo_produto === 'caixa' 
               ? `Mounjaro ${produto.dose_mg}mg (Caixa c/ ${produto.unidades_por_caixa || 4} un)` 
               : `Mounjaro ${produto.dose_mg}mg (Ampola Avulsa)`}
           </h1>
           <p className="mt-0.5 text-[11px] text-slate-400 font-bold uppercase tracking-wide">
             {produto.tipo_produto === 'caixa' ? 'Caixa fechada' : 'Ampola avulsa'} · {nomeFornecedor(fornecedor)}
           </p>

           <div className="mt-4 flex items-baseline gap-2">
             <span className="text-[24px] font-bold text-[#1c4d2e]">
               {formatBRL(unitPrice)}
             </span>
             {produto.preco_promocional && (
               <>
                 <span className="text-[14px] text-slate-300 line-through font-medium">
                   {formatBRL(produto.preco)}
                 </span>
                 <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">
                   -{Math.round((1 - Number(produto.preco_promocional) / Number(produto.preco)) * 100)}%
                 </span>
               </>
             )}
           </div>

           <div className="my-4 h-[1px] bg-[#f3f4f6]" />

           <div className="flex items-center justify-between">
             <span className="text-sm font-bold text-[#111]">Quantidade</span>
             <div className="flex items-center gap-5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-1.5">
               <button 
                 onClick={() => setQtd(q => Math.max(1, q - 1))}
                 className="text-[#1c4d2e] transition-transform active:scale-75"
               >
                 <Minus size={16} strokeWidth={3} />
               </button>
               <span className="min-w-[16px] text-center text-[14px] font-black text-[#1c4d2e]">
                 {qtd}
               </span>
               <button 
                 onClick={() => setQtd(q => q + 1)}
                 className="text-[#1c4d2e] transition-transform active:scale-75"
               >
                 <Plus size={16} strokeWidth={3} />
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* SELEÇÃO DE FRETE */}
      <div className="mt-8 px-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Tipo de entrega
        </h3>
        <div className="mt-3 space-y-3">
          {fornecedor.oferece_frete_full && (
            <button 
              onClick={() => setTipoFrete('motoboy')}
              className={`flex w-full items-center justify-between rounded-2xl border-[1.5px] bg-white p-4 transition-all ${
                tipoFrete === 'motoboy' ? 'border-[#1c4d2e]' : 'border-transparent shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef3c7]">
                  <Bike size={20} className="text-[#d97706]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-[#111]">Frete Full — Motoboy</p>
                    <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-[8px] font-black text-green-700 uppercase tracking-widest">Rápido</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Entrega hoje em ~{fornecedor.tempo_entrega_minutos || 60} min</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#1c4d2e]">
                {formatBRL(fornecedor.taxa_motoboy)}
              </span>
            </button>
          )}

          <button 
            onClick={() => setTipoFrete('padrao')}
            className={`flex w-full items-center justify-between rounded-2xl border-[1.5px] bg-white p-4 transition-all ${
              tipoFrete === 'padrao' ? 'border-[#1c4d2e]' : 'border-transparent shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4]">
                <Truck size={20} className="text-[#16a34a]" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-bold text-[#111]">Entrega padrão</p>
                <p className="text-[10px] text-slate-400">2 a 5 dias úteis</p>
              </div>
            </div>
            <span className="text-[13px] font-bold text-[#16a34a]">
              Grátis
            </span>
          </button>
        </div>
      </div>

      {/* CASH ON DELIVERY */}
      {fornecedor.aceita_cod && (
        <div className="mt-8 px-4">
           <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef9c3]">
                  <Banknote size={20} className="text-[#ca8a04]" />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-bold text-[#111]">Pagar na entrega (COD)</p>
                  {Number(fornecedor.cod_taxa_percentual) > 0 ? (
                    <p className="text-[10px] text-slate-400">Adicional de {fornecedor.cod_taxa_percentual}%</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Sem taxas extras</p>
                  )}
                </div>
             </div>
             <button 
               onClick={() => setCodAtivo(!codAtivo)}
               className={`relative h-6 w-11 rounded-full transition-colors ${codAtivo ? 'bg-[#1c4d2e]' : 'bg-slate-200'}`}
             >
               <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${codAtivo ? 'left-6' : 'left-1'}`} />
             </button>
           </div>
        </div>
      )}

      {/* SEÇÃO AVALIAÇÕES */}
      <div id="reviews" className="mt-12 px-4">
        <h3 className="text-[15px] font-bold text-[#111]">Avaliações</h3>
        
        <div className="mt-4 flex items-center gap-8 bg-white p-6 rounded-3xl shadow-sm">
           <div className="text-center">
             <div className="text-[40px] font-black text-[#111] leading-none">{avgRating.toFixed(1)}</div>
             <div className="mt-1">
               <Stars rating={avgRating} size={14} />
             </div>
             <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{avaliacoes.length} reviews</p>
           </div>

           <div className="flex-1 space-y-1.5">
             {distribution.map(d => (
               <div key={d.star} className="flex items-center gap-2">
                 <span className="w-2 text-[10px] font-bold text-slate-400">{d.star}</span>
                 <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${d.percentage}%` }}
                     className="h-full bg-amber-400 rounded-full" 
                   />
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="mt-8 space-y-6">
          <AnimatePresence>
            {avaliacoes.slice(0, visibleReviews).map((a, idx) => (
              <motion.div 
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-slate-100 pb-6 last:border-0"
              >
                 <div className="flex items-center gap-3">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                     {iniciais(a.profiles?.nome || 'Paciente')}
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-bold text-[#111]">{a.profiles?.nome || 'Paciente'}</p>
                        <Stars rating={a.nota} size={10} />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(a.criado_em), { addSuffix: true, locale: ptBR })}
                      </p>
                   </div>
                 </div>
                 {a.comentario && (
                   <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a.comentario}</p>
                 )}
                 {a.fotos_url && a.fotos_url.length > 0 && (
                   <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                     {a.fotos_url.map((url, i) => (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img key={i} src={url} alt="Review" className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm" />
                     ))}
                   </div>
                 )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {avaliacoes.length > visibleReviews && (
            <button 
              onClick={() => setVisibleReviews(prev => prev + 5)}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-[12px] font-bold text-[#1c4d2e] transition-transform active:scale-95"
            >
              Ver mais avaliações <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* BOTÃO CONFIRMAR PEDIDO */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 p-4 backdrop-blur-md border-t border-slate-100/50">
         <button 
           onClick={handleConfirmOrder}
           disabled={loading}
           className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1c4d2e] text-[16px] font-bold text-white shadow-lg shadow-[#1c4d2e]/20 active:scale-[0.98] disabled:opacity-60"
         >
           {loading ? <LoadingSpinner size="sm" /> : `Confirmar pedido — ${formatBRL(total)}`}
         </button>
      </div>
    </div>
  );
}
