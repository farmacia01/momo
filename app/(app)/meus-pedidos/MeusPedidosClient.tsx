"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ShoppingBag, 
  ChevronRight, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { 
  formatBRL, 
  nomeFornecedor, 
  iniciais, 
  STATUS_PEDIDO, 
  TIPO_PRODUTO_LABEL,
  type StatusPedido 
} from "@/lib/fornecedores";
import { motion } from "framer-motion";

interface PedidoComInfo {
  id: string;
  codigo: string | null;
  status: StatusPedido;
  preco_total: number;
  created_at: string;
  quantidade: number;
  codigo_rastreio: string | null;
  fornecedor: {
    razao_social: string;
    nome_fantasia: string | null;
    logo_url: string | null;
  } | null;
  produto: {
    tipo_produto: string;
    dose_mg: number;
    unidades_por_caixa: number | null;
  } | null;
}

export function MeusPedidosClient({ initialPedidos }: { initialPedidos: any[] }) {
  const [pedidos] = useState<PedidoComInfo[]>(initialPedidos);

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Meus Pedidos" />

      {pedidos.length === 0 ? (
        <div className="pt-10">
          <EmptyState 
            icon={<ShoppingBag size={48} />} 
            title="Nenhum pedido" 
            description="Você ainda não realizou nenhum pedido via plataforma." 
          />
          <div className="mt-8 flex justify-center">
            <Link 
              href="/estoque" 
              className="btn-primary"
            >
              Ir para o estoque
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p, idx) => (
            <PedidoCard key={p.id} pedido={p} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function PedidoCard({ pedido, index }: { pedido: PedidoComInfo, index: number }) {
  const status = STATUS_PEDIDO[pedido.status];
  const fornecedorNome = pedido.fornecedor ? nomeFornecedor(pedido.fornecedor) : "Fornecedor";
  
  const statusIcon = {
    novo: <Clock size={14} className="text-amber-600" />,
    confirmado: <CheckCircle2 size={14} className="text-blue-600" />,
    enviado: <Truck size={14} className="text-indigo-600" />,
    entregue: <CheckCircle2 size={14} className="text-green-600" />,
    cancelado: <XCircle size={14} className="text-red-600" />,
  }[pedido.status];

  const statusBg = {
    novo: "bg-amber-50",
    confirmado: "bg-blue-50",
    enviado: "bg-indigo-50",
    entregue: "bg-green-50",
    cancelado: "bg-red-50",
  }[pedido.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-[24px] shadow-premium overflow-hidden border-none"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {pedido.fornecedor?.logo_url ? (
              <img 
                src={pedido.fornecedor.logo_url} 
                alt={fornecedorNome} 
                className="w-10 h-10 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-ember font-bold text-xs">
                {iniciais(fornecedorNome)}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-text leading-tight">{fornecedorNome}</h3>
              <p className="text-[11px] font-bold text-dim mt-0.5">
                {format(parseISO(pedido.created_at), "d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBg}`}>
            {statusIcon}
            <span className={`text-[10px] font-black uppercase tracking-wider ${status.cls.split(' ')[1]}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-mid rounded-2xl p-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-ember shadow-sm">
            <Package size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text truncate">
              {pedido.quantidade}x {pedido.produto ? TIPO_PRODUTO_LABEL[pedido.produto.tipo_produto] : "Produto"}
            </p>
            <p className="text-[11px] font-medium text-dim">
              Dose: {pedido.produto?.dose_mg}mg {pedido.produto?.unidades_por_caixa ? `· ${pedido.produto.unidades_por_caixa}un` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-text">{formatBRL(pedido.preco_total)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] font-bold text-dim uppercase tracking-widest">
            Cod: <span className="text-gray-600">{pedido.codigo || "---"}</span>
          </div>
          <Link 
            href={`/meus-pedidos/${pedido.id}`}
            className="flex items-center gap-1 text-[11px] font-bold text-ember hover:underline"
          >
            Ver detalhes <ChevronRight size={12} strokeWidth={3} />
          </Link>
        </div>
      </div>
      
      {pedido.codigo_rastreio && pedido.status === "enviado" && (
        <div className="bg-ember px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Truck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Objeto postado</span>
          </div>
          <span className="text-[10px] font-black text-white/90 bg-surface/20 px-2 py-0.5 rounded-full">
            {pedido.codigo_rastreio}
          </span>
        </div>
      )}
    </motion.div>
  );
}
