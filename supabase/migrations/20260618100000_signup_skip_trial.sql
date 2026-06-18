-- Migration: 20260618100000_signup_skip_trial.sql
-- Updates handle_new_user trigger to support skip_trial flag.
-- When signup passes skip_trial=true, the user starts as 'free' (no trial).
-- The 7-day trial is then managed by Stripe (trial_period_days: 7).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF (new.raw_user_meta_data->>'skip_trial') = 'true' THEN
    -- New signup flow: Stripe manages the trial, start as 'free'
    INSERT INTO public.profiles (
      id,
      email,
      nome,
      altura_cm,
      dose_atual_mg,
      data_inicio_tratamento,
      plano_ativo,
      trial_inicio,
      trial_expira_em
    ) VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'nome',
      NULLIF(new.raw_user_meta_data->>'altura_cm', '')::decimal,
      NULLIF(new.raw_user_meta_data->>'dose_atual_mg', '')::decimal,
      NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', '')::date,
      'free',
      NULL,
      NULL
    );
  ELSE
    -- Legacy flow: 7-day trial starts on signup
    INSERT INTO public.profiles (
      id,
      email,
      nome,
      data_nascimento,
      sexo,
      altura_cm,
      dose_atual_mg,
      data_inicio_tratamento
    ) VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'nome',
      NULLIF(new.raw_user_meta_data->>'data_nascimento', '')::date,
      new.raw_user_meta_data->>'sexo',
      NULLIF(new.raw_user_meta_data->>'altura_cm', '')::decimal,
      NULLIF(new.raw_user_meta_data->>'dose_atual_mg', '')::decimal,
      NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', '')::date
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
