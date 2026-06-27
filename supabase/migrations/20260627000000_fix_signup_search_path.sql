-- Fix for GoTrue 500 error during signup
-- Ensures that when GoTrue calls these functions via the trigger, it uses the correct search_path
-- rather than failing to find functions/tables.

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = NEW.referral_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, nome, telefone,
    altura_cm, peso_inicial, peso_meta,
    dose_atual_mg, dia_aplicacao, data_inicio_tratamento
  ) VALUES (
    new.id, new.email,
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'telefone',
    NULLIF(NULLIF(new.raw_user_meta_data->>'altura_cm', ''), 'null')::decimal,
    NULLIF(NULLIF(new.raw_user_meta_data->>'peso_inicial', ''), 'null')::decimal,
    NULLIF(NULLIF(new.raw_user_meta_data->>'peso_meta', ''), 'null')::decimal,
    NULLIF(NULLIF(new.raw_user_meta_data->>'dose_atual_mg', ''), 'null')::decimal,
    NULLIF(NULLIF(new.raw_user_meta_data->>'dia_aplicacao', ''), 'null')::integer,
    NULLIF(NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', ''), 'null')::date
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome);
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
