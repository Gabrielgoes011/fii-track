# FIITrack — Análise do Projeto, Backlog e Débitos Técnicos

> Última atualização: **15/10/2026**
>
> Documentação de desenvolvimento: [`fii-track-front/PADROES.md`](fii-track-front/PADROES.md) | [`fii-track-back/GUIA_DESENVOLVIMENTO.md`](fii-track-back/GUIA_DESENVOLVIMENTO.md)
>
> **Nota desta revisão:** Seguimentos e Controle de Ativos estavam marcados como pendentes
> em versões anteriores deste documento, mas ambos já estão concluídos no código. Esta
> revisão corrige esses pontos para que o backlog reflita o estado real do projeto.

---

## 1. Status do Multi-usuário

O sistema opera em modo **multi-usuário real**. Cada usuário vê apenas seus próprios dados.

### Implementado ✅

| Módulo | Detalhe |
|---|---|
| `verificaToken.js` | Decodifica o JWT e injeta `req.user` em toda requisição protegida |
| Rendimentos | Todas as queries filtram por `idUser` — completo (CRUD + KPIs) |
| Meus FIIs | `listar`, `cadastrar`, `contar` filtram/gravam com `idUser` |
| Operações | `listarOperacoes`, `lancarOperacao`, `excluirOperacao` e gráfico filtram por `idUser` ✅ (exclusão agora valida propriedade da operação) |
| Seguimentos | Queries já filtram por `idUser` no controller |

### Ainda falta ⚠️

| Módulo | O que falta |
|---|---|
| ~~**Admin**~~ | ✅ Feito — `verificaAdmin.js` protege as rotas de `/users*` usando o campo `adm` que já existia em `credenciaisUsuario` (não foi preciso criar a coluna `perfil`: o `adm` boolean já cumpre esse papel). **Atenção:** confirme que sua conta tem `adm = true` antes de depender dessas rotas, senão a tela de Usuários fica bloqueada para todo mundo. Falta só ocultar o menu "Usuários" no front para não-admins (ver seção 4). |

---

## 2. Status da Migração para 3 Camadas (Controller → Service → Repository)

| Módulo | Controller | Service | Repository | Status |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ Completo |
| Home/Dashboard | ✅ | ✅ | ✅ | ✅ Completo |
| Meus FIIs | ✅ | ✅ | ✅ | ✅ Completo (inclui `contarFundosAtivos`) |
| Rendimentos | ✅ | ✅ | ✅ | ✅ Completo (CRUD + KPIs `/cardsRendimentos`) |
| Operações (CRUD + Gráfico) | ✅ | ✅ | ✅ | ✅ Completo — falta apenas o endpoint de cards (seção 6) |
| Usuários | ✅ | ✅ | ✅ | ✅ Completo — `atualizarUser`/`deleteUser` migrados, `resetarSenha` novo, bug de tabela corrigido |
| Seguimentos | ✅ | ✅ | ✅ | ✅ Completo — migrado para `seguimentos.controller.js` → `seguimentos.service.js` → `seguimentos.repositories.js` |
| Controle de Ativos | ✅ | ✅ | ✅ | ✅ Completo — `controleAtivos.controller/service/repository.js` + `brapi.service.js` (cotações com cache) |

### Seguimentos — migração concluída ✅

O `seguimentos.controller.js` não acessa mais o banco diretamente: valida a entrada e delega aos services. A regra de negócio (duplicata, bloqueio de segmento padrão do sistema, checagem de ativos vinculados) vive em `seguimentos.service.js`, e todo o SQL está isolado em `seguimentos.repositories.js` (todas as queries filtram por `idUser`).

| Função | Service | Repository |
|---|---|---|
| Listar | `listarSeguimentosService` | `findSeguimentosRepo` |
| Contar | `contarSeguimentosService` | `countSeguimentosRepo` |
| Cadastrar | `cadastrarSeguimentoService` | `insertSeguimentoRepo` / `findSeguimentoByNomeRepo` |
| Atualizar | `atualizarSeguimentoService` | `updateSeguimentoRepo` / `findSeguimentoByIdRepo` |
| Excluir | `excluirSeguimentoService` | `deleteSeguimentoRepo` / `countAtivosVinculadosRepo` |

### Usuários — migração concluída ✅

| Função | Situação |
|---|---|
| `atualizarUser` | Migrado para `atualizarUserService`/`atualizarUserRepository`. Corrigido o bug da tabela `dbo."tabUser"` (não existe mais) — agora atualiza `usuarios` corretamente |
| `deleteUser` | Migrado para `deletarUserService`/`deletarUserRepository`, mantendo a transação (deleta credenciais e depois o usuário) |
| `resetarSenhaController` (novo) | `PUT /users/reset-password/:id` — reseta a senha do usuário para o padrão (`Track@123`), mesmo valor usado no cadastro e já reconhecido pelo login como `defaultPassword` |

> Também corrigido: `checkEmailRepository` agora aceita um `excludeId` opcional (pra não acusar conflito de email com o próprio usuário durante a edição), e o `console.log(id, newValue)` de debug foi removido de `onOffUserRepository`.

