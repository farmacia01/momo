-- Simplify push_subscriptions: single subscription_json column replaces endpoint/p256dh/auth
-- One subscription per user (last device wins on re-subscribe)

ALTER TABLE push_subscriptions ADD COLUMN subscription_json TEXT;

ALTER TABLE push_subscriptions DROP COLUMN endpoint;
ALTER TABLE push_subscriptions DROP COLUMN p256dh;
ALTER TABLE push_subscriptions DROP COLUMN auth;

-- Remove duplicate user_id rows, keeping only the most recent per user
DELETE FROM push_subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM push_subscriptions
  ORDER BY user_id, created_at DESC
);

ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);
