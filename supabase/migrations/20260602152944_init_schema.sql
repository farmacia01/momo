-- 1. profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    data_nascimento DATE,
    sexo TEXT,
    altura_cm DECIMAL,
    dose_atual_mg DECIMAL,
    data_inicio_tratamento DATE,
    medico_nome TEXT,
    farmacia_preferida TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile." ON profiles FOR ALL USING (auth.uid() = id);

-- 2. doses
CREATE TABLE doses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_aplicacao TIMESTAMP WITH TIME ZONE,
    dose_mg DECIMAL,
    lado_corpo TEXT CHECK (lado_corpo IN ('esquerdo','direito','abdomen')),
    local_aplicacao TEXT,
    observacoes TEXT,
    foto_url TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE doses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own doses." ON doses FOR ALL USING (auth.uid() = user_id);

-- 3. medicoes_saude
CREATE TABLE medicoes_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_medicao TIMESTAMP WITH TIME ZONE,
    peso_kg DECIMAL,
    imc DECIMAL,
    pressao_sistolica INT,
    pressao_diastolica INT,
    glicemia INT,
    circunferencia_abdominal_cm DECIMAL,
    humor TEXT CHECK (humor IN ('otimo','bom','regular','ruim')),
    energia TEXT CHECK (energia IN ('alta','media','baixa')),
    observacoes TEXT
);
ALTER TABLE medicoes_saude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own medicoes_saude." ON medicoes_saude FOR ALL USING (auth.uid() = user_id);

-- 4. sintomas
CREATE TABLE sintomas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data TIMESTAMP WITH TIME ZONE,
    tipo TEXT CHECK (tipo IN ('nausea','vomito','diarreia','constipacao','dor_cabeca','fadiga','tontura','outros')),
    intensidade INT CHECK (intensidade >= 1 AND intensidade <= 10),
    descricao TEXT,
    duracao_horas INT
);
ALTER TABLE sintomas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sintomas." ON sintomas FOR ALL USING (auth.uid() = user_id);

-- 5. planos_dieta
CREATE TABLE planos_dieta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fase_mounjaro INT,
    nome_plano TEXT,
    calorias_diarias INT,
    proteinas_g INT,
    carboidratos_g INT,
    gorduras_g INT,
    refeicoes JSONB,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE planos_dieta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own planos_dieta." ON planos_dieta FOR ALL USING (auth.uid() = user_id);

-- 6. refeicoes_registradas
CREATE TABLE refeicoes_registradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data TIMESTAMP WITH TIME ZONE,
    tipo TEXT CHECK (tipo IN ('cafe','almoco','jantar','lanche')),
    descricao TEXT,
    calorias_estimadas INT,
    proteinas_g INT,
    foto_url TEXT
);
ALTER TABLE refeicoes_registradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own refeicoes_registradas." ON refeicoes_registradas FOR ALL USING (auth.uid() = user_id);

-- 7. estoque_ampolas
CREATE TABLE estoque_ampolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dose_mg DECIMAL,
    quantidade INT,
    data_compra DATE,
    data_validade DATE,
    preco_unitario DECIMAL,
    farmacia TEXT,
    lote TEXT,
    observacoes TEXT
);
ALTER TABLE estoque_ampolas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own estoque_ampolas." ON estoque_ampolas FOR ALL USING (auth.uid() = user_id);

-- 8. alertas_estoque
CREATE TABLE alertas_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quantidade_minima INT DEFAULT 2,
    dias_antecedencia_notificacao INT DEFAULT 7,
    ativo BOOLEAN DEFAULT true
);
ALTER TABLE alertas_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own alertas_estoque." ON alertas_estoque FOR ALL USING (auth.uid() = user_id);

-- 9. push_subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push_subscriptions." ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- 10. configuracoes_notificacao
CREATE TABLE configuracoes_notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lembrete_dose BOOLEAN,
    dia_semana_dose INT CHECK (dia_semana_dose >= 0 AND dia_semana_dose <= 6),
    horario_dose TIME,
    alerta_estoque BOOLEAN,
    relatorio_semanal BOOLEAN,
    dicas_dieta BOOLEAN
);
ALTER TABLE configuracoes_notificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own configuracoes_notificacao." ON configuracoes_notificacao FOR ALL USING (auth.uid() = user_id);

-- Indexes for user_id and dates
CREATE INDEX profiles_id_idx ON profiles (id);
CREATE INDEX doses_user_id_idx ON doses (user_id);
CREATE INDEX doses_data_aplicacao_idx ON doses (data_aplicacao);
CREATE INDEX medicoes_saude_user_id_idx ON medicoes_saude (user_id);
CREATE INDEX medicoes_saude_data_medicao_idx ON medicoes_saude (data_medicao);
CREATE INDEX sintomas_user_id_idx ON sintomas (user_id);
CREATE INDEX sintomas_data_idx ON sintomas (data);
CREATE INDEX planos_dieta_user_id_idx ON planos_dieta (user_id);
CREATE INDEX refeicoes_registradas_user_id_idx ON refeicoes_registradas (user_id);
CREATE INDEX refeicoes_registradas_data_idx ON refeicoes_registradas (data);
CREATE INDEX estoque_ampolas_user_id_idx ON estoque_ampolas (user_id);
CREATE INDEX alertas_estoque_user_id_idx ON alertas_estoque (user_id);
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions (user_id);
CREATE INDEX configuracoes_notificacao_user_id_idx ON configuracoes_notificacao (user_id);

-- Function & Trigger for IMC calculation
CREATE OR REPLACE FUNCTION calcular_imc()
RETURNS TRIGGER AS $$
DECLARE
    v_altura_m DECIMAL;
BEGIN
    -- Busca a altura_cm do usuario em profiles
    SELECT altura_cm INTO v_altura_m FROM profiles WHERE id = NEW.user_id;
    
    -- Transforma cm em m para o calculo do IMC
    IF v_altura_m IS NOT NULL AND v_altura_m > 0 THEN
        v_altura_m := v_altura_m / 100.0;
        IF NEW.peso_kg IS NOT NULL THEN
            NEW.imc := ROUND((NEW.peso_kg / (v_altura_m * v_altura_m))::numeric, 2);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_calcular_imc
BEFORE INSERT OR UPDATE ON medicoes_saude
FOR EACH ROW
EXECUTE FUNCTION calcular_imc();