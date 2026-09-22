-- =================================================================
-- FII-TRACK — SCRIPT ÚNICO DE CRIAÇÃO DO BANCO (PostgreSQL)
-- =================================================================
-- Este arquivo consolida TODO o schema do banco: tabelas, índices,
-- permissões (GRANTs) e as políticas de Row-Level Security (RLS).
-- Substitui o antigo createDb.sql + as migrations 001–005 + RLS.sql.
--
-- Ordem: extensões/roles → tabelas → índices → grants → RLS.
--
-- COMO RODAR:
--   Rodar como dono do banco (ex.: neondb_owner) no console do Neon.
--   É idempotente: pode ser reexecutado sem duplicar objetos/políticas.
--
-- OBSERVAÇÕES SOBRE RLS:
--   - Superusuários e o DONO das tabelas IGNORAM o RLS. Para o RLS ter
--     efeito, a aplicação deve conectar como um role SEM ser dono
--     (ex.: app_fiitrack) e definir, por requisição:
--         SET LOCAL app.current_user_id = '<id do usuário>';
--   - Tabelas de dados de mercado (cotacoes, historico_cotacoes) são
--     COMPARTILHADAS entre todos os usuários e NÃO têm RLS.
-- =================================================================


-- =================================================================
-- 0) ROLE DA APLICAÇÃO
-- Cria o role usado pela aplicação, se ainda não existir. Ajuste a
-- senha conforme seu ambiente (ou gerencie fora deste script).
-- =================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_fiitrack') THEN
        CREATE ROLE app_fiitrack LOGIN PASSWORD 'troque_esta_senha';
    END IF;
END $$;


-- =================================================================
-- 1) TABELAS
-- =================================================================

