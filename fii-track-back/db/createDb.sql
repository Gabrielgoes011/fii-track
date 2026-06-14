-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.ativos_id_seq;

CREATE SEQUENCE public.ativos_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ativos_id_seq OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public.ativos_id_seq TO neondb_owner;

-- DROP SEQUENCE public."credenciaisUsuario_id_seq";

CREATE SEQUENCE public."credenciaisUsuario_id_seq"
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public."credenciaisUsuario_id_seq" OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public."credenciaisUsuario_id_seq" TO neondb_owner;

-- DROP SEQUENCE public.operacoes_id_seq;

CREATE SEQUENCE public.operacoes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.operacoes_id_seq OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public.operacoes_id_seq TO neondb_owner;

-- DROP SEQUENCE public.rendimentos_id_seq;

CREATE SEQUENCE public.rendimentos_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.rendimentos_id_seq OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public.rendimentos_id_seq TO neondb_owner;

-- DROP SEQUENCE public.segmentos_id_seq;

CREATE SEQUENCE public.segmentos_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.segmentos_id_seq OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public.segmentos_id_seq TO neondb_owner;

-- DROP SEQUENCE public.usuarios_id_seq;

CREATE SEQUENCE public.usuarios_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.usuarios_id_seq OWNER TO neondb_owner;
GRANT ALL ON SEQUENCE public.usuarios_id_seq TO neondb_owner;
-- public.ativos definição

-- Drop table

-- DROP TABLE public.ativos;

CREATE TABLE public.ativos (
	id serial4 NOT NULL,
	ticker varchar(10) NOT NULL,
	"nomeFundo" varchar(100) NOT NULL,
	cnpj varchar(16) NULL,
	"idSeguimento" int4 NOT NULL,
	"idUsuario" int4 NULL,
	"dtCadastro" date DEFAULT CURRENT_DATE NULL,
	CONSTRAINT ativos_pkey PRIMARY KEY (id),
	CONSTRAINT ativos_ticker_key UNIQUE (ticker)
);

-- Permissions

ALTER TABLE public.ativos OWNER TO neondb_owner;
GRANT ALL ON TABLE public.ativos TO neondb_owner;


-- public."credenciaisUsuario" definição

-- Drop table

-- DROP TABLE public."credenciaisUsuario";

CREATE TABLE public."credenciaisUsuario" (
	id serial4 NOT NULL,
	"password" varchar(255) NOT NULL,
	"idUser" int4 NOT NULL,
	adm bool DEFAULT false NOT NULL,
	CONSTRAINT "credenciaisUsuario_pkey" PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public."credenciaisUsuario" OWNER TO neondb_owner;
GRANT ALL ON TABLE public."credenciaisUsuario" TO neondb_owner;


-- public.operacoes definição

-- Drop table

-- DROP TABLE public.operacoes;

CREATE TABLE public.operacoes (
	id serial4 NOT NULL,
	"idAtivo" int4 NOT NULL,
	tipo varchar(10) NOT NULL,
	quantidade numeric NOT NULL,
	preco numeric NOT NULL,
	"idUsuario" int4 NULL,
	"dtOperacao" date DEFAULT CURRENT_DATE NULL,
	CONSTRAINT operacoes_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.operacoes OWNER TO neondb_owner;
GRANT ALL ON TABLE public.operacoes TO neondb_owner;


-- public.rendimentos definição

-- Drop table

-- DROP TABLE public.rendimentos;

CREATE TABLE public.rendimentos (
	id serial4 NOT NULL,
	"idAtivo" int4 NOT NULL,
	"idUsuario" int4 NOT NULL,
	"valorRecebido" numeric(12, 2) NOT NULL,
	"dtRendimento" date NOT NULL,
	"dtCadastro" timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT rendimentos_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_rendimentos_ativo ON public.rendimentos USING btree ("idAtivo");
CREATE INDEX idx_rendimentos_data ON public.rendimentos USING btree ("dtRendimento");
CREATE INDEX idx_rendimentos_usuario ON public.rendimentos USING btree ("idUsuario");

-- Permissions

ALTER TABLE public.rendimentos OWNER TO neondb_owner;
GRANT ALL ON TABLE public.rendimentos TO neondb_owner;


-- public.seguimentos definição

-- Drop table

-- DROP TABLE public.seguimentos;

CREATE TABLE public.seguimentos (
	id int4 DEFAULT nextval('segmentos_id_seq'::regclass) NOT NULL,
	"nomeSeguimento" varchar(100) NOT NULL,
	CONSTRAINT segmentos_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.seguimentos OWNER TO neondb_owner;
GRANT ALL ON TABLE public.seguimentos TO neondb_owner;


-- public.usuarios definição

-- Drop table

-- DROP TABLE public.usuarios;

CREATE TABLE public.usuarios (
	id serial4 NOT NULL,
	nome varchar(255) NOT NULL,
	"dataNascimento" date NOT NULL,
	email varchar(255) NOT NULL,
	cpf varchar(11) NOT NULL,
	ativo bool DEFAULT true NULL,
	"urlPhotoS3" varchar(1000) NULL,
	CONSTRAINT usuarios_cpf_key UNIQUE (cpf),
	CONSTRAINT usuarios_email_key UNIQUE (email),
	CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.usuarios OWNER TO neondb_owner;
GRANT ALL ON TABLE public.usuarios TO neondb_owner;



-- DROP FUNCTION public."ProperCase"(text);

CREATE OR REPLACE FUNCTION public."ProperCase"(p_text text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN initcap(p_text);
END;
$function$
;

-- Permissions

ALTER FUNCTION public."ProperCase"(text) OWNER TO neondb_owner;
GRANT ALL ON FUNCTION public."ProperCase"(text) TO neondb_owner;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT INSERT, REFERENCES, DELETE, TRUNCATE, TRIGGER, UPDATE, SELECT, UNKNOWN ON TABLES TO neon_superuser WITH GRANT OPTION;
ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT USAGE, UPDATE, SELECT ON SEQUENCES TO neon_superuser WITH GRANT OPTION;