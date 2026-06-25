/** Shared types + helpers for the patient-side suppliers module. */

export interface Fornecedor {
  id: string;
  user_id: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  tipo: "farmacia" | "distribuidor" | "fabricante" | null;
  raio_entrega_km: number | null;
  cidades_entrega: string[] | null;
  prazo_entrega_dias: number | null;
  entrega_gratis_acima: number | null;
  logo_url: string | null;
  descricao: string | null;
  status: "pendente" | "ativo" | "suspenso";
  avaliacao_media: number | null;
  total_pedidos: number | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
}

export interface FornecedorProduto {
  id: string;
  fornecedor_id: string;
  tipo_produto: "ampola_avulsa" | "caixa";
  dose_mg: number;
  unidades_por_caixa: number | null;
  preco: number;
  preco_promocional: number | null;
  estoque_disponivel: number;
  ativo: boolean;
}

export type StatusPedido =
  | "novo"
  | "aguardando_pagamento"
  | "confirmado"
  | "enviado"
  | "entregue"
  | "cancelado";

export interface Pedido {
  id: string;
  codigo: string | null;
  paciente_id: string;
  fornecedor_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  status: StatusPedido;
  endereco_entrega: EnderecoEntrega | null;
  codigo_rastreio: string | null;
  observacoes_paciente: string | null;
  observacoes_fornecedor: string | null;
  cancelamento_motivo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Avaliacao {
  id: string;
  pedido_id: string;
  paciente_id: string;
  fornecedor_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
}

export interface EnderecoEntrega {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export const TIPO_FORNECEDOR_LABEL: Record<string, string> = {
  farmacia: "Farmácia",
  distribuidor: "Distribuidor",
  fabricante: "Fabricante",
};

export const TIPO_PRODUTO_LABEL: Record<string, string> = {
  ampola_avulsa: "Ampola avulsa",
  caixa: "Caixa",
};

export const STATUS_PEDIDO: Record<
  StatusPedido,
  { label: string; cls: string; animated?: boolean }
> = {
  novo: { label: "Novo", cls: "bg-amber-100 text-amber-700", animated: true },
  aguardando_pagamento: { label: "Aguard. Pgto", cls: "bg-orange-100 text-orange-700", animated: true },
  confirmado: {
    label: "Confirmado",
    cls: "bg-blue-100 text-blue-700",
    animated: true,
  },
  enviado: { label: "Enviado", cls: "bg-indigo-100 text-indigo-700" },
  entregue: { label: "Entregue", cls: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

export function formatBRL(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

export function nomeFornecedor(f: Pick<Fornecedor, "nome_fantasia" | "razao_social">): string {
  return f.nome_fantasia || f.razao_social || "Fornecedor";
}

export function iniciais(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "F";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The effective unit price (promotional when present). */
export function precoVigente(p: Pick<FornecedorProduto, "preco" | "preco_promocional">): number {
  return p.preco_promocional ?? p.preco;
}