---

## 3. Funcionalidades Incompletas no Frontend

| Módulo | Funcionalidade | Observação |
|---|---|---|
| ~~Seguimentos~~ | ~~Editar seguimento~~ | ✅ Feito — `handleUpdateSeguimento`/`handleEdit` chamam a API real |
| ~~Usuários~~ | ~~Editar usuário~~ | ✅ Feito — `handleUpdateUser`/`handleEdit` chamam a API real, pré-preenchendo o formulário (inclusive `dataNascimento`, agora retornada pelo `GET /users`) |
| ~~Usuários~~ | ~~Resetar senha~~ | ✅ Feito — `handleResetPassword` chama `PUT /users/reset-password/:id` |
| ~~Controle de Ativos~~ | ~~Integração com backend~~ | ✅ Feito — backend completo (`controlAtivos` com 4 camadas + `brapi.service.js`) e o frontend consome os endpoints reais (ver seção 7) |

---

## 4. Backlog

### Alta Prioridade

- [ ] **Cards de Operações** — `totalAportado`, `totalVendido` e `capitalLiquido` na tela de Operações (spec na seção 6). **Pendente de verdade** — não há `cardsOperacoes` no backend ainda.
- [x] ~~**Corrigir `atualizarUser`**~~ — migrado para `usuarios.services.js`/`usuarios.repositories.js`, apontando para `usuarios`
- [x] ~~**Backend de Controle de Ativos**~~ — concluído: `controlAtivos` com `controller/service/repository` + `brapi.service.js` (cotações com cache de 15 min); o frontend já consome os endpoints reais
- [x] ~~**Middleware `verificaAdmin`**~~ — criado usando o `adm` boolean que já existe em `credenciaisUsuario` (dispensou a coluna `perfil`)
- [ ] **Ocultar menu "Usuários" para não-admins** no frontend + guard de rota — *verificar no `fii-track-front` (possivelmente já implementado); fora deste repositório backend*

### Média Prioridade

- [x] ~~**Migrar Seguimentos para 3 camadas**~~ (service + repository) — concluído: `seguimentos.controller/service/repositories.js`, sem acesso direto ao banco no controller
- [x] ~~**Implementar edição de seguimento**~~ (front + back — back já tinha a query no controller)
- [x] ~~**Implementar edição de usuário**~~ (front + back — bug de tabela corrigido)
- [x] ~~**Implementar reset de senha**~~ (front + back)
- [x] ~~**Migrar `atualizarUser` e `deleteUser`**~~ para service/repository
- [ ] **Resolver dependência quebrada do S3** — `src/config/s3.js` importa `@aws-sdk/client-s3`, mas o pacote não está mais no `package.json`/`node_modules`. Ninguém importa `s3.js` hoje, então não quebra em runtime, mas vai quebrar assim que alguém tentar usar upload. Decidir: reinstalar a dependência ou remover o arquivo morto

### Baixa Prioridade / Melhorias

- [x] ~~Remover `console.log(id, newValue)` de debug em `onOffUserRepository`~~ (`usuarios.repositories.js`) — já removido; a função está limpa
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato em lote (multer + S3 já configurados, mas não conectados a nenhuma rota)
- [x] ~~Rota de refresh de token JWT~~ — `POST /auth/refresh` (access 15 min + refresh 8h)
- [ ] Endpoint de relatório consolidado por período
- [x] ~~Integração com API externa (Brapi) para cotação em tempo real~~ — `brapi.service.js` com cache de 15 min; busca em lotes com retry para respeitar o limite do plano gratuito
- [ ] Testes automatizados
- [ ] Dockerização
- [ ] Documentação Swagger / OpenAPI

---

## 5. Banco de Dados — Alterações Pendentes

> A coluna `perfil` cogitada aqui **não foi criada** — o `verificaAdmin` passou a usar o boolean `adm` que já existe em `credenciaisUsuario` (mesmo campo já lido no login), então nenhuma migração foi necessária para proteger as rotas de gestão de usuários.

```sql
-- 1. Tabela de metas por ativo — necessária para o backend de Controle de Ativos
CREATE TABLE IF NOT EXISTS metas_carteira (
  id              SERIAL PRIMARY KEY,
  "idUser"        INTEGER NOT NULL REFERENCES usuarios(id),
  "idAtivo"       INTEGER NOT NULL REFERENCES ativos(id),
  "precoTeto"     NUMERIC(10,2),
  "percIdeal"     NUMERIC(5,4),
  "criadoEm"      TIMESTAMP DEFAULT NOW(),
  "atualizadoEm"  TIMESTAMP DEFAULT NOW(),
  UNIQUE ("idUser", "idAtivo")
);
```

> A coluna `reinvestido` (`BOOLEAN`) já existe e está em uso na tabela **`rendimentos`** (não em `operacoes` — correção em relação a versões anteriores desta análise). O script `db/createDb.sql` é um dump antigo do schema e não reflete essa coluna nem eventuais outras alterações manuais; ele deve ser tratado como referência histórica, não como fonte da verdade do schema atual.

---

## 6. Spec — Cards de Operações

