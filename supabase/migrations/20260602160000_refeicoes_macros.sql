-- Add carbohydrate and fat columns to the food diary so the MacroRing on
-- /dieta can show the full macro distribution (protein already existed).
ALTER TABLE refeicoes_registradas
  ADD COLUMN IF NOT EXISTS carboidratos_g INT,
  ADD COLUMN IF NOT EXISTS gorduras_g INT;
