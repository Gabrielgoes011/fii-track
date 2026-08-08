#  Mestre, Guia para Novas Tabelas com RLS e Permissões

Este documento detalha o processo que você deve seguir **toda vez que criar uma nova tabela** no banco de dados.

Como estamos gerenciando as permissões de forma explícita para o usuário da aplicação, é crucial executar os seguintes comandos para garantir que a API consiga acessar a nova tabela e que a segurança de dados (RLS) esteja ativa.

> Em produção, o usuário da aplicação é o papel `app_fiitrack`.

---

### Checklist de Comandos para Novas Tabelas

Para cada nova tabela que você criar (ex: `public.sua_tabela_nova`), você **deve** executar os 3 passos a seguir.

**Substitua `sua_tabela_nova` pelo nome real da sua tabela.**

#### Passo 1: Conceder Permissões na Tabela

Este comando permite que o usuário da aplicação realize as operações de `SELECT`, `INSERT`, `UPDATE` e `DELETE` na nova tabela.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sua_tabela_nova TO app_fiitrack;
```

#### Passo 2: Conceder Permissões na Sequence

Se sua tabela tem uma coluna de ID com `serial` ou `bigserial` (auto-incremento), o PostgreSQL cria uma sequence para gerar os números. Você precisa dar permissão a ela, senão a aplicação não conseguirá criar novos registros (`INSERT`).

```sql
-- O nome da sequence é geralmente nomeDaTabela_nomeDaColunaId_seq
GRANT USAGE, SELECT ON SEQUENCE public.sua_tabela_nova_id_seq TO app_fiitrack;
```

#### Passo 3: Ativar a Segurança a Nível de Linha (RLS)

Este é o passo mais importante para a segurança. Primeiro, ativamos o RLS na tabela e, em seguida, criamos a política que filtra os dados com base no usuário logado na aplicação.

```sql
-- 1. Ativa o RLS na tabela
ALTER TABLE public.sua_tabela_nova ENABLE ROW LEVEL SECURITY;

-- 2. Cria a política de acesso baseada no idUser
CREATE POLICY sua_tabela_nova_rls_policy ON public.sua_tabela_nova
    FOR ALL
    USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
    WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
```

---

### Versão pronta para copiar e colar

Se a sua nova tabela tiver uma coluna `idUser` e você quiser seguir o padrão do projeto, use este bloco:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sua_tabela_nova TO app_fiitrack;

GRANT USAGE, SELECT ON SEQUENCE public.sua_tabela_nova_id_seq TO app_fiitrack;

ALTER TABLE public.sua_tabela_nova ENABLE ROW LEVEL SECURITY;

CREATE POLICY sua_tabela_nova_rls_policy ON public.sua_tabela_nova
    FOR ALL
    USING ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0))
    WITH CHECK ("idUser" = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::integer, 0));
```

---

Seguindo rigorosamente estes 3 passos para cada nova tabela, você garante que sua aplicação funcionará corretamente e que os dados dos seus usuários estarão sempre isolados e seguros.