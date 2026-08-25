-- =================================================================
-- ATENÇÃO: SUPERUSUÁRIOS E DONOS DA TABELA IGNORAM O RLS!
-- Para testar, você precisará de um usuário no banco que NÃO seja o dono.
-- Em produção, o ideal é aplicar o RLS para o usuário de conexão da aplicação,
-- por exemplo: app_fiitrack.
-- =================================================================

-- Helper para evitar erros ao reexecutar o script.
-- O valor usado aqui deve ser definido pela API via SET LOCAL app.current_user_id.
-- =================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND lower(tablename) = 'rendimentos'
          AND lower(policyname) = 'rendimentos_rls_policy'
    ) THEN
        ALTER TABLE public.rendimentos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY rendimentos_rls_policy ON public.rendimentos
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
          AND lower(tablename) = 'operacoes'
          AND lower(policyname) = 'operacoes_rls_policy'
    ) THEN
        ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY operacoes_rls_policy ON public.operacoes
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
          AND lower(tablename) = 'ativos'
          AND lower(policyname) = 'ativos_rls_policy'
    ) THEN
        ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY ativos_rls_policy ON public.ativos
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
          AND lower(tablename) = 'seguimentos'
          AND lower(policyname) = 'seguimentos_rls_policy'
    ) THEN
        ALTER TABLE public.seguimentos ENABLE ROW LEVEL SECURITY;
        -- Política de SELECT: usuário vê seus próprios seguimentos + os padrão do sistema (defaultSistem = true, idUser = 0)
        CREATE POLICY seguimentos_rls_policy ON public.seguimentos
            FOR SELECT
            USING (
                "idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0)
                OR ("defaultSistem" = true AND "idUser" = 0)
            );
    END IF;
END $$;

-- Política de INSERT/UPDATE/DELETE: apenas o próprio usuário nos seus seguimentos (não permite alterar os padrão)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND lower(tablename) = 'seguimentos'
          AND lower(policyname) = 'seguimentos_rls_write_policy'
    ) THEN
        CREATE POLICY seguimentos_rls_write_policy ON public.seguimentos
            FOR ALL
            USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0) AND "defaultSistem" = false)
            WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0) AND "defaultSistem" = false);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND lower(tablename) = 'controleativos'
          AND lower(policyname) = 'controleativos_rls_policy'
    ) THEN
        ALTER TABLE public."controleAtivos" ENABLE ROW LEVEL SECURITY;
        CREATE POLICY controleAtivos_rls_policy ON public."controleAtivos"
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
          AND lower(tablename) = 'usuarios'
          AND lower(policyname) = 'usuarios_self_only_policy'
    ) THEN
        ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
        CREATE POLICY usuarios_self_only_policy ON public.usuarios
            FOR ALL
            USING (id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
            WITH CHECK (id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
    END IF;
END $$;