-- -----------------------------------------------------------------
-- Tabela: usuarios — dados cadastrais dos usuários.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios
(
    id serial NOT NULL,
    nome character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "dataNascimento" date NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    cpf character varying(11) COLLATE pg_catalog."default" NOT NULL,
    ativo boolean DEFAULT true,
    "urlPhotoS3" character varying(1000) COLLATE pg_catalog."default",
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_email_key UNIQUE (email),
    CONSTRAINT usuarios_cpf_key UNIQUE (cpf)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.usuarios OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: credenciaisUsuario — senhas (hash) e dados de acesso/2FA.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."credenciaisUsuario"
(
    id serial NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "idUser" integer NOT NULL,
    adm boolean NOT NULL DEFAULT false,
    "auth2faTotp" boolean NOT NULL DEFAULT false,
    "auth2faHabilitado" boolean NOT NULL DEFAULT false,
    "secretAuth2fa" character varying(1000) COLLATE pg_catalog."default",
    CONSTRAINT "credenciaisUsuario_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public."credenciaisUsuario" OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: seguimentos — categorias dos FIIs. Registros com
-- defaultSistem = true e idUser = 0 são padrão do sistema (visíveis
-- para todos e não editáveis/excluíveis).
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seguimentos
(
    id serial NOT NULL,
    "nomeSeguimento" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "idUser" integer,
    "defaultSistem" boolean NOT NULL DEFAULT false,
    CONSTRAINT segmentos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.seguimentos OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: ativos — Fundos Imobiliários cadastrados pelos usuários.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ativos
(
    id serial NOT NULL,
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL,
    "nomeFundo" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cnpj character varying(16) COLLATE pg_catalog."default",
    "idSeguimento" integer NOT NULL,
    "idUser" integer,
    "dtCadastro" date DEFAULT CURRENT_DATE,
    CONSTRAINT ativos_pkey PRIMARY KEY (id),
    CONSTRAINT ativos_ticker_user_unique UNIQUE (ticker, "idUser")
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.ativos OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: operacoes — compras e vendas de cotas.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operacoes
(
    id serial NOT NULL,
    "idAtivo" integer NOT NULL,
    tipo character varying(10) COLLATE pg_catalog."default" NOT NULL,
    quantidade numeric NOT NULL,
    preco numeric NOT NULL,
    "idUser" integer,
    "dtOperacao" date DEFAULT CURRENT_DATE,
    CONSTRAINT operacoes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.operacoes OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: rendimentos — proventos (dividendos) recebidos.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rendimentos
(
    id serial NOT NULL,
    "idAtivo" integer NOT NULL,
    "idUser" integer NOT NULL,
    "valorRecebido" numeric(12,2) NOT NULL,
    "dtRendimento" date NOT NULL,
    "dtCadastro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reinvestido boolean NOT NULL DEFAULT false,
    CONSTRAINT rendimentos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.rendimentos OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: controleAtivos — metas de alocação (percIdeal), preço teto
-- e modo do teto ('manual' | 'pvp'). Inclui as colunas antes trazidas
-- pelas migrations 001 (precoTeto/modoPrecoTeto) e 003 (percIdeal 6,4).
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."controleAtivos"
(
    id serial NOT NULL,
    "idUser" integer NOT NULL,
    "idAtivo" integer NOT NULL,
    "idSegmento" integer NOT NULL,
    objetivo character varying(50) COLLATE pg_catalog."default" NOT NULL,
    "percIdeal" numeric(6,4) NOT NULL,        -- fração: 0.0834 = 8,34%
    "precoTeto" numeric(12,2),                -- nulo = não definido
    "modoPrecoTeto" character varying(10) NOT NULL DEFAULT 'manual',
    "dtCadastro" date DEFAULT CURRENT_DATE,
    CONSTRAINT controle_ativos_pkey PRIMARY KEY (id),
    CONSTRAINT controle_ativos_unico UNIQUE ("idUser", "idAtivo"),
    CONSTRAINT controle_ativos_modo_preco_teto_check CHECK ("modoPrecoTeto" IN ('manual', 'pvp'))
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public."controleAtivos" OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: cotacoes — cache da última cotação por ticker (brapi.dev).
-- Dado de mercado, COMPARTILHADO entre todos os usuários (sem RLS).
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cotacoes
(
    ticker               character varying(10) COLLATE pg_catalog."default" NOT NULL,
    preco                numeric(12,2),
    "fechamentoAnterior" numeric(12,2),
    variacao             numeric(12,4),
    "variacaoPerc"       numeric(8,4),
    "dtPregao"           timestamp with time zone,
    "dtConsulta"         timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT cotacoes_pkey PRIMARY KEY (ticker)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.cotacoes OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: historico_cotacoes — histórico de preço por ticker
-- (append-only). Dado de mercado, COMPARTILHADO (sem RLS).
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_cotacoes
(
    id                   bigserial NOT NULL,
    ticker               character varying(10) COLLATE pg_catalog."default" NOT NULL,
    preco                numeric(12,2),
    "fechamentoAnterior" numeric(12,2),
    variacao             numeric(12,4),
    "variacaoPerc"       numeric(8,4),
    "dtPregao"           timestamp with time zone,
    "dtCaptura"          timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT historico_cotacoes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.historico_cotacoes OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: historico_carteira_ativo — snapshot por ativo a cada
-- Captura. Dado PRIVADO por usuário (COM RLS). Append-only.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_carteira_ativo
(
    id                  bigserial NOT NULL,
    "idUser"            integer NOT NULL,
    "idAtivo"           integer NOT NULL,
    ticker              character varying(10) COLLATE pg_catalog."default",
    quantidade          numeric(20,8),
    "precoMedio"        numeric(12,2),
    custo               numeric(14,2),
    "valorMercado"      numeric(14,2),
    "rentabilidadeRs"   numeric(14,2),
    "rentabilidadePerc" numeric(8,2),
    proventos           numeric(14,2),
    "precoIndisponivel" boolean NOT NULL DEFAULT false,
    "dtCaptura"         timestamp with time zone NOT NULL,
    CONSTRAINT historico_carteira_ativo_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.historico_carteira_ativo OWNER to neondb_owner;

-- -----------------------------------------------------------------
-- Tabela: historico_carteira_geral — snapshot consolidado a cada
-- Captura. Dado PRIVADO por usuário (COM RLS). Append-only.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_carteira_geral
(
    id                  bigserial NOT NULL,
    "idUser"            integer NOT NULL,
    "custoTotal"        numeric(16,2),
    "valorMercadoTotal" numeric(16,2),
    "rentabilidadeRs"   numeric(16,2),
    "rentabilidadePerc" numeric(8,2),
    "proventosTotais"   numeric(16,2),
    "dtCaptura"         timestamp with time zone NOT NULL,
    CONSTRAINT historico_carteira_geral_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.historico_carteira_geral OWNER to neondb_owner;


-- =================================================================
-- 2) ÍNDICES
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_rendimentos_usuario
    ON public.rendimentos USING btree ("idUser" ASC NULLS LAST) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rendimentos_ativo
    ON public.rendimentos USING btree ("idAtivo" ASC NULLS LAST) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rendimentos_data
    ON public.rendimentos USING btree ("dtRendimento" ASC NULLS LAST) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS historico_cotacoes_ticker_captura_pregao_idx
    ON public.historico_cotacoes (ticker, "dtCaptura", "dtPregao");

CREATE INDEX IF NOT EXISTS historico_carteira_ativo_iduser_idativo_dtcaptura_idx
    ON public.historico_carteira_ativo ("idUser", "idAtivo", "dtCaptura");

CREATE INDEX IF NOT EXISTS historico_carteira_geral_iduser_dtcaptura_idx
    ON public.historico_carteira_geral ("idUser", "dtCaptura");


-- =================================================================
-- 3) GRANTS — a aplicação conecta como app_fiitrack e precisa de
-- acesso explícito às tabelas e às sequences (bigserial/serial).
-- =================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios                  TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."credenciaisUsuario"      TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seguimentos               TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ativos                    TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operacoes                 TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rendimentos               TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."controleAtivos"          TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes                  TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_cotacoes        TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_carteira_ativo  TO app_fiitrack;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_carteira_geral  TO app_fiitrack;

-- Sequences (necessárias para os INSERT que usam serial/bigserial).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_fiitrack;


-- =================================================================
-- 4) ROW-LEVEL SECURITY (RLS)
-- Isolamento por usuário. O valor é definido pela API por requisição:
--     SET LOCAL app.current_user_id = '<id>';
-- Blocos idempotentes: só criam a política se ainda não existir.
--
-- Tabelas SEM RLS (dado de mercado compartilhado):
--   cotacoes, historico_cotacoes.
-- =================================================================

-- rendimentos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='rendimentos' AND lower(policyname)='rendimentos_rls_policy') THEN
        ALTER TABLE public.rendimentos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY rendimentos_rls_policy ON public.rendimentos
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- operacoes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='operacoes' AND lower(policyname)='operacoes_rls_policy') THEN
        ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY operacoes_rls_policy ON public.operacoes
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- ativos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='ativos' AND lower(policyname)='ativos_rls_policy') THEN
        ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY ativos_rls_policy ON public.ativos
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- seguimentos — SELECT: próprios + padrão do sistema (idUser=0, defaultSistem=true)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='seguimentos' AND lower(policyname)='seguimentos_rls_policy') THEN
        ALTER TABLE public.seguimentos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY seguimentos_rls_policy ON public.seguimentos
            FOR SELECT
            USING (
                "idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0)
                OR ("defaultSistem" = true AND "idUser" = 0)
            );
    END IF;
END $$;

-- seguimentos — INSERT/UPDATE/DELETE: apenas os próprios (não altera os padrão)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='seguimentos' AND lower(policyname)='seguimentos_rls_write_policy') THEN
        CREATE POLICY seguimentos_rls_write_policy ON public.seguimentos
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0) AND "defaultSistem" = false)
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0) AND "defaultSistem" = false);
    END IF;
