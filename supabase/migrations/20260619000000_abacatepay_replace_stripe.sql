ALTER TABLE assinaturas
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id,
  ADD COLUMN IF NOT EXISTS abacate_billing_id      text UNIQUE,
  ADD COLUMN IF NOT EXISTS abacate_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS abacate_customer_id     text;
