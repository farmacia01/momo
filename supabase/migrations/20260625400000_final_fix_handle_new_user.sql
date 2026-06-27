-- Adiciona telefone caso a migração conflitante de 20260619100000_add_telefone_to_profiles tenha sido pulada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Substitui a trigger problemática por uma versão limpa e completa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    telefone,
    altura_cm,
    peso_inicial,
    peso_meta,
    dose_atual_mg,
    dia_aplicacao,
    data_inicio_tratamento
  ) VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'telefone',
    NULLIF(new.raw_user_meta_data->>'altura_cm', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'peso_inicial', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'peso_meta', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'dose_atual_mg', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'dia_aplicacao', '')::integer,
    NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', '')::date
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
