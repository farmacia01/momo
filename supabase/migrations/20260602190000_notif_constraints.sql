-- Migration: 20260602190000_notif_constraints.sql
-- Description: Unique constraints to support push enrollment + notification
-- preferences upserts and prevent duplicate rows.

-- push_subscriptions: dedup por endpoint, depois UNIQUE(endpoint)
DELETE FROM push_subscriptions a
USING push_subscriptions b
WHERE a.ctid < b.ctid
  AND a.endpoint = b.endpoint;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- configuracoes_notificacao: uma linha por usuário
DELETE FROM configuracoes_notificacao a
USING configuracoes_notificacao b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id;

ALTER TABLE configuracoes_notificacao
  ADD CONSTRAINT configuracoes_notificacao_user_id_key UNIQUE (user_id);
