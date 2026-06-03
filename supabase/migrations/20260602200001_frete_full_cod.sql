-- Migration: 20260602200000_frete_full_cod.sql
-- Description: Frete Full (motoboy) + Cash on Delivery (COD) para fornecedores
-- e pedidos, além do código de confirmação de recebimento.

-- Configurações do fornecedor
ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS frete_full_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frete_full_taxa decimal DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS frete_full_tempo text DEFAULT '1h',
  ADD COLUMN IF NOT EXISTS cod_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_taxa_adicional_ativa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_taxa_adicional_pct decimal;

-- Dados no pedido
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS is_cod boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_taxa_adicional_pct decimal,
  ADD COLUMN IF NOT EXISTS codigo_confirmacao_recebimento text,
  ADD COLUMN IF NOT EXISTS entregue_at timestamptz;
