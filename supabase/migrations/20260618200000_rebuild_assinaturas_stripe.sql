-- Migration: 20260618200000_rebuild_assinaturas_stripe.sql
-- Drops old Cakto-era assinaturas table and creates a clean Stripe-organized one.
-- Safe to run: no active subscribers.

DROP TABLE IF EXISTS assinaturas CASCADE;

CREATE TABLE assinaturas (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  stripe_customer_id     text        UNIQUE,
  stripe_subscription_id text        UNIQUE,
  stripe_price_id        text,
  status                 text        NOT NULL DEFAULT 'pendente' CHECK (status IN (
                           'ativa', 'cancelada', 'expirada', 'pendente', 'inadimplente'
                         )),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean     NOT NULL DEFAULT false,
  criado_em              timestamptz NOT NULL DEFAULT now(),
  atualizado_em          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sua assinatura" ON assinaturas
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
