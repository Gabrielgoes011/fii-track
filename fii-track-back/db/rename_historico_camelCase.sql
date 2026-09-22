-- =================================================================
-- Renomeia as tabelas de histórico de snake_case para camelCase.
-- SEM PERDA DE DADOS: ALTER TABLE ... RENAME apenas troca o nome
-- (metadado); linhas, índices, constraints, sequences e políticas de
-- RLS permanecem intactos e continuam funcionando.
--
--   historico_cotacoes        -> "historicoCotacoes"
--   historico_carteira_ativo  -> "historicoCarteiraAtivo"
--   historico_carteira_geral  -> "historicoCarteiraGeral"
--
-- Rodar como dono das tabelas (neondb_owner) no console do Neon.
-- Idempotente: só renomeia se o nome antigo ainda existir.
--
-- IMPORTANTE: rode este script JUNTO com o deploy do código já
-- ajustado (as queries agora usam "historico...CamelCase"). Entre o
-- rename e o deploy, a API antiga não encontra as tabelas.
-- =================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='historico_cotacoes') THEN
        ALTER TABLE public.historico_cotacoes RENAME TO "historicoCotacoes";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='historico_carteira_ativo') THEN
        ALTER TABLE public.historico_carteira_ativo RENAME TO "historicoCarteiraAtivo";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='historico_carteira_geral') THEN
        ALTER TABLE public.historico_carteira_geral RENAME TO "historicoCarteiraGeral";
    END IF;
END $$;

-- As sequences, PKs, índices e políticas de RLS mantêm os nomes antigos
-- (ex.: historico_cotacoes_id_seq, historico_cotacoes_pkey). Isso NÃO afeta
-- o funcionamento — continuam ligados às tabelas renomeadas. Renomeá-los é
-- opcional/cosmético e foi deixado de fora para manter a operação mínima.
