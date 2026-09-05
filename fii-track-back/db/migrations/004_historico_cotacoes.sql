-- =================================================================
-- Migration 004 — Histórico de cotações (append-only)
-- =================================================================
-- Guarda o histórico do preço de mercado de cada ticker: um registro
-- NOVO por ticker a cada Captura (clique em "Atualizar Cotações").
-- Diferente da tabela `cotacoes` (que sobrescreve via UPSERT), esta
-- tabela é APPEND-ONLY — nunca sobrescreve nem apaga registros — para
-- permitir reconstruir a evolução dos preços ao longo do tempo.
--
-- É uma tabela de dados de mercado, COMPARTILHADA entre todos os
-- usuários. Sem RLS — leitura pública (mesmo modelo de `cotacoes`).
--
-- Rodar como dono (neondb_owner) no console do Neon. Idempotente.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.historico_cotacoes
(
    id                   bigserial NOT NULL,
    ticker               character varying(10) COLLATE pg_catalog."default" NOT NULL,
    preco                numeric(12,2),          -- preço de mercado / fechamento do pregão
    "fechamentoAnterior" numeric(12,2),
    variacao             numeric(12,4),          -- variação do dia em R$
    "variacaoPerc"       numeric(8,4),           -- variação do dia em %
    "dtPregao"           timestamp with time zone, -- horário do dado na B3 (vem da brapi)
    "dtCaptura"          timestamp with time zone NOT NULL DEFAULT now(), -- instante da Captura
    CONSTRAINT historico_cotacoes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Índice para a ordenação de consulta (dtCaptura ASC, dtPregao ASC)
-- e o filtro por período de um ticker.
CREATE INDEX IF NOT EXISTS historico_cotacoes_ticker_captura_pregao_idx
    ON public.historico_cotacoes (ticker, "dtCaptura", "dtPregao");

ALTER TABLE IF EXISTS public.historico_cotacoes OWNER to neondb_owner;

-- A aplicação conecta como app_fiitrack e precisa de acesso explícito.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_cotacoes TO app_fiitrack;

-- Permissão na sequence do bigserial (necessária para os INSERT da aplicação).
GRANT USAGE, SELECT ON SEQUENCE public.historico_cotacoes_id_seq TO app_fiitrack;

-- Sem RLS: dado de mercado compartilhado entre todos os usuários.
