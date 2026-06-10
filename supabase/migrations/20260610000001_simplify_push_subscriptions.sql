-- Simplify push_subscriptions: single subscription_json column replaces endpoint/p256dh/auth
-- One subscription per user (last device wins on re-subscribe)

ALTER TABLE push_subscriptions ADD COLUMN subscription_json TEXT;

ALTER TABLE push_subscriptions DROP COLUMN endpoint;
ALTER TABLE push_subscriptions DROP COLUMN p256dh;
ALTER TABLE push_subscriptions DROP COLUMN auth;

ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);
