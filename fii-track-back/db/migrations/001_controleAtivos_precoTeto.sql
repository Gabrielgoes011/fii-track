-- =================================================================
-- Migration 001 — Preço Teto no controle de ativos
-- =================================================================
-- Adiciona o preço teto (valor máximo que o usuário aceita pagar pela cota)
-- e o modo de cálculo desse teto:
--   'manual' -> valor fixo em R$ informado pelo usuário
--   'pvp'    -> teto = valor patrimonial da cota (P/VP alvo = 1),
--               usado apenas para fundos de papel
--
-- Rodar como dono da tabela (neondb_owner) no console do Neon.
-- É idempotente: pode ser reexecutada sem efeito colateral.
-- =================================================================

ALTER TABLE public."controleAtivos"
    ADD COLUMN IF NOT EXISTS "precoTeto" numeric(12,2),
    ADD COLUMN IF NOT EXISTS "modoPrecoTeto" character varying(10) NOT NULL DEFAULT 'manual';

-- Garante que o modo só aceita os valores previstos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'controle_ativos_modo_preco_teto_check'
    ) THEN
        ALTER TABLE public."controleAtivos"
            ADD CONSTRAINT controle_ativos_modo_preco_teto_check
            CHECK ("modoPrecoTeto" IN ('manual', 'pvp'));
    END IF;
END $$;
