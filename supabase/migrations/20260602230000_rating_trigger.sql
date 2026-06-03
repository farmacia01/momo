-- Migration: 20260602230000_rating_trigger.sql
-- Description: Trigger to update supplier average rating and total orders.

CREATE OR REPLACE FUNCTION update_supplier_stats()
RETURNS trigger AS $$
BEGIN
    UPDATE fornecedores
    SET 
        avaliacao_media = (
            SELECT AVG(nota)::decimal(3,2)
            FROM avaliacoes_produto
            WHERE fornecedor_id = NEW.fornecedor_id
        ),
        total_pedidos = (
            SELECT COUNT(DISTINCT pedido_id)
            FROM avaliacoes_produto
            WHERE fornecedor_id = NEW.fornecedor_id
        )
    WHERE id = NEW.fornecedor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_product_rated
    AFTER INSERT ON avaliacoes_produto
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_stats();
