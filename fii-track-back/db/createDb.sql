--Arquivo sql de criação do banco de dados
-- =================================================================
-- FII-TRACK DATABASE SCHEMA (PostgreSQL)
-- Arquivo de criação do banco de dados, organizado por tabelas.
-- =================================================================

-- =================================================================
-- Tabela: usuarios
-- Armazena os dados cadastrais dos usuários da plataforma.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.usuarios
(
    id serial NOT NULL, -- ID único do usuário
    nome character varying(255) COLLATE pg_catalog."default" NOT NULL, -- Nome completo
    "dataNascimento" date NOT NULL, -- Data de nascimento
    email character varying(255) COLLATE pg_catalog."default" NOT NULL, -- Email de login (único)
    cpf character varying(11) COLLATE pg_catalog."default" NOT NULL, -- CPF (único)
    ativo boolean DEFAULT true, -- Status do usuário (ativo/inativo)
    "urlPhotoS3" character varying(1000) COLLATE pg_catalog."default", -- URL da foto de perfil
    CONSTRAINT usuarios_pkey PRIMARY KEY (id), -- Chave primária
    CONSTRAINT usuarios_email_key UNIQUE (email), -- Garante que o email seja único
    CONSTRAINT usuarios_cpf_key UNIQUE (cpf) -- Garante que o CPF seja único
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.usuarios
    OWNER to neondb_owner;

-- =================================================================
-- Tabela: credenciaisUsuario
-- Armazena as senhas com hash e o nível de acesso dos usuários.
-- =================================================================
CREATE TABLE IF NOT EXISTS public."credenciaisUsuario"
(
    id serial NOT NULL, -- ID único da credencial
    password character varying(255) COLLATE pg_catalog."default" NOT NULL, -- Senha com hash (bcrypt)
    "idUser" integer NOT NULL, -- Chave estrangeira para a tabela 'usuarios'
    adm boolean NOT NULL DEFAULT false, -- Flag de administrador
    CONSTRAINT "credenciaisUsuario_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public."credenciaisUsuario"
    OWNER to neondb_owner;

-- =================================================================
-- Tabela: seguimentos
-- Categorias dos fundos imobiliários (ex: Logística, Lajes, Papel).
-- =================================================================
CREATE TABLE IF NOT EXISTS public.seguimentos
(
    id serial NOT NULL, -- ID único do seguimento
    "nomeSeguimento" character varying(100) COLLATE pg_catalog."default" NOT NULL, -- Nome do seguimento
    "idUser" integer, -- Vinculado ao usuário que o cadastrou
    CONSTRAINT segmentos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.seguimentos
    OWNER to neondb_owner;

-- =================================================================
-- Tabela: ativos
-- Armazena os Fundos Imobiliários (FIIs) cadastrados pelos usuários.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.ativos
(
    id serial NOT NULL, -- ID único do ativo
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL, -- Código do fundo (ex: MXRF11)
    "nomeFundo" character varying(100) COLLATE pg_catalog."default" NOT NULL, -- Nome do fundo
    cnpj character varying(16) COLLATE pg_catalog."default", -- CNPJ do fundo
    "idSeguimento" integer NOT NULL, -- Chave estrangeira para a tabela 'seguimentos'
    "idUser" integer, -- Vinculado ao usuário que o cadastrou
    "dtCadastro" date DEFAULT CURRENT_DATE, -- Data do cadastro
    CONSTRAINT ativos_pkey PRIMARY KEY (id), -- Chave primária
    CONSTRAINT ativos_ticker_key UNIQUE (ticker) -- Garante que o ticker seja único
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.ativos
    OWNER to neondb_owner;

-- =================================================================
-- Tabela: operacoes
-- Registra as operações de Compra e Venda de cotas de ativos.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.operacoes
(
    id serial NOT NULL, -- ID único da operação
    "idAtivo" integer NOT NULL, -- Chave estrangeira para a tabela 'ativos'
    tipo character varying(10) COLLATE pg_catalog."default" NOT NULL, -- 'Compra' ou 'Venda'
    quantidade numeric NOT NULL, -- Quantidade de cotas
    preco numeric NOT NULL, -- Preço por cota na operação
    "idUser" integer, -- Vinculado ao usuário que realizou a operação
    "dtOperacao" date DEFAULT CURRENT_DATE, -- Data da operação
    CONSTRAINT operacoes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.operacoes
    OWNER to neondb_owner;

-- =================================================================
-- Tabela: rendimentos
-- Registra os proventos (dividendos) recebidos dos ativos.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.rendimentos
(
    id serial NOT NULL, -- ID único do rendimento
    "idAtivo" integer NOT NULL, -- Chave estrangeira para a tabela 'ativos'
    "idUser" integer NOT NULL, -- Vinculado ao usuário que recebeu
    "valorRecebido" numeric(12,2) NOT NULL, -- Valor total recebido
    "dtRendimento" date NOT NULL, -- Data de recebimento (data com)
    "dtCadastro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP, -- Data de lançamento no sistema
    reinvestido boolean NOT NULL DEFAULT false, -- Flag para o "Efeito Bola de Neve"
    CONSTRAINT rendimentos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.rendimentos
    OWNER to neondb_owner;

-- --- Índices para otimizar consultas na tabela 'rendimentos' ---
CREATE INDEX IF NOT EXISTS idx_rendimentos_usuario ON public.rendimentos USING btree ("idUser" ASC NULLS LAST) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rendimentos_ativo ON public.rendimentos USING btree ("idAtivo" ASC NULLS LAST) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rendimentos_data ON public.rendimentos USING btree ("dtRendimento" ASC NULLS LAST) TABLESPACE pg_default;

-- =================================================================
-- Tabela: controleAtivos (ou metas_carteira)
-- Armazena as metas de alocação e preço teto para cada ativo.
-- Nota: O nome da tabela no script original é 'controleAtivos', mas a documentação sugere 'metas_carteira'.
-- =================================================================
CREATE TABLE IF NOT EXISTS public."controleAtivos"
(
    id serial NOT NULL, -- ID único do registro de controle
    "idUser" integer NOT NULL, -- Chave estrangeira para 'usuarios'
    "idAtivo" integer NOT NULL, -- Chave estrangeira para 'ativos'
    "idSegmento" integer NOT NULL, -- Chave estrangeira para 'seguimentos'
    objetivo character varying(50) COLLATE pg_catalog."default" NOT NULL, -- Objetivo do ativo na carteira (ex: Renda, Crescimento)
    "percIdeal" numeric(5,2) NOT NULL, -- Percentual ideal da carteira para este ativo
    "dtCadastro" date DEFAULT CURRENT_DATE,
    CONSTRAINT controle_ativos_pkey PRIMARY KEY (id),
    CONSTRAINT controle_ativos_unico UNIQUE ("idUser", "idAtivo") -- Garante uma meta por ativo/usuário
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS public."controleAtivos"
    OWNER to neondb_owner;