-- Migration: 20260602180000_profile_address_goals.sql
-- Description: Add address and health goals to profiles table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS peso_inicial DECIMAL,
  ADD COLUMN IF NOT EXISTS peso_meta DECIMAL,
  ADD COLUMN IF NOT EXISTS dia_aplicacao INT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS logradouro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;

-- Update trigger function to include these fields if present in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    data_nascimento,
    sexo,
    altura_cm,
    dose_atual_mg,
    data_inicio_tratamento,
    peso_inicial,
    peso_meta,
    dia_aplicacao,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome',
    NULLIF(new.raw_user_meta_data->>'data_nascimento', '')::date,
    new.raw_user_meta_data->>'sexo',
    NULLIF(new.raw_user_meta_data->>'altura_cm', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'dose_atual_mg', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', '')::date,
    NULLIF(new.raw_user_meta_data->>'peso_inicial', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'peso_meta', '')::decimal,
    NULLIF(new.raw_user_meta_data->>'dia_aplicacao', '')::int,
    new.raw_user_meta_data->>'cep',
    new.raw_user_meta_data->>'logradouro',
    new.raw_user_meta_data->>'numero',
    new.raw_user_meta_data->>'complemento',
    new.raw_user_meta_data->>'bairro',
    new.raw_user_meta_data->>'cidade',
    new.raw_user_meta_data->>'estado'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
