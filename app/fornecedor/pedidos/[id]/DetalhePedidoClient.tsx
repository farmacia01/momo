"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle2, 
  MessageSquare,
  ChevronLeft,
  ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { m  } from 'framer-motion';
import { formatBRL } from "@/lib/fornecedores";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  { status: "novo", label: "Recebido", icon: Clock },
  { status: "confirmado", label: "Confirmado", icon: CheckCircle2 },
  { status: "enviado", label: "Enviado", icon: Truck },
  { status: "entregue", label: "Entregue", icon: Package },
];

export function DetalhePedidoClient({ initialPedido, isFornecedor }: { initialPedido: any; isFornecedor: boolean }) {
  const [pedido, setPedido] = useState<any>(initialPedido);
  const [loading, setLoading] = useState(false);
  const [obsFornecedor, setObsFornecedor] = useState(pedido.observacoes_fornecedor || "");
  const router = useRouter();

  const updateStatus = async (newStatus: string, extraData: Record<string, any> = {}) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("atualizar_status_pedido_fornecedor", {
      p_pedido_id: pedido.id,
      p_status: newStatus,
      p_codigo_rastreio: extraData.codigo_rastreio ?? null,
      p_cancelamento_motivo: extraData.cancelamento_motivo ?? null,
    });
    if (!error && data) {
      setPedido({ ...pedido, ...data });
      toast.success(`Pedido ${newStatus}!`);
    } else {
      toast.error("Erro ao atualizar pedido.");
    }
    setLoading(false);
  };

  const handleSaveObs = async () => {
    const { error } = await supabase
      .from("pedidos")
      .update({ observacoes_fornecedor: obsFornecedor })
      .eq("id", pedido.id);
    if (!error) toast.success("Observação salva!");
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full bg-[#111111] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{pedido.codigo}</h2>
          <p className="text-[11px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-widest">Detalhes do Pedido</p>
        </div>
      </div>

      {/* Status Stepper */}
      <m.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="f-card p-6 overflow-x-auto scrollbar-hide"
      >
        <div className="flex justify-between min-w-[350px]">
          {STATUS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const stepIdx = STATUS_STEPS.findIndex((s) => s.status === pedido.status);
            const isCompleted = stepIdx >= idx;
            const isCurrent = pedido.status === step.status;
            
            return (
              <div key={step.status} className="flex flex-col items-center flex-1 relative">
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`absolute left-1/2 right-[-50%] top-4 h-[2px] ${isCompleted ? "bg-[#4ade80]" : "bg-[rgba(255,255,255,0.05)]"}`} />
                )}
                <div
                  className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? "bg-[#4ade80] text-[#052e16]" : "bg-[#1a1a1a] text-[rgba(255,255,255,0.2)]"
                  } ${isCurrent ? "ring-4 ring-[#4ade80]/20" : ""}`}
                >
                  <Icon size={16} strokeWidth={isCurrent ? 3 : 2} />
                </div>
                <span className={`mt-2 text-[9px] font-black uppercase tracking-wider ${isCompleted ? "text-[#4ade80]" : "text-[rgba(255,255,255,0.2)]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </m.div>

      <div className="space-y-4">
        {/* Item details */}
        <m.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="f-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#4ade80]" />
            <h4 className="text-[11px] font-black text-[rgba(255,255,255,0.28)] uppercase tracking-widest">Produto e Valor</h4>
          </div>
          
          <div className="flex items-center justify-between bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-4 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-white">Mounjaro {pedido.produto?.dose_mg}mg</p>
              <p className="text-[11px] font-medium text-[rgba(255,255,255,0.28)] mt-0.5 capitalize">
                {pedido.produto?.tipo_produto.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#4ade80]">×{pedido.quantidade}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-[13px] font-bold text-[rgba(255,255,255,0.4)]">Total recebido</span>
            <span className="text-xl font-black text-white">{formatBRL(pedido.preco_total)}</span>
          </div>
        </m.div>

        {/* Address */}
        <m.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="f-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#4ade80]" />
            <h4 className="text-[11px] font-black text-[rgba(255,255,255,0.28)] uppercase tracking-widest">Destino da Entrega</h4>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">{pedido.endereco_entrega?.logradouro}</p>
            <p className="text-[11px] font-medium text-[rgba(255,255,255,0.4)] leading-relaxed">
              {pedido.endereco_entrega?.cidade}, {pedido.endereco_entrega?.estado} · {pedido.endereco_entrega?.cep}
            </p>
          </div>

          {pedido.codigo_rastreio && (
            <div className="bg-[#60a5fa]/10 border border-[#60a5fa]/20 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-[#60a5fa] uppercase tracking-widest mb-0.5">Código de Rastreio</p>
                <p className="text-sm font-bold text-white tracking-wider">{pedido.codigo_rastreio}</p>
              </div>
              <Truck size={20} className="text-[#60a5fa]" />
            </div>
          )}
        </m.div>

        {/* Observations */}
        <m.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="f-card p-5 space-y-5"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#4ade80]" />
            <h4 className="text-[11px] font-black text-[rgba(255,255,255,0.28)] uppercase tracking-widest">Observações</h4>
          </div>

          {pedido.observacoes_paciente && (
            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[rgba(255,255,255,0.05)]">
              <p className="text-[9px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-2">Mensagem do Paciente</p>
              <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">{pedido.observacoes_paciente}</p>
            </div>
          )}

          {isFornecedor ? (
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest ml-1">Nota para o Paciente</label>
              <textarea
                value={obsFornecedor}
                onChange={(e) => setObsFornecedor(e.target.value)}
                className="w-full bg-[#111111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#4ade80]/30 min-h-[100px] transition-colors"
                placeholder="Ex: Pedido será postado amanhã pela manhã..."
              />
              <button 
                onClick={handleSaveObs} 
                className="w-full h-11 bg-[rgba(255,255,255,0.03)] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all"
              >
                Salvar Nota
              </button>
            </div>
          ) : (
            pedido.observacoes_fornecedor && (
              <div className="bg-[#4ade80]/5 p-4 rounded-2xl border border-[#4ade80]/10">
                <p className="text-[9px] font-black text-[#4ade80] uppercase tracking-widest mb-2">Mensagem do Fornecedor</p>
                <p className="text-sm text-[#4ade80]/80 leading-relaxed">{pedido.observacoes_fornecedor}</p>
              </div>
            )
          )}
        </m.div>
      </div>

      {/* Action floating bar */}
      {isFornecedor && pedido.status !== "entregue" && pedido.status !== "cancelado" && (
        <div className="fixed bottom-[90px] left-6 right-6 z-40">
          <m.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-[#111111] border border-[rgba(255,255,255,0.1)] p-4 rounded-3xl shadow-2xl flex gap-3"
          >
            {pedido.status === "novo" && (
              <>
                <button
                  onClick={() => updateStatus("confirmado")}
                  disabled={loading}
                  className="flex-1 h-12 bg-[#4ade80] text-[#052e16] rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                >
                  ACEITAR PEDIDO
                </button>
                <button
                  onClick={() => updateStatus("cancelado")}
                  disabled={loading}
                  className="px-6 h-12 bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20 rounded-2xl text-xs font-bold"
                >
                  RECUSAR
                </button>
              </>
            )}
            {pedido.status === "confirmado" && (
              <button
                onClick={() => {
                  const track = prompt("Código de rastreio (opcional):");
                  updateStatus("enviado", track ? { codigo_rastreio: track } : {});
                }}
                disabled={loading}
                className="flex-1 h-12 bg-[#60a5fa] text-[#082f49] rounded-2xl text-xs font-bold active:scale-95 transition-transform"
              >
                MARCAR COMO ENVIADO
              </button>
            )}
            {pedido.status === "enviado" && (
              <button
                onClick={() => updateStatus("entregue")}
                disabled={loading}
                className="flex-1 h-12 bg-white text-black rounded-2xl text-xs font-bold active:scale-95 transition-transform"
              >
                CONFIRMAR ENTREGA
              </button>
            )}
          </m.div>
        </div>
      )}
    </div>
  );
}
