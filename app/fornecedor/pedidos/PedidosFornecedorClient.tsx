"use client";

import { useEffect, useState, useMemo } from "react";
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
import { sendPush, pedidoNotificacoes } from "@/lib/notifications";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  novo: "#60a5fa",
  confirmado: "#4ade80",
  enviado: "#4ade80",
  entregue: "rgba(255,255,255,0.15)",
  pendente: "#fbbf24",
  cancelado: "#f87171",
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
            <div className={`${t.visible ? "animate-fade-up" : "animate-fade-out"} bg-[#111111] border border-[#4ade80]/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
              <div className="h-10 w-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Novo pedido!</p>
                <p className="text-[rgba(255,255,255,0.4)] text-xs">{payload.new.codigo}</p>
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
    notify?: { userId?: string | null; payload?: Parameters<typeof sendPush>[1] }
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
      if (notify?.userId && notify.payload) {
        await sendPush(notify.userId, notify.payload);
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
        <h2 className="text-[22px] font-[800] text-white tracking-[-0.5px]">Gestão de Pedidos</h2>
        <p className="text-[12px] font-medium text-[rgba(255,255,255,0.3)] mt-0.5">Gerencie suas vendas em tempo real</p>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[14px] flex items-center gap-[10px] px-[14px] py-[11px]">
        <Search size={16} className="text-[rgba(255,255,255,0.25)]" />
        <input 
          type="text"
          placeholder="Buscar código ou produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-[13px] text-white placeholder-[rgba(255,255,255,0.25)] w-full focus:outline-none"
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
                ? "bg-[#4ade80] text-[#052e16]" 
                : "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.06)]"
            }`}
          >
            {status}
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
              filterStatus === status ? "bg-black/10 text-[#052e16]" : "bg-white/5 text-[rgba(255,255,255,0.2)]"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="h-[1px] w-full bg-[rgba(255,255,255,0.05)]" />

      {/* Orders List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredPedidos.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-[#111] rounded-[18px] border border-dashed border-[rgba(255,255,255,0.08)]"
            >
              <ShoppingBag className="mx-auto text-[rgba(255,255,255,0.1)] mb-4" size={36} />
              <p className="text-[rgba(255,255,255,0.2)] text-[13px]">Nenhum pedido aqui</p>
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
                {},
                showAcceptModal.paciente_id
                  ? {
                      userId: showAcceptModal.paciente_id,
                      payload: pedidoNotificacoes.aceito(
                        showAcceptModal.codigo || "Pedido",
                        format(new Date(date), "dd/MM/yyyy"),
                      ),
                    }
                  : undefined,
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
                showRejectModal.paciente_id
                  ? {
                      userId: showRejectModal.paciente_id,
                      payload: pedidoNotificacoes.cancelado(
                        showRejectModal.codigo || "Pedido",
                        reason,
                      ),
                    }
                  : undefined,
              )
            }
            loading={updating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PedidoCard({ pedido, onAccept, onReject, onUpdateStatus }: { pedido: any, onAccept: () => void, onReject: () => void, onUpdateStatus: (id: string, s: string, extra?: any, notify?: { userId?: string | null; payload?: Parameters<typeof sendPush>[1] }) => void }) {
  const statusColor = STATUS_COLORS[pedido.status] || "#fff";
  const status = STATUS_PEDIDO[pedido.status as keyof typeof STATUS_PEDIDO];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-[14px] relative overflow-hidden"
    >
      {/* Lateral Status Bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px]" 
        style={{ backgroundColor: statusColor }}
      />

      <div className="space-y-3 pl-1">
        {/* ROW 1: Código + Valor */}
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-white">{pedido.codigo}</h3>
          <p className="text-[15px] font-[800] text-white">{formatBRL(pedido.preco_total)}</p>
        </div>

        {/* ROW 2: Descrição */}
        <p className="text-[11px] font-medium text-[rgba(255,255,255,0.4)]">
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
          <p className="text-[10px] font-medium text-[rgba(255,255,255,0.25)] flex items-center gap-1">
            <Clock size={10} />
            {formatDistanceToNow(new Date(pedido.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>

        {/* ACTIONS */}
        {pedido.status === "novo" && (
          <div className="flex gap-2 mt-[10px]">
            <button 
              onClick={onAccept}
              className="flex-1 h-[38px] bg-[#4ade80] text-[#052e16] rounded-[10px] text-[12px] font-[700] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Check size={13} strokeWidth={3} /> Aceitar
            </button>
            <button 
              onClick={onReject}
              className="flex-1 h-[38px] bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] rounded-[10px] text-[12px] font-[700] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
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
                pedido.paciente_id
                  ? {
                      userId: pedido.paciente_id,
                      payload: pedidoNotificacoes.enviado(
                        pedido.codigo || "Pedido",
                        track || "sem código de rastreio",
                      ),
                    }
                  : undefined,
              );
            }}
            className="w-full h-[38px] bg-[rgba(96,165,250,0.1)] border border-[rgba(96,165,250,0.2)] text-[#60a5fa] rounded-[10px] text-[11px] font-[700] flex items-center justify-center gap-2"
          >
            <Truck size={14} /> MARCAR COMO ENVIADO
          </button>
        )}

        {pedido.status !== "novo" && pedido.status !== "confirmado" && (
           <Link 
             href={`/fornecedor/pedidos/${pedido.id}`}
             className="w-full h-[38px] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.3)] rounded-[10px] text-[10px] font-[700] uppercase tracking-widest flex items-center justify-center gap-2"
           >
             Ver detalhes <ArrowUpRight size={12} />
           </Link>
        )}
      </div>
    </motion.div>
  );
}

