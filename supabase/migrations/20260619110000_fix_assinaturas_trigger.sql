-- Fix: trigger assinaturas_updated_at chamava update_updated_at() que seta NEW.updated_at,
-- mas a coluna chama-se atualizado_em. Qualquer UPDATE na tabela falhava.

DROP TRIGGER IF EXISTS assinaturas_updated_at ON assinaturas;

CREATE OR REPLACE FUNCTION update_assinaturas_atualizado_em()
RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assinaturas_atualizado_em
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_assinaturas_atualizado_em();
