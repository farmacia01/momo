-- Migration: 20260602220000_automation_notifications.sql
-- Description: Centralized notification table and triggers for order status changes.

-- 1. Create notifications table for in-app history
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    url text,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
ON notifications FOR ALL
USING (auth.uid() = user_id);

-- 2. Function to handle order status changes and notify
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS trigger AS $$
DECLARE
    target_user_id uuid;
    notif_title text;
    notif_body text;
    notif_url text;
    order_code text;
BEGIN
    -- Only trigger if status has changed
    IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;

    order_code := NEW.codigo;
    notif_url := '/meus-pedidos/' || NEW.id;

    -- Determine message based on status
    CASE NEW.status
        WHEN 'confirmado' THEN
            target_user_id := NEW.paciente_id;
            notif_title := '✅ Pedido confirmado!';
            notif_body := 'Seu pedido ' || order_code || ' foi confirmado pelo fornecedor.';
        WHEN 'enviado' THEN
            target_user_id := NEW.paciente_id;
            notif_title := '📦 A caminho!';
            notif_body := 'Seu pedido ' || order_code || ' saiu para entrega.';
        WHEN 'entregue' THEN
            target_user_id := NEW.paciente_id;
            notif_title := '🎉 Entregue!';
            notif_body := 'Seu pedido ' || order_code || ' foi entregue com sucesso.';
        WHEN 'cancelado' THEN
            target_user_id := NEW.paciente_id;
            notif_title := '❌ Pedido cancelado';
            notif_body := 'O pedido ' || order_code || ' foi cancelado.';
        WHEN 'novo' THEN
            -- Notify supplier when a new order is created
            -- We need to find the supplier's user_id
            SELECT user_id INTO target_user_id FROM fornecedores WHERE id = NEW.fornecedor_id;
            notif_title := '🛒 Novo pedido recebido!';
            notif_body := 'Você recebeu o pedido ' || order_code || '. Clique para ver detalhes.';
            notif_url := '/fornecedor/pedidos';
        ELSE
            RETURN NEW;
    END CASE;

    -- 1. Insert into in-app notifications table
    IF target_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, url)
        VALUES (target_user_id, notif_title, notif_body, notif_url);
        
        -- Note: We can't call external HTTP APIs directly from PL/pgSQL easily 
        -- without extensions like pg_net. 
        -- Instead, we can use Supabase Webhooks or a separate worker.
        -- For now, the in-app notification is a great first step.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS tr_order_status_notification ON pedidos;
CREATE TRIGGER tr_order_status_notification
AFTER INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();
