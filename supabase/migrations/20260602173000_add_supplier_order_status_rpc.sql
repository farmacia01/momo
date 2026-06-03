-- Migration: 20260602173000_add_supplier_order_status_rpc.sql
-- Description: Security definer RPC for supplier-side order status updates.

CREATE OR REPLACE FUNCTION atualizar_status_pedido_fornecedor(
    p_pedido_id uuid,
    p_status text,
    p_codigo_rastreio text DEFAULT NULL,
    p_cancelamento_motivo text DEFAULT NULL
)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido pedidos;
BEGIN
    SELECT *
    INTO v_pedido
    FROM pedidos
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM fornecedores f
        WHERE f.id = v_pedido.fornecedor_id
          AND f.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para atualizar este pedido';
    END IF;

    UPDATE pedidos
    SET
        status = p_status,
        codigo_rastreio = CASE
            WHEN p_codigo_rastreio IS NOT NULL AND btrim(p_codigo_rastreio) <> '' THEN p_codigo_rastreio
            ELSE codigo_rastreio
        END,
        cancelamento_motivo = CASE
            WHEN p_status = 'cancelado' THEN p_cancelamento_motivo
            ELSE cancelamento_motivo
        END
    WHERE id = p_pedido_id
    RETURNING * INTO v_pedido;

    RETURN v_pedido;
END;
$$;