END $$;

-- controleAtivos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='controleativos' AND lower(policyname)='controleativos_rls_policy') THEN
        ALTER TABLE public."controleAtivos" ENABLE ROW LEVEL SECURITY;
        CREATE POLICY controleAtivos_rls_policy ON public."controleAtivos"
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- usuarios — cada usuário só enxerga a si mesmo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='usuarios' AND lower(policyname)='usuarios_self_only_policy') THEN
        ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
        CREATE POLICY usuarios_self_only_policy ON public.usuarios
            FOR ALL
            USING (id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK (id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- historico_carteira_ativo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='historico_carteira_ativo' AND lower(policyname)='historico_carteira_ativo_rls_policy') THEN
        ALTER TABLE public.historico_carteira_ativo ENABLE ROW LEVEL SECURITY;
        CREATE POLICY historico_carteira_ativo_rls_policy ON public.historico_carteira_ativo
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- historico_carteira_geral
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND lower(tablename)='historico_carteira_geral' AND lower(policyname)='historico_carteira_geral_rls_policy') THEN
        ALTER TABLE public.historico_carteira_geral ENABLE ROW LEVEL SECURITY;
        CREATE POLICY historico_carteira_geral_rls_policy ON public.historico_carteira_geral
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

-- =================================================================
-- FIM DO SCRIPT
-- =================================================================
