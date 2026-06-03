-- Patient-side supplier module support.
-- 1) Address fields on profiles (delivery address + state used to match
--    suppliers via regioes_entrega).
-- 2) Trigger to keep fornecedores.avaliacao_media in sync with reviews.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text;

-- Recompute the supplier's average rating whenever reviews change.
-- SECURITY DEFINER so it can update fornecedores despite the patient's RLS.
CREATE OR REPLACE FUNCTION recalcular_avaliacao_media()
RETURNS trigger AS $$
DECLARE
  fid uuid;
BEGIN
  fid := COALESCE(NEW.fornecedor_id, OLD.fornecedor_id);
  UPDATE fornecedores f
    SET avaliacao_media = COALESCE(
      (SELECT ROUND(AVG(nota)::numeric, 2)
         FROM avaliacoes_fornecedor
        WHERE fornecedor_id = fid),
      0)
  WHERE f.id = fid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trig_recalcular_avaliacao_media ON avaliacoes_fornecedor;
CREATE TRIGGER trig_recalcular_avaliacao_media
AFTER INSERT OR UPDATE OR DELETE ON avaliacoes_fornecedor
FOR EACH ROW EXECUTE FUNCTION recalcular_avaliacao_media();

CREATE INDEX IF NOT EXISTS pedidos_paciente_id_idx ON pedidos (paciente_id);
CREATE INDEX IF NOT EXISTS avaliacoes_fornecedor_fid_idx ON avaliacoes_fornecedor (fornecedor_id);