function AcceptDrawer({ pedido, onClose, onConfirm, loading }: { pedido: any, onClose: () => void, onConfirm: (d: string) => void, loading: boolean }) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#111] rounded-t-[24px] border-t border-[rgba(255,255,255,0.08)] p-6 pb-12"
      >
        <div className="w-[40px] h-[4px] bg-[rgba(255,255,255,0.1)] rounded-full mx-auto mb-6" />
        
        <h3 className="text-[18px] font-bold text-white mb-2">Confirmar pedido</h3>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
          {pedido.codigo} · {formatBRL(pedido.preco_total)}
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-bold text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-2 block">Previsão de entrega</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-14 bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] rounded-[16px] px-4 text-white focus:outline-none focus:border-[#4ade80]/30"
            />
          </div>

          <button 
            onClick={() => onConfirm(date)}
            disabled={loading}
            className="w-full h-[52px] bg-[#4ade80] text-[#052e16] rounded-full font-[700] text-[15px] shadow-lg shadow-[#4ade80]/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Processando..." : "Confirmar aceite"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RejectDrawer({ pedido, onClose, onConfirm, loading }: { pedido: any, onClose: () => void, onConfirm: (r: string) => void, loading: boolean }) {
  const [reason, setReason] = useState("Sem estoque");
  const [other, setOther] = useState("");

  const reasons = ["Sem estoque", "Fora da área", "Produto descontinuado", "Outro"];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#111] rounded-t-[24px] border-t border-[rgba(255,255,255,0.08)] p-6 pb-12"
      >
        <div className="w-[40px] h-[4px] bg-[rgba(255,255,255,0.1)] rounded-full mx-auto mb-6" />
        
        <h3 className="text-[18px] font-bold text-white mb-6">Recusar pedido</h3>

        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-bold text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-3 block">Motivo da recusa</label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full h-12 rounded-[14px] px-4 text-left text-[13px] font-medium transition-all ${
                    reason === r 
                      ? "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20" 
                      : "bg-[#1a1a1a] text-[rgba(255,255,255,0.4)] border border-transparent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === "Outro" && (
            <textarea
              placeholder="Descreva o motivo..."
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] rounded-[16px] p-4 text-white text-[13px] focus:outline-none min-h-[80px]"
            />
          )}

          <button 
            onClick={() => onConfirm(reason === "Outro" ? other : reason)}
            disabled={loading}
            className="w-full h-[52px] bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] rounded-full font-[700] text-[15px] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Processando..." : "Confirmar recusa"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
