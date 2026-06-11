"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  ChevronRight, 
  Package, 
  Truck, 
  Check, 
  X, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpRight,
  Bike
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBRL, STATUS_PEDIDO, TIPO_PRODUTO_LABEL } from "@/lib/fornecedores";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  novo: "var(--color-ember)",
  confirmado: "var(--color-success)",
  enviado: "#60a5fa",
  entregue: "var(--color-text-dim)",
  pendente: "var(--color-warning)",
  cancelado: "var(--color-danger)",
};

export function PedidosFornecedorClient({ fornecedorId }: { fornecedorId: string }) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const [showAcceptModal, setShowAcceptModal] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState<any>(null);

  useEffect(() => {
    fetchPedidos();
    const channel = supabase
      .channel("pedidos-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos", filter: `fornecedor_id=eq.${fornecedorId}` },
        (payload) => {
          setPedidos((prev) => [payload.new, ...prev]);
          toast.custom((t) => (
            <div className={`${t.visible ? "animate-fade-up" : "animate-fade-out"} bg-surface border border-ember/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
              <div className="h-10 w-10 rounded-full bg-ember/10 flex items-center justify-center text-ember">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-text font-bold text-sm">Novo pedido!</p>
                <p className="text-muted text-xs">{payload.new.codigo}</p>
              </div>
            </div>
          ));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fornecedorId]);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, produto:fornecedor_produtos(tipo_produto, dose_mg)")
      .eq("fornecedor_id", fornecedorId)
      .order("created_at", { ascending: false });
    if (!error && data) setPedidos(data);
    setLoading(false);
  };

  const updateStatus = async (
    id: string,
    newStatus: string,
    extra: Record<string, any> = {},
    evento?: string
  ) => {
    setUpdating(true);
    const { data, error } = await supabase.rpc("atualizar_status_pedido_fornecedor", {
      p_pedido_id: id,
      p_status: newStatus,
      p_codigo_rastreio: extra.codigo_rastreio ?? null,
      p_cancelamento_motivo: extra.cancelamento_motivo ?? null,
    });
    if (!error && data) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      
      // Notify via specialized route
      if (evento) {
        try {
          const baseUrl = "https://momo-rust-nu.vercel.app";
          await fetch(`${baseUrl}/api/push/venda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              evento: evento,
              pedidoId: id,
            })
          });
        } catch (e) {
          console.error("[PushVenda] Error triggering status update push:", e);
        }
      }

      toast.success(`Pedido ${newStatus}!`);
      setShowAcceptModal(null);
      setShowRejectModal(null);
    } else {
      toast.error("Erro ao atualizar pedido.");
    }
    setUpdating(false);
  };

  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      const matchStatus = filterStatus === "todos" || p.status === filterStatus;
      const matchSearch = p.codigo.toLowerCase().includes(search.toLowerCase()) || 
                          (p.produto?.tipo_produto || "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [pedidos, filterStatus, search]);

  const counts = useMemo(
    () => ({
      todos: pedidos.length,
      novo: pedidos.filter((p) => p.status === "novo").length,
      confirmado: pedidos.filter((p) => p.status === "confirmado").length,
      enviado: pedidos.filter((p) => p.status === "enviado").length,
      entregue: pedidos.filter((p) => p.status === "entregue").length,
      cancelado: pedidos.filter((p) => p.status === "cancelado").length,
    }),
    [pedidos]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-[800] text-text tracking-[-0.5px]">Gestão de Pedidos</h2>
        <p className="text-[12px] font-medium text-muted mt-0.5">Gerencie suas vendas em tempo real</p>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-mid border border-surface-border rounded-[14px] flex items-center gap-[10px] px-[14px] py-[11px]">
        <Search size={16} className="text-text-dim" />
        <input 
          type="text"
          placeholder="Buscar código ou produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-[13px] text-text placeholder-text-dim w-full focus:outline-none"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex items-center gap-2 px-[12px] py-[8px] rounded-full text-[11px] font-[700] uppercase tracking-[0.3px] transition-all whitespace-nowrap ${
              filterStatus === status
                ? "bg-ember text-white shadow-ember"
                : "bg-surface text-muted border border-surface-border"
            }`}
          >
            {status}
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
              filterStatus === status ? "bg-black/20 text-white" : "bg-surface-mid text-text-dim"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="h-px w-full bg-surface-border" />

      {/* Orders List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredPedidos.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-surface rounded-[18px] border border-dashed border-surface-border"
            >
              <ShoppingBag className="mx-auto text-text-dim/50 mb-4" size={36} />
              <p className="text-text-dim text-[13px]">Nenhum pedido aqui</p>
            </motion.div>
          ) : (
            filteredPedidos.map((pedido, i) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAccept={() => setShowAcceptModal(pedido)}
                onReject={() => setShowRejectModal(pedido)}
                onUpdateStatus={updateStatus}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAcceptModal && (
          <AcceptDrawer 
            pedido={showAcceptModal} 
            onClose={() => setShowAcceptModal(null)} 
            onConfirm={(date: string) =>
              updateStatus(
                showAcceptModal.id,
                "confirmado",
                { previsao_entrega: date },
                "PEDIDO_ACEITO"
              )
            }
            loading={updating}
          />
        )}
        {showRejectModal && (
          <RejectDrawer 
            pedido={showRejectModal} 
            onClose={() => setShowRejectModal(null)} 
            onConfirm={(reason: string) =>
              updateStatus(
                showRejectModal.id,
                "cancelado",
                { cancelamento_motivo: reason },
                "PEDIDO_RECUSADO"
              )
            }
            loading={updating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PedidoCard({ pedido, onAccept, onReject, onUpdateStatus }: { pedido: any, onAccept: () => void, onReject: () => void, onUpdateStatus: (id: string, s: string, extra?: any, evento?: string) => void }) {
  const statusColor = STATUS_COLORS[pedido.status] || "var(--color-text)";
  const status = STATUS_PEDIDO[pedido.status as keyof typeof STATUS_PEDIDO];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface border border-surface-border rounded-[16px] p-[14px] relative overflow-hidden shadow-card"
    >
      {/* Lateral Status Bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px]" 
        style={{ backgroundColor: statusColor }}
      />

      <div className="space-y-3 pl-1">
        {/* ROW 1: Código + Valor */}
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-text">{pedido.codigo}</h3>
          <p className="text-[15px] font-[800] text-text">{formatBRL(pedido.preco_total)}</p>
        </div>

        {/* ROW 2: Descrição */}
        <p className="text-[11px] font-medium text-muted">
          Mounjaro {pedido.dose_mg || pedido.produto?.dose_mg}mg · {pedido.produto ? TIPO_PRODUTO_LABEL[pedido.produto.tipo_produto] : "Produto"} × {pedido.quantidade}
        </p>

        {/* ROW 3: Status + Data */}
        <div className="flex items-center justify-between">
          <div 
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${statusColor}1A`, color: statusColor }}
          >
            {status?.label || pedido.status}
          </div>
          <p className="text-[10px] font-medium text-text-dim flex items-center gap-1">
            <Clock size={10} />
            {formatDistanceToNow(new Date(pedido.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>

        {/* ACTIONS */}
        {pedido.status === "novo" && (
          <div className="flex gap-2 mt-[10px]">
            <button 
              onClick={onAccept}
              className="flex-1 h-[38px] rounded-[10px] text-[12px] font-[700] flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-white" style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
            >
              <Check size={13} strokeWidth={3} /> Aceitar
            </button>
            <button 
              onClick={onReject}
              className="flex-1 h-[38px] bg-danger/10 border border-danger/20 text-danger rounded-[10px] text-[12px] font-[700] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <X size={13} strokeWidth={3} /> Recusar
            </button>
          </div>
        )}

        {pedido.status === "confirmado" && (
          <button 
            onClick={() => {
              const track = prompt("Código de rastreio (opcional):");
              onUpdateStatus(
                pedido.id,
                "enviado",
                track ? { codigo_rastreio: track } : {},
                "MOTOBOY_SAIU"
              );
            }}
            className="w-full h-[38px] bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-[10px] text-[11px] font-[700] flex items-center justify-center gap-2"
          >
            <Truck size={14} /> MARCAR COMO ENVIADO
          </button>
        )}

        {pedido.status !== "novo" && pedido.status !== "confirmado" && (
           <Link 
             href={`/fornecedor/pedidos/${pedido.id}`}
             className="w-full h-[38px] bg-surface-mid text-muted rounded-[10px] text-[10px] font-[700] uppercase tracking-widest flex items-center justify-center gap-2"
           >
             Ver detalhes <ArrowUpRight size={12} />
           </Link>
        )}
      </div>
    </motion.div>
  );
}

function AcceptDrawer({ pedido, onClose, onConfirm, loading }: { pedido: any, onClose: () => void, onConfirm: (d: string) => void, loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
        className="relative w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] border border-surface-border p-6 pb-10 sm:pb-8 shadow-2xl overflow-hidden"
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-6 sm:hidden bg-surface-border" />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-display font-black text-text">Aceitar Pedido</h3>
            <p className="text-[13px] text-muted">
              {pedido.codigo} · {formatBRL(pedido.preco_total)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 rounded-full flex items-center justify-center bg-surface-mid text-text-dim transition-transform active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.1em] ml-1">Previsão de entrega</label>
            <div className="relative">
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-14 bg-surface-mid border border-surface-border rounded-2xl px-5 text-text font-bold focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all appearance-none"
              />
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-text-dim rotate-90" size={18} />
            </div>
          </div>

          <button 
            onClick={() => onConfirm(date)}
            disabled={loading}
            className="w-full h-14 rounded-full font-bold text-[16px] text-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2" 
            style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
          >
            {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} strokeWidth={3} /> Confirmar aceite</>}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function RejectDrawer({ pedido, onClose, onConfirm, loading }: { pedido: any, onClose: () => void, onConfirm: (r: string) => void, loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("Sem estoque");
  const [other, setOther] = useState("");

  const reasons = ["Sem estoque", "Fora da área", "Produto descontinuado", "Outro"];

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
        className="relative w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] border border-surface-border p-6 pb-10 sm:pb-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-6 sm:hidden bg-surface-border" />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-display font-black text-text">Recusar pedido</h3>
            <p className="text-[13px] text-muted">{pedido.codigo}</p>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 rounded-full flex items-center justify-center bg-surface-mid text-text-dim transition-transform active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.1em] ml-1">Motivo da recusa</label>
            <div className="grid grid-cols-1 gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full h-14 rounded-2xl px-5 text-left text-[14px] font-bold transition-all border ${
                    reason === r 
                      ? "bg-danger/5 text-danger border-danger/30 ring-4 ring-danger/5" 
                      : "bg-surface-mid text-muted border-transparent hover:border-surface-border"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === "Outro" && (
            <textarea
              placeholder="Descreva o motivo detalhadamente..."
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="w-full bg-surface-mid border border-surface-border rounded-2xl p-5 text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-danger/20 transition-all min-h-[100px] resize-none"
            />
          )}

          <button 
            onClick={() => onConfirm(reason === "Outro" ? other : reason)}
            disabled={loading || (reason === "Outro" && !other.trim())}
            className="w-full h-14 bg-danger/10 border border-danger/20 text-danger rounded-full font-black text-[16px] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="h-5 w-5 border-2 border-danger/30 border-t-danger rounded-full animate-spin" /> : <><X size={18} strokeWidth={3} /> Confirmar recusa</>}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
