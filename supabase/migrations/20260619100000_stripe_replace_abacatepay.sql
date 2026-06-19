ALTER TABLE assinaturas
  DROP COLUMN IF EXISTS abacate_billing_id,
  DROP COLUMN IF EXISTS abacate_subscription_id,
  DROP COLUMN IF EXISTS abacate_customer_id,
  ADD COLUMN IF NOT EXISTS stripe_session_id      text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
