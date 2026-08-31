-- =================================================================
-- Migration 003 — Precisão do percentual ideal
-- =================================================================
-- "percIdeal" é gravado como fração (0.0834 = 8,34%), mas a coluna era
-- numeric(5,2) e arredondava para 0.08. numeric(6,4) guarda 4 casas
-- decimais (ex.: 0.0834) e ainda comporta 100% (1.0000).
--
-- Rodar como dono (neondb_owner) no console do Neon. Idempotente.
--
-- ATENÇÃO: valores já salvos com a escala antiga (0.08, 0.05...) NÃO
-- são recuperados — os ativos afetados precisam ter a meta reinformada.
-- =================================================================

ALTER TABLE public."controleAtivos"
    ALTER COLUMN "percIdeal" TYPE numeric(6,4);
