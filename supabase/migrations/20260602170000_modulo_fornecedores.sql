-- Migration: 20260602170000_modulo_fornecedores.sql
-- Description: Add suppliers module tables, RLS policies, and triggers

-- Limpeza de tabelas conflitantes anteriores
DROP TABLE IF EXISTS avaliacoes_fornecedor;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS fornecedor_produtos;
DROP TABLE IF EXISTS fornecedores;

-- 1. fornecedores
CREATE TABLE fornecedores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    razao_social text NOT NULL,
    nome_fantasia text,
    cnpj text UNIQUE,
    email_contato text,
    telefone text,
    whatsapp text,
    endereco_logradouro text,
    endereco_cidade text,
    endereco_estado text CHECK (char_length(endereco_estado) = 2),
    endereco_cep text,
    tipo text CHECK (tipo IN ('farmacia', 'distribuidor', 'fabricante')),
    regioes_entrega text[], -- array de estados que atende, ex: ['MG','SP','RJ']
    prazo_entrega_dias int, -- prazo médio em dias úteis
    entrega_gratis_acima decimal, -- valor mínimo para frete grátis, null se não tem
    logo_url text,
    descricao text,
    status text CHECK (status IN ('pendente','ativo','suspenso')) DEFAULT 'pendente',
    avaliacao_media decimal DEFAULT 0,
    total_pedidos int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. fornecedor_produtos
CREATE TABLE IF NOT EXISTS fornecedor_produtos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id uuid REFERENCES fornecedores(id) ON DELETE CASCADE,
    tipo_produto text CHECK (tipo_produto IN ('ampola_avulsa', 'caixa')),
    dose_mg decimal NOT NULL, -- (2.5, 5, 7.5, 10, 12.5, 15)
    unidades_por_caixa int, -- null se ampola avulsa
    preco decimal NOT NULL,
    preco_promocional decimal, -- null se sem promoção
    estoque_disponivel int DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE, -- gerado automaticamente: MT-2024-00001
    paciente_id uuid REFERENCES auth.users(id),
    fornecedor_id uuid REFERENCES fornecedores(id),
    produto_id uuid REFERENCES fornecedor_produtos(id),
    quantidade int NOT NULL,
    preco_unitario decimal NOT NULL,
    preco_total decimal NOT NULL,
    status text CHECK (status IN ('novo','confirmado','enviado','entregue','cancelado')) DEFAULT 'novo',
    endereco_entrega jsonb, -- snapshot do endereço no momento do pedido
    codigo_rastreio text,
    observacoes_paciente text,
    observacoes_fornecedor text,
    cancelamento_motivo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. avaliacoes_fornecedor
CREATE TABLE IF NOT EXISTS avaliacoes_fornecedor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid REFERENCES pedidos(id) UNIQUE,
    paciente_id uuid REFERENCES auth.users(id),
    fornecedor_id uuid REFERENCES fornecedores(id),
    nota int CHECK (nota BETWEEN 1 AND 5),
    comentario text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedor_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_fornecedor ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS:

-- fornecedores: INSERT para authenticated, SELECT público (apenas ativos), UPDATE/DELETE apenas pelo próprio user_id
CREATE POLICY "Fornecedores são visíveis se ativos" ON fornecedores FOR SELECT USING (status = 'ativo');
CREATE POLICY "Authenticated users can create supplier profile" ON fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Suppliers can update their own profile" ON fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppliers can delete their own profile" ON fornecedores FOR DELETE USING (auth.uid() = user_id);

-- fornecedor_produtos: SELECT público (se fornecedor ativo), INSERT/UPDATE apenas pelo fornecedor dono
CREATE POLICY "Produtos visíveis de fornecedores ativos" ON fornecedor_produtos FOR SELECT USING (
    EXISTS (SELECT 1 FROM fornecedores WHERE id = fornecedor_produtos.fornecedor_id AND status = 'ativo')
);
CREATE POLICY "Suppliers can manage their own products" ON fornecedor_produtos FOR ALL USING (
    EXISTS (SELECT 1 FROM fornecedores WHERE id = fornecedor_produtos.fornecedor_id AND user_id = auth.uid())
);

-- pedidos: SELECT/UPDATE pelo paciente_id OU pelo fornecedor_id, INSERT pelo paciente
CREATE POLICY "Pedidos visíveis para paciente ou fornecedor" ON pedidos FOR SELECT USING (
    auth.uid() = paciente_id OR EXISTS (SELECT 1 FROM fornecedores WHERE id = pedidos.fornecedor_id AND user_id = auth.uid())
);
CREATE POLICY "Pacientes podem criar pedidos" ON pedidos FOR INSERT WITH CHECK (auth.uid() = paciente_id);
CREATE POLICY "Pacientes e fornecedores podem atualizar pedidos" ON pedidos FOR UPDATE USING (
    auth.uid() = paciente_id OR EXISTS (SELECT 1 FROM fornecedores WHERE id = pedidos.fornecedor_id AND user_id = auth.uid())
);

-- avaliacoes: SELECT público, INSERT pelo paciente do pedido
CREATE POLICY "Avaliações são públicas" ON avaliacoes_fornecedor FOR SELECT USING (true);
CREATE POLICY "Pacientes podem avaliar seus pedidos" ON avaliacoes_fornecedor FOR INSERT WITH CHECK (
    auth.uid() = paciente_id AND EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND paciente_id = auth.uid() AND status = 'entregue')
);

-- FUNÇÃO SQL — gerar código do pedido:
CREATE SEQUENCE IF NOT EXISTS pedido_seq START 1;

CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS trigger AS $$
BEGIN
  NEW.codigo := 'MT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('pedido_seq')::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_codigo_pedido 
BEFORE INSERT ON pedidos 
FOR EACH ROW 
EXECUTE FUNCTION gerar_codigo_pedido();

-- TRIGGER — atualizar updated_at em pedidos automaticamente:
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$ 
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_updated_at 
BEFORE UPDATE ON pedidos 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();
