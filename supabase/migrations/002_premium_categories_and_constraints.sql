-- ==========================================================
-- SQL para validar categorias premium no INSERT/UPDATE
-- Execute no SQL Editor do Supabase
-- ==========================================================

-- 1. Criar a função que valida a categoria premium
CREATE OR REPLACE FUNCTION check_premium_category()
RETURNS TRIGGER AS $$
DECLARE
  user_status TEXT;
  premium_categories TEXT[] := ARRAY[
    '🥩 Carnes & Aves',
    '🐟 Peixes & Frutos do Mar',
    '👶 Bebê & Infantil',
    '🐾 Pet',
    '💊 Farmácia & Saúde',
    '🍬 Doces & Sobremesas',
    '🧴 Higiene Pessoal',
    '🧹 Limpeza & Químicos',
    '🧃 Bebidas / Prontas'
  ];
BEGIN
  -- Buscar o status de assinatura do usuário
  SELECT subscription_status INTO user_status
  FROM profiles
  WHERE id = NEW.user_id;

  -- Se a categoria é premium e o usuário não é assinante, bloquear
  IF NEW.category = ANY(premium_categories) AND (user_status IS NULL OR user_status != 'active') THEN
    RAISE EXCEPTION 'Categoria "%" requer assinatura Premium.', NEW.category;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o trigger no INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_check_premium_category ON products;
CREATE TRIGGER trigger_check_premium_category
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_premium_category();

-- 3. Adicionar constraints de validação de dados
ALTER TABLE products
  ADD CONSTRAINT check_price_positive CHECK (current_price >= 0 AND current_price <= 999999),
  ADD CONSTRAINT check_prev_price_positive CHECK (previous_price >= 0 AND previous_price <= 999999),
  ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0 AND quantity <= 9999),
  ADD CONSTRAINT check_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200);
