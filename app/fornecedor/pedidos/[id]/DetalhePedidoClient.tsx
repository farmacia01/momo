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
import { motion } from "framer-motion";
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

  const STATUS_EVENTO: Record<string, string> = {
    confirmado: "PEDIDO_ACEITO",
    cancelado:  "PEDIDO_RECUSADO",
    enviado:    "MOTOBOY_SAIU",
    entregue:   "ENTREGA_CONFIRMADA",
  };

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
      toast.success(
        newStatus === "confirmado" ? "Pedido aceito! Cliente notificado." :
        newStatus === "enviado"    ? "Pedido marcado como enviado!" :
        newStatus === "entregue"   ? "Entrega confirmada!" :
        "Pedido atualizado."
      );

      // Notifica o paciente sobre a mudança de status
      const evento = STATUS_EVENTO[newStatus];
      if (evento) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
        fetch(`${baseUrl}/api/push/venda`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evento, pedidoId: pedido.id }),
        }).catch(() => {});
      }
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
          className="h-10 w-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-text tracking-tight">{pedido.codigo}</h2>
          <p className="text-[11px] font-bold text-text-dim uppercase tracking-widest">Detalhes do Pedido</p>
        </div>
      </div>

      {/* Status Stepper */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="f-card p-6 overflow-x-auto scrollbar-hide shadow-card"
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
                  <div className={`absolute left-1/2 right-[-50%] top-4 h-[2px] ${isCompleted ? "bg-ember" : "bg-surface-border"}`} />
                )}
                <div
                  className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? "text-white" : "bg-surface-mid text-text-dim"
                  } ${isCurrent ? "ring-4 ring-ember/20" : ""}`}
                  style={isCompleted ? { background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))" } : {}}
                >
                  <Icon size={16} strokeWidth={isCurrent ? 3 : 2} />
                </div>
                <span className={`mt-2 text-[9px] font-black uppercase tracking-wider ${isCompleted ? "text-ember" : "text-text-dim"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="space-y-4">
        {/* Item details */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="f-card p-5 space-y-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-ember" />
            <h4 className="text-[11px] font-black text-text-dim uppercase tracking-widest">Produto e Valor</h4>
          </div>
          
          <div className="flex items-center justify-between bg-surface-mid border border-surface-border p-4 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-text">Mounjaro {pedido.produto?.dose_mg}mg</p>
              <p className="text-[11px] font-medium text-text-dim mt-0.5 capitalize">
                {pedido.produto?.tipo_produto.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-text">×{pedido.quantidade}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-[13px] font-bold text-muted">Total recebido</span>
            <span className="text-xl font-black text-text">{formatBRL(pedido.preco_total)}</span>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="f-card p-5 space-y-4 shadow-card"
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-ember" />
            <h4 className="text-[11px] font-black text-text-dim uppercase tracking-widest">Destino da Entrega</h4>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-text">{pedido.endereco_entrega?.logradouro}</p>
            <p className="text-[11px] font-medium text-text-dim leading-relaxed">
              {pedido.endereco_entrega?.cidade}, {pedido.endereco_entrega?.estado} · {pedido.endereco_entrega?.cep}
            </p>
          </div>

          {pedido.codigo_rastreio && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Código de Rastreio</p>
                <p className="text-sm font-bold text-text tracking-wider">{pedido.codigo_rastreio}</p>
              </div>
              <Truck size={20} className="text-blue-500" />
            </div>
          )}
        </motion.div>

        {/* Observations */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="f-card p-5 space-y-5 shadow-card"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-ember" />
            <h4 className="text-[11px] font-black text-text-dim uppercase tracking-widest">Observações</h4>
          </div>

          {pedido.observacoes_paciente && (
            <div className="bg-surface-mid p-4 rounded-2xl border border-surface-border">
              <p className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-2">Mensagem do Paciente</p>
              <p className="text-sm text-text leading-relaxed">{pedido.observacoes_paciente}</p>
            </div>
          )}

          {isFornecedor ? (
            <div className="space-y-3">
              <label className="text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">Nota para o Paciente</label>
              <textarea
                value={obsFornecedor}
                onChange={(e) => setObsFornecedor(e.target.value)}
                className="w-full bg-surface-mid border border-surface-border rounded-2xl p-4 text-sm text-text focus:outline-none min-h-[100px] transition-colors focus:border-ember/30"
                placeholder="Ex: Pedido será postado amanhã pela manhã..."
              />
              <button 
                onClick={handleSaveObs} 
                className="w-full h-11 bg-surface-mid text-text text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-surface-hover transition-all border border-surface-border"
              >
                Salvar Nota
              </button>
            </div>
          ) : (
            pedido.observacoes_fornecedor && (
              <div className="p-4 rounded-2xl bg-ember/5 border border-ember/15">
                <p className="text-[9px] font-black text-ember uppercase tracking-widest mb-2">Mensagem do Fornecedor</p>
                <p className="text-sm leading-relaxed text-ember opacity-90">{pedido.observacoes_fornecedor}</p>
              </div>
            )
          )}
        </motion.div>
      </div>

      {/* Action floating bar */}
      {isFornecedor && pedido.status !== "entregue" && pedido.status !== "cancelado" && (
        <div className="fixed bottom-[90px] left-6 right-6 z-40">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-surface border border-surface-border p-4 rounded-3xl shadow-float flex gap-3"
          >
            {pedido.status === "novo" && (
              <>
                <button
                  onClick={() => updateStatus("confirmado")}
                  disabled={loading}
                  className="flex-1 h-12 text-white rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
                >
                  ACEITAR PEDIDO
                </button>
                <button
                  onClick={() => updateStatus("cancelado")}
                  disabled={loading}
                  className="px-6 h-12 bg-danger/10 text-danger border border-danger/20 rounded-2xl text-xs font-bold"
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
                className="flex-1 h-12 rounded-2xl text-xs font-bold active:scale-95 transition-transform text-blue-500 bg-blue-500/10 border border-blue-500/20"
              >
                MARCAR COMO ENVIADO
              </button>
            )}
            {pedido.status === "enviado" && (
              <button
                onClick={() => updateStatus("entregue")}
                disabled={loading}
                className="flex-1 h-12 text-white rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
              >
                CONFIRMAR ENTREGA
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
