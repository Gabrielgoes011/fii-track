-- =================================================================
-- Migration 005 — Histórico da Carteira (snapshots por ativo e geral)
-- =================================================================
-- Guarda, a cada Captura (clique em "Atualizar Cotações"), o snapshot
-- do patrimônio do usuário: um registro por ativo em
-- "historico_carteira_ativo" e um registro consolidado em
-- "historico_carteira_geral". Ambos correlacionados pelo mesmo
-- "dtCaptura".
--
-- São dados PRIVADOS por usuário: carregam "idUser" e têm RLS
-- habilitado, seguindo o padrão de db/RLS.sql
-- (current_setting('app.current_user_id')). Tabelas append-only:
-- nenhuma Captura sobrescreve outra.
--
-- Rodar como dono (neondb_owner) no console do Neon. Idempotente:
-- pode ser reexecutada sem falhar nem duplicar políticas.
-- =================================================================

-- -----------------------------------------------------------------
-- Snapshot por ativo — 1 linha por ativo por Captura
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_carteira_ativo
(
    id                  bigserial NOT NULL,
    "idUser"            integer NOT NULL,          -- proprietário (RLS)
    "idAtivo"           integer NOT NULL,          -- ativo da carteira
    ticker              character varying(10) COLLATE pg_catalog."default", -- snapshot do ticker
    quantidade          numeric(20,8),             -- quantidade (até 8 casas)
    "precoMedio"        numeric(12,2),             -- preço médio (2 casas)
    custo               numeric(14,2),             -- custo (2 casas)
    "valorMercado"      numeric(14,2),             -- valor de mercado (2 casas)
    "rentabilidadeRs"   numeric(14,2),             -- rentabilidade em R$ (2 casas)
    "rentabilidadePerc" numeric(8,2),              -- rentabilidade em % (2 casas)
    proventos           numeric(14,2),             -- proventos acumulados (2 casas)
    "precoIndisponivel" boolean NOT NULL DEFAULT false, -- true quando faltou preço de mercado
    "dtCaptura"         timestamp with time zone NOT NULL, -- instante da Captura
    CONSTRAINT historico_carteira_ativo_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.historico_carteira_ativo OWNER to neondb_owner;

-- Índice para consulta por usuário/ativo ordenada por Captura.
CREATE INDEX IF NOT EXISTS historico_carteira_ativo_iduser_idativo_dtcaptura_idx
    ON public.historico_carteira_ativo ("idUser", "idAtivo", "dtCaptura");

-- A aplicação conecta como app_fiitrack e precisa de acesso explícito.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_carteira_ativo TO app_fiitrack;

-- Permissão na sequence do bigserial (necessária para os INSERT da aplicação).
GRANT USAGE, SELECT ON SEQUENCE public.historico_carteira_ativo_id_seq TO app_fiitrack;

-- -----------------------------------------------------------------
-- Snapshot geral — 1 linha consolidada por Captura
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_carteira_geral
(
    id                  bigserial NOT NULL,
    "idUser"            integer NOT NULL,          -- proprietário (RLS)
    "custoTotal"        numeric(16,2),             -- soma dos custos (2 casas)
    "valorMercadoTotal" numeric(16,2),             -- soma dos valores de mercado (2 casas)
    "rentabilidadeRs"   numeric(16,2),             -- rentabilidade total em R$ (2 casas)
    "rentabilidadePerc" numeric(8,2),              -- rentabilidade total em % (2 casas)
    "proventosTotais"   numeric(16,2),             -- soma dos proventos (2 casas)
    "dtCaptura"         timestamp with time zone NOT NULL, -- instante da Captura
    CONSTRAINT historico_carteira_geral_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.historico_carteira_geral OWNER to neondb_owner;

-- Índice para consulta da série de patrimônio por usuário ordenada por Captura.
CREATE INDEX IF NOT EXISTS historico_carteira_geral_iduser_dtcaptura_idx
    ON public.historico_carteira_geral ("idUser", "dtCaptura");

-- A aplicação conecta como app_fiitrack e precisa de acesso explícito.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_carteira_geral TO app_fiitrack;

-- Permissão na sequence do bigserial (necessária para os INSERT da aplicação).
GRANT USAGE, SELECT ON SEQUENCE public.historico_carteira_geral_id_seq TO app_fiitrack;

-- =================================================================
-- RLS — isolamento por usuário (padrão de db/RLS.sql)
-- O valor usado é definido pela API via SET LOCAL app.current_user_id.
-- Blocos idempotentes: só criam a política se ainda não existir.
-- =================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND lower(tablename) = 'historico_carteira_ativo'
          AND lower(policyname) = 'historico_carteira_ativo_rls_policy'
    ) THEN
        ALTER TABLE public.historico_carteira_ativo ENABLE ROW LEVEL SECURITY;
        CREATE POLICY historico_carteira_ativo_rls_policy ON public.historico_carteira_ativo
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND lower(tablename) = 'historico_carteira_geral'
          AND lower(policyname) = 'historico_carteira_geral_rls_policy'
    ) THEN
        ALTER TABLE public.historico_carteira_geral ENABLE ROW LEVEL SECURITY;
        CREATE POLICY historico_carteira_geral_rls_policy ON public.historico_carteira_geral
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;
