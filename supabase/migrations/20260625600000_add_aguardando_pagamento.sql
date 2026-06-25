ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK (status IN ('novo','aguardando_pagamento','confirmado','enviado','entregue','cancelado'));
