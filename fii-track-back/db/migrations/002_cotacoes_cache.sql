-- =================================================================
-- Migration 002 — Cache de cotações (brapi.dev)
-- =================================================================
-- Guarda a última cotação conhecida de cada ticker para NÃO precisar
-- consultar a brapi.dev toda vez que a tela abre (o plano gratuito
-- limita a 1 ticker por requisição).
--
-- É uma tabela de dados de mercado: 1 linha por ticker, COMPARTILHADA
-- entre todos os usuários. Sem RLS — leitura pública.
--
-- Rodar como dono (neondb_owner) no console do Neon. Idempotente.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.cotacoes
(
    ticker               character varying(10) COLLATE pg_catalog."default" NOT NULL,
    preco                numeric(12,2),          -- último preço / fechamento do pregão
    "fechamentoAnterior" numeric(12,2),
    variacao             numeric(12,4),          -- variação do dia em R$
    "variacaoPerc"       numeric(8,4),           -- variação do dia em %
    "dtPregao"           timestamp with time zone, -- horário do dado na B3 (vem da brapi)
    "dtConsulta"         timestamp with time zone NOT NULL DEFAULT now(), -- quando a API buscou
    CONSTRAINT cotacoes_pkey PRIMARY KEY (ticker)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.cotacoes OWNER to neondb_owner;

-- A aplicação conecta como app_fiitrack e precisa de acesso explícito.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO app_fiitrack;