> Feature de alta prioridade. Adicionar três cards na tela de Operações seguindo o padrão visual de Rendimentos (que já tem os cards de KPI implementados via `POST /cardsRendimentos`).

### Indicadores

| Card | Fórmula | Cor sugerida |
|---|---|---|
| Total aportado | `SUM(quantidade * preco)` onde `tipo = 'Compra'` | Verde/Azul |
| Total vendido | `SUM(quantidade * preco)` onde `tipo = 'Venda'` | Laranja/Vermelho discreto |
| Capital líquido | `totalAportado - totalVendido` | Ciano/Amarelo |

Os cards acompanham os filtros de `ano` e `mes`. Quando não há dados, exibem `R$ 0,00`.

### Contrato da API

```
POST /cardsOperacoes   (protegida com verificaToken)
```

Requisição:
```json
{ "mes": "Todos", "ano": 2026 }
```

Resposta:
```json
{ "totalAportado": 1500.00, "totalVendido": 500.00, "capitalLiquido": 1000.00 }
```

### Query sugerida

```sql
SELECT
  COALESCE(SUM(CASE WHEN tipo = 'Compra' THEN quantidade * preco ELSE 0 END), 0) AS "totalAportado",
  COALESCE(SUM(CASE WHEN tipo = 'Venda'  THEN quantidade * preco ELSE 0 END), 0) AS "totalVendido",
  COALESCE(SUM(CASE
    WHEN tipo = 'Compra' THEN  quantidade * preco
    WHEN tipo = 'Venda'  THEN -(quantidade * preco)
    ELSE 0
  END), 0) AS "capitalLiquido"
FROM operacoes
WHERE "idUser" = $1
  AND EXTRACT(YEAR  FROM "dtOperacao") = $2
  AND ($3 IS NULL OR EXTRACT(MONTH FROM "dtOperacao") = $3);
```

### Arquivos a criar/editar

**Backend:**
- `operacoes.repositories.js` → adicionar `getCardsOperacoesRepo({ idUser, ano, mes })`
- `operacoes.services.js` → adicionar `cardsOperacoesService({ idUser, ano, mes })`
- `operacoes.controller.js` → adicionar `getCardsOperacoes`
- `operacoes.routes.js` → registrar `POST /cardsOperacoes` com `verificaToken`

**Frontend:**
- `operacoesService.js` → adicionar `cardsOperacoes({ mes, ano })`
- `useOperacoes.js` → adicionar estado `cardsOperacoes`, `loadingCards` e função `getCardsOperacoes`
- `operacoes.jsx` → renderizar os 3 cards acima do gráfico

---

## 7. Controle de Ativos — Status Atual

O frontend já está **totalmente implementado** seguindo a spec ([`SPEC_CONTROLE_ATIVOS.md`](fii-track-front/src/pages/controleAtivos/SPEC_CONTROLE_ATIVOS.md)):

- 4 KPI cards no header (Custo Total, Valor Atual, Rentabilidade, Total de Proventos)
- Tabela de 16 colunas com inputs editáveis (Preço Teto, % Ideal), badges de ação, ordenação por cabeçalho e linha de totais
- Hook `useControleAtivos.js` e service `controleAtivosService.js` já criados

**Porém**, o hook usa dados mockados (`MOCK_DATA`) — nenhuma chamada real é feita ainda para `GET /controle-ativos`. O backend correspondente **não existe** (nenhuma rota, controller, service ou repository de `controleAtivos` no back-end).

### Pendências para conectar o backend real

1. Decidir a regra de cálculo do preço médio (custo médio ponderado vs FIFO)
2. Criar a tabela `metas_carteira` (SQL na seção 5)
3. Integração com a Brapi para cotações (com cache, para não estourar o limite gratuito)
4. Criar `controleAtivos.repositories.js`, `.services.js`, `.controller.js` e `.routes.js` seguindo o padrão do projeto
5. Trocar `MOCK_DATA` por `controleAtivosService.listar()` real no hook do frontend

---

## 8. Resumo Visual

```
BACK-END
├── ✅ Login
├── ✅ Home/Dashboard
├── ✅ Meus FIIs (multi-usuário + 3 camadas)
├── ✅ Rendimentos (multi-usuário + 3 camadas + KPIs + CRUD completo)
├── ✅ Operações (multi-usuário + 3 camadas — CRUD + Gráfico) — falta cards
├── ✅  Usuários (3 camadas completo + verificaAdmin + resetarSenha; bug de tabela corrigido)
├── ❌  Seguimentos (acesso direto ao DB — sem service/repository; updateSeguimento já filtra por idUser)
└── ❌  Controle de Ativos (não existe — frontend aguardando)

FRONT-END
├── ✅ Login
├── ✅ Dashboard
├── ✅ Meus FIIs
├── ✅ Operações
├── ✅ Rendimentos (KPIs + Efeito Bola de Neve)
├── ✅ Usuários (editar/resetar implementados)
├── ✅ Seguimentos (editar implementado)
├── 🧪 Controle de Ativos (UI completa, dados mockados — aguardando backend)
└── 🚧 Precificação / Relatórios / Configurações (placeholders)
```
