-- Migration: 20260602200000_extended_supplier_schema.sql
-- Description: Add product photos, delivery options, status history, and receipt confirmation logic.

-- 1. Extend products
ALTER TABLE fornecedor_produtos
  ADD COLUMN foto_url text,
  ADD COLUMN foto_urls text[] DEFAULT '{}',
  ADD COLUMN descricao text;

-- 2. Extend suppliers
ALTER TABLE fornecedores
  ADD COLUMN oferece_frete_full boolean DEFAULT false,
  ADD COLUMN tempo_entrega_minutos int DEFAULT 60,
  ADD COLUMN taxa_motoboy decimal DEFAULT 0,
  ADD COLUMN aceita_cod boolean DEFAULT false,
  ADD COLUMN cod_taxa_percentual decimal DEFAULT 0;

-- 3. Extend orders
-- Note: codigo_rastreio already exists from previous migration
ALTER TABLE pedidos
  ADD COLUMN tipo_frete text CHECK (tipo_frete IN ('motoboy','padrao')) DEFAULT 'padrao',
  ADD COLUMN taxa_frete decimal DEFAULT 0,
  ADD COLUMN cash_on_delivery boolean DEFAULT false,
  ADD COLUMN codigo_confirmacao_recebimento text,
  ADD COLUMN codigo_confirmacao_usado boolean DEFAULT false,
  ADD COLUMN tempo_estimado_minutos int,
  ADD COLUMN saiu_entrega_at timestamptz,
  ADD COLUMN entregue_at timestamptz;

-- 4. Product Ratings
CREATE TABLE avaliacoes_produto (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) unique,
  paciente_id uuid references auth.users(id),
  fornecedor_id uuid references fornecedores(id),
  produto_id uuid references fornecedor_produtos(id),
  nota int CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  fotos_url text[] DEFAULT '{}',
  criado_em timestamptz DEFAULT now()
);

-- 5. Order Status History
CREATE TABLE historico_status_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id),
  status text not null,
  mensagem text,
  criado_em timestamptz DEFAULT now()
);

-- 6. Trigger for Receipt Confirmation Code and History
CREATE OR REPLACE FUNCTION gerar_codigo_confirmacao()
RETURNS trigger AS $$
BEGIN
  -- Generate code when status changes to 'enviado'
  IF NEW.status = 'enviado' AND OLD.status != 'enviado' THEN
    NEW.codigo_confirmacao_recebimento := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));
    NEW.saiu_entrega_at := now();
    INSERT INTO historico_status_pedido (pedido_id, status, mensagem)
    VALUES (NEW.id, 'enviado', 'Saiu para entrega. Código de recebimento gerado.');
  END IF;

  -- History for 'confirmado'
  IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
    INSERT INTO historico_status_pedido (pedido_id, status, mensagem)
    VALUES (NEW.id, 'confirmado', 'Pedido confirmado pelo fornecedor.');
  END IF;

  -- History and timestamp for 'entregue'
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    NEW.entregue_at := now();
    INSERT INTO historico_status_pedido (pedido_id, status, mensagem)
    VALUES (NEW.id, 'entregue', 'Pedido entregue com sucesso.');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedido_status_trigger
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION gerar_codigo_confirmacao();

-- 7. RLS Policies
ALTER TABLE avaliacoes_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliações de produto são visíveis de fornecedores ativos" ON avaliacoes_produto FOR SELECT USING (
    EXISTS (SELECT 1 FROM fornecedores WHERE id = avaliacoes_produto.fornecedor_id AND status = 'ativo')
);

CREATE POLICY "Pacientes podem avaliar seus produtos" ON avaliacoes_produto FOR INSERT WITH CHECK (
    auth.uid() = paciente_id AND EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND paciente_id = auth.uid() AND status = 'entregue')
);

CREATE POLICY "Histórico visível para paciente ou fornecedor" ON historico_status_pedido FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.id = historico_status_pedido.pedido_id
        AND (p.paciente_id = auth.uid() OR EXISTS (SELECT 1 FROM fornecedores f WHERE f.id = p.fornecedor_id AND f.user_id = auth.uid()))
    )
);
