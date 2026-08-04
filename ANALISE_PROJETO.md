# FIITrack — Análise do Projeto, Backlog e Débitos Técnicos

> Última atualização: **30/07/2026**
>
> Documentação de desenvolvimento: [`fii-track-front/PADROES.md`](fii-track-front/PADROES.md) | [`fii-track-back/GUIA_DESENVOLVIMENTO.md`](fii-track-back/GUIA_DESENVOLVIMENTO.md)

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
| **Admin** | Criar coluna `perfil` na tabela `usuarios` + middleware `verificaAdmin` para proteger rotas de gestão |

---

## 2. Status da Migração para 3 Camadas (Controller → Service → Repository)

| Módulo | Controller | Service | Repository | Status |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ Completo |
| Home/Dashboard | ✅ | ✅ | ✅ | ✅ Completo |
| Meus FIIs | ✅ | ✅ | ✅ | ✅ Completo (inclui `contarFundosAtivos`) |
| Rendimentos | ✅ | ✅ | ✅ | ✅ Completo (CRUD + KPIs `/cardsRendimentos`) |
| Operações (CRUD + Gráfico) | ✅ | ✅ | ✅ | ✅ Completo — falta apenas o endpoint de cards (seção 6) |
| Usuários | ✅ parcial | ✅ parcial | ✅ | ⚠️ Parcial — `atualizarUser` e `deleteUser` ainda direto no controller |
| **Seguimentos** | ❌ direto no DB | ❌ não existe | ❌ não existe | ❌ Não migrado |

### Seguimentos — o que migrar

`seguimentos.controller.js` ainda usa `openDb()` direto. Não há `seguimentos.services.js` nem `seguimentos.repositories.js`.

| Função atual | Para service | Para repository |
|---|---|---|
| Validação de campo / duplicata | `seguimentos.services.js` | — |
| `listarSeguimentos` | `listarSeguimentos()` | `findSeguimentos()` |
| `contarSeguimentos` | `contarSeguimentos()` | `countSeguimentos()` |
| `cadastrarSeguimento` | `cadastrarSeguimento()` | `insertSeguimento()` |
| `deleteSeguimento` | `excluirSeguimento()` | `deleteSeguimento()` |
| `updateSeguimento` | `atualizarSeguimento()` | `updateSeguimento()` |

### Usuários — o que falta migrar

| Função | Situação |
|---|---|
| `atualizarUser` | Acessa banco direto, fora do padrão. **Bug:** ainda referencia a tabela antiga `dbo."tabUser"` em vez de `usuarios` — o endpoint `PUT /users/update/:id` está quebrado em produção |
| `deleteUser` | Acessa banco direto com transação manual, fora do padrão |

---

## 3. Funcionalidades Incompletas no Frontend

| Módulo | Funcionalidade | Observação |
|---|---|---|
| Seguimentos | Editar seguimento | Lógica comentada no hook (`handleUpdateSeguimento`), retorna só toast |
| Usuários | Editar usuário | Retorna só toast informativo (`handleUpdateUser`) |
| Usuários | Resetar senha | Retorna só toast "será implementado em breve" |
| Controle de Ativos | Integração com backend | Tela 100% construída (KPIs, tabela de 16 colunas, inputs editáveis, badges) mas rodando inteiramente sobre `MOCK_DATA` em `useControleAtivos.js` — não existe backend ainda (ver seção 7) |

---

## 4. Backlog

### Alta Prioridade

- [ ] **Cards de Operações** — `totalAportado`, `totalVendido` e `capitalLiquido` na tela de Operações (spec na seção 6)
- [ ] **Corrigir `atualizarUser`** — query usa `dbo."tabUser"` (tabela que não existe mais), precisa apontar para `usuarios`
- [ ] **Backend de Controle de Ativos** — o frontend já está pronto e aguardando os endpoints reais (spec completa em [`SPEC_CONTROLE_ATIVOS.md`](fii-track-front/src/pages/controleAtivos/SPEC_CONTROLE_ATIVOS.md))
- [ ] **Coluna `perfil` na tabela `usuarios`** + middleware `verificaAdmin`
- [ ] **Ocultar menu "Usuários" para não-admins** no frontend + guard de rota

### Média Prioridade

- [ ] **Migrar Seguimentos para 3 camadas** (service + repository)
- [ ] **Implementar edição de seguimento** (front + back — back já tem a query no controller)
- [ ] **Implementar edição de usuário** (front — back já tem `atualizarUser`, mas está com bug de tabela — corrigir antes de expor no front)
- [ ] **Implementar reset de senha** (front + back)
- [ ] **Migrar `atualizarUser` e `deleteUser`** para service/repository e expor nas rotas
- [ ] **Resolver dependência quebrada do S3** — `src/config/s3.js` importa `@aws-sdk/client-s3`, mas o pacote não está mais no `package.json`/`node_modules`. Ninguém importa `s3.js` hoje, então não quebra em runtime, mas vai quebrar assim que alguém tentar usar upload. Decidir: reinstalar a dependência ou remover o arquivo morto

### Baixa Prioridade / Melhorias

- [ ] Remover `console.log(id, newValue)` de debug em `onOffUserRepository` (`usuarios.repositories.js`)
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato em lote (multer + S3 já configurados, mas não conectados a nenhuma rota)
- [ ] Rota de refresh de token JWT
- [ ] Endpoint de relatório consolidado por período
- [ ] Integração com API externa (Brapi) para cotação em tempo real — necessária para o backend de Controle de Ativos
- [ ] Testes automatizados
- [ ] Dockerização
- [ ] Documentação Swagger / OpenAPI

---

## 5. Banco de Dados — Alterações Pendentes

```sql
-- 1. Perfil do usuário (admin/user) — ainda não existe
ALTER TABLE usuarios
ADD COLUMN perfil VARCHAR(20) NOT NULL DEFAULT 'user';

UPDATE usuarios SET perfil = 'admin' WHERE id = <id_do_admin>;

-- 2. Tabela de metas por ativo — necessária para o backend de Controle de Ativos
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
├── ⚠️  Usuários (3 camadas parcial — falta atualizarUser/deleteUser + verificaAdmin; atualizarUser com bug de tabela)
├── ❌  Seguimentos (acesso direto ao DB — sem service/repository)
└── ❌  Controle de Ativos (não existe — frontend aguardando)

FRONT-END
├── ✅ Login
├── ✅ Dashboard
├── ✅ Meus FIIs
├── ✅ Operações
├── ✅ Rendimentos (KPIs + Efeito Bola de Neve)
├── ⚠️  Usuários (editar/resetar não implementados)
├── ⚠️  Seguimentos (editar não implementado)
├── 🧪 Controle de Ativos (UI completa, dados mockados — aguardando backend)
└── 🚧 Precificação / Relatórios / Configurações (placeholders)
```
