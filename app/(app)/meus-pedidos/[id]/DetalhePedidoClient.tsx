"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Check, 
  ChevronLeft, 
  Copy, 
  MapPin, 
  Bike, 
  Package, 
  ShieldCheck, 
  Star, 
  Camera,
  X,
  Truck,
  CheckCircle2,
  Clock,
  Upload,
  Receipt
} from "lucide-react";
import { 
  formatBRL, 
  nomeFornecedor, 
  TIPO_PRODUTO_LABEL 
} from "@/lib/fornecedores";
import { format, addMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function DetalhePedidoClient({ pedido }: { pedido: any }) {
  const router = useRouter();
  const [p, setPedido] = useState(pedido);
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pedido-${p.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${p.id}` },
        (payload) => {
          setPedido((prev: any) => ({ ...prev, ...payload.new }));
          if (payload.new.status === 'entregue' && p.status !== 'entregue') {
             setTimeout(() => setShowRatingModal(true), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [p.id, p.status]);

  const steps = [
    { key: "confirmado", label: "Pedido confirmado", icon: CheckCircle2 },
    { key: "enviado", label: "Saiu para entrega", icon: Bike },
    { key: "a_caminho", label: "A caminho", icon: Truck }, // Virtual step for 'enviado' active state
    { key: "entregue", label: "Entregue", icon: Check },
  ];

  const getStepStatus = (stepKey: string) => {
    if (p.status === "cancelado") return "future";
    
    const statusMap: Record<string, number> = {
      novo: 0,
      confirmado: 1,
      enviado: 2,
      entregue: 4
    };

    const currentIdx = statusMap[p.status] || 0;
    
    if (stepKey === "confirmado") return currentIdx >= 1 ? "done" : "future";
    if (stepKey === "enviado") return currentIdx >= 2 ? "done" : "future";
    if (stepKey === "a_caminho") return currentIdx === 2 ? "active" : currentIdx > 2 ? "done" : "future";
    if (stepKey === "entregue") return currentIdx === 4 ? "done" : "future";
    
    return "future";
  };

  const handleConfirmReceipt = async () => {
    if (confirmCode.toUpperCase() !== p.codigo_confirmacao_recebimento) {
      toast.error("Código incorreto. Tente novamente.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("pedidos")
      .update({ 
        status: "entregue", 
        entregue_at: new Date().toISOString(),
        codigo_confirmacao_usado: true 
      })
      .eq("id", p.id);

    if (error) {
      toast.error("Erro ao confirmar recebimento.");
    } else {
      toast.success("Recebimento confirmado!");
      // Realtime will update the state
    }
    setLoading(false);
  };

  const handleUploadComprovante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const path = `${p.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('comprovantes').upload(path, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ comprovante_url: publicUrl })
        .eq('id', p.id);

      if (updateError) throw updateError;
      
      toast.success("Comprovante enviado com sucesso!");
      // Realtime update should catch the change, but let's be sure
      setPedido((prev: any) => ({ ...prev, comprovante_url: publicUrl }));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar o comprovante.");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado!");
  };

  const eta = p.saiu_entrega_at && p.tempo_estimado_minutos 
    ? format(addMinutes(new Date(p.saiu_entrega_at), p.tempo_estimado_minutos), "HH:mm")
    : null;

  return (
    <div className="space-y-0 pb-32">
      {/* Header Gradient */}
      <div className="pt-8 pb-16 px-6 -mx-6 rounded-b-[40px]" style={{ background: "linear-gradient(135deg, #1a0800, #2d1200)", boxShadow: "0 8px 32px rgba(255,101,0,0.18)" }}>
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full bg-surface/10 backdrop-blur-md flex items-center justify-center text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Acompanhar pedido</p>
            <h2 className="text-xl font-black text-white">{p.codigo}</h2>
          </div>
        </div>

        {p.status === 'enviado' && p.codigo_rastreio && (
          <div className="bg-surface/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Código de rastreio</p>
              <p className="text-sm font-mono font-bold text-white tracking-wider">{p.codigo_rastreio}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(p.codigo_rastreio || "")}
              className="h-10 w-10 rounded-xl bg-surface/10 flex items-center justify-center text-white"
            >
              <Copy size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Timeline Card */}
      <div className="px-6 -mt-10">
        <div className="bg-surface rounded-[24px] p-6 shadow-xl shadow-black/5 border border-surface-border">
          <div className="space-y-8">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.key);
              const isLast = idx === steps.length - 1;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {status === 'active' && (
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-ember/10 rounded-full"
                        />
                      )}
                      <div className={`
                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                        ${status === 'done' ? 'bg-ember text-white' : 
                          status === 'active' ? 'bg-surface border-2 border-ember' : 
                          'bg-surface-border text-dim'}
                      `}>
                        {status === 'active' ? (
                          <div className="w-2.5 h-2.5 bg-ember rounded-full" />
                        ) : (
                          <Icon size={14} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-10 my-1 rounded-full ${status === 'done' ? 'bg-ember' : 'bg-surface-border'}`} />
                    )}
                  </div>
                  <div className="pt-1.5 flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-bold tracking-tight ${status === 'future' ? 'text-dim' : 'text-text'}`}>
                        {step.label}
                      </p>
                      {status === 'done' && (
                        <span className="text-[10px] font-bold text-dim">
                          {p[`${step.key}_at`] ? format(new Date(p[`${step.key}_at`]), "HH:mm") : ""}
                        </span>
                      )}
                    </div>
                    {status === 'active' && step.key === 'a_caminho' && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-bold text-ember mt-1"
                      >
                        {eta ? `Previsão: ~${eta}` : "Chegando em breve"}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm Receipt Section */}
      <AnimatePresence>
        {p.status === 'enviado' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 mt-6"
          >
            <div className="bg-surface rounded-[24px] p-5 shadow-lg shadow-black/5 border border-surface-border space-y-4">
              <div>
                <h3 className="text-sm font-black text-text">Confirmar recebimento</h3>
                <p className="text-[11px] font-medium text-dim mt-0.5">
                  Digite o código de 6 letras que o motoboy vai mostrar
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dim">
                  <ShieldCheck size={20} />
                </div>
                <input 
                  type="text"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                  placeholder="Ex: AB3K7X"
                  className="w-full h-14 bg-surface-mid border border-surface-border rounded-2xl pl-12 pr-4 text-sm font-mono font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-ember/10 transition-all"
                />
              </div>

              <button 
                onClick={handleConfirmReceipt}
                disabled={loading || confirmCode.length < 6}
                className="w-full h-12 bg-ember text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-forest/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Processando..." : "Confirmar recebimento"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Comprovante / Pagamento Section */}
      <AnimatePresence>
        {p.status === 'confirmado' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 mt-6"
          >
            <div className="bg-surface rounded-[24px] p-5 shadow-lg shadow-black/5 border border-surface-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-ember/10 flex items-center justify-center text-ember shrink-0">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text">Pagamento do Pedido</h3>
                  <p className="text-[11px] font-medium text-dim mt-0.5">
                    Realize o pagamento para liberar o envio
                  </p>
                </div>
              </div>

              {p.fornecedor?.chave_pix && (
                <div className="bg-surface-mid rounded-xl p-4 border border-surface-border space-y-2">
                  <p className="text-[10px] font-bold text-dim uppercase tracking-widest">Chave PIX do Fornecedor</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono font-bold text-text truncate">{p.fornecedor.chave_pix}</p>
                    <button 
                      onClick={() => copyToClipboard(p.fornecedor.chave_pix)}
                      className="h-8 w-8 shrink-0 rounded-lg bg-surface flex items-center justify-center text-dim hover:text-ember transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}

              {p.fornecedor?.formas_pagamento?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-2">Opções aceitas</p>
                  <div className="flex flex-wrap gap-2">
                    {p.fornecedor.formas_pagamento.map((forma: string) => (
                      <span key={forma} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-mid border border-surface-border text-text">
                        {forma}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                {p.comprovante_url ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">Comprovante enviado</span>
                    </div>
                    <a href={p.comprovante_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold underline">Ver anexo</a>
                  </div>
                ) : (
                  <label className={`w-full h-12 flex items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${uploading ? 'bg-surface-border text-dim cursor-not-allowed' : 'bg-ember text-white shadow-lg shadow-ember/20 hover:scale-[1.02] active:scale-[0.98]'}`}>
                    <Upload size={16} />
                    {uploading ? "Enviando..." : "Enviar Comprovante"}
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={handleUploadComprovante} 
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Info */}
      <div className="px-6 mt-6 space-y-4">
        <div className="bg-surface rounded-[20px] p-4 border border-surface-border shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-surface-mid flex items-center justify-center text-dim shrink-0">
            <Package size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text truncate">
              {p.quantidade}x {TIPO_PRODUTO_LABEL[p.produto.tipo_produto]}
            </p>
            <p className="text-[11px] font-medium text-dim">Mounjaro {p.produto.dose_mg}mg</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-text">{formatBRL(p.preco_total)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-[20px] p-4 border border-surface-border shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-surface-mid flex items-center justify-center text-dim shrink-0">
            <MapPin size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-0.5">Endereço de entrega</p>
            <p className="text-[13px] font-bold text-text leading-snug">
              {p.endereco_entrega?.logradouro}, {p.endereco_entrega?.numero}
            </p>
            <p className="text-[11px] font-medium text-dim mt-0.5">
              {p.endereco_entrega?.bairro} · {p.endereco_entrega?.cidade}/{p.endereco_entrega?.estado}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <RatingModal 
            pedido={p} 
            onClose={() => setShowRatingModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RatingModal({ pedido, onClose }: { pedido: any; onClose: () => void }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotos(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 3));
    }
  };

  const handleEnviar = async () => {
    if (nota === 0) return toast.error("Selecione uma nota");
    setEnviando(true);

    try {
      const fotosUrls: string[] = [];
      
      // Upload photos if any
      for (const file of fotos) {
        const path = `${pedido.paciente_id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('avaliacoes-fotos').upload(path, file);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('avaliacoes-fotos').getPublicUrl(path);
          fotosUrls.push(publicUrl);
        }
      }

      // Insert rating
      const { error: ratingError } = await supabase.from('avaliacoes_produto').insert({
        pedido_id: pedido.id,
        paciente_id: pedido.paciente_id,
        fornecedor_id: pedido.fornecedor_id,
        produto_id: pedido.produto_id,
        nota,
        comentario,
        fotos_url: fotosUrls
      });

      if (ratingError) throw ratingError;

      // Update supplier average rating (normally handled by a trigger, but let's assume UI needs refetch or update)
      toast.success("Obrigado pela sua avaliação!");
      onClose();
    } catch (err) {
      toast.error("Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-surface rounded-[32px] p-8 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-dim"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}>
            <Star size={32} className="fill-current" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black text-text">Como foi sua experiência?</h3>
            <p className="text-xs text-dim">Conte sobre a entrega e o produto</p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setNota(s)}>
                <Star 
                  size={36} 
                  className={`${s <= nota ? 'text-amber-400 fill-amber-400' : 'text-surface-border'} transition-all`}
                />
              </button>
            ))}
          </div>

          <textarea 
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full bg-surface-mid border border-surface-border rounded-2xl p-4 text-sm text-text focus:outline-none min-h-[80px]"
            placeholder="O que você achou?"
          />

          {/* Photo upload */}
          <div className="grid grid-cols-3 gap-3">
             {fotos.map((f, i) => (
               <div key={i} className="aspect-square rounded-xl bg-surface-border overflow-hidden relative">
                 <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
               </div>
             ))}
             {fotos.length < 3 && (
               <label className="aspect-square rounded-xl border-2 border-dashed border-surface-border flex items-center justify-center text-dim cursor-pointer">
                 <Camera size={24} />
                 <input type="file" className="hidden" onChange={handlePhotoChange} multiple accept="image/*" />
               </label>
             )}
          </div>

          <button 
            onClick={handleEnviar}
            disabled={enviando || nota === 0}
            className="w-full h-14 bg-ember text-white rounded-full text-sm font-black uppercase tracking-widest shadow-lg shadow-forest/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
