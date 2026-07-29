# FIITrack — Análise do Projeto, Backlog e Débitos Técnicos

> Atualizado em 09/07/2026 após merge da branch gabriel-Dev01.
>
> Documentação de desenvolvimento: [`fii-track-front/PADROES.md`](fii-track-front/PADROES.md) | [`fii-track-back/GUIA_DESENVOLVIMENTO.md`](fii-track-back/GUIA_DESENVOLVIMENTO.md)

---

## 1. Status do Multi-usuário

O sistema já opera em modo **multi-usuário real**. Cada usuário vê apenas seus próprios dados.

### Implementado ✅

| Camada | Detalhe |
|---|---|
| `verificaToken.js` | Decodifica o JWT e injeta `req.user.id` em toda requisição protegida |
| `rendimentos.repositories.js` | Todas as queries filtram por `idUser` |
| `meuFundos.repositories.js` | `listar`, `cadastrar` e `contar` filtram/gravam com `idUser` |
| `rendimentos.controller.js` | Extrai `req.user.id` e passa para o service |
| `meusFundos.controller.js` | Passa `idUser` para o service |
| Rotas de rendimentos | `DELETE /rendimentos/:id` e `POST /cardsRendimentos` protegidas com `verificaToken` |

### Falta completar ⚠️

| Módulo | O que falta |
|---|---|
| **Operações** | `listarOperacoes`, `lancarOperacao`, `excluirOperacao` e `carregaDadosGraficoOperacoes` não filtram por `idUser` |
| **Seguimentos** | Globais hoje — decidir se serão por usuário ou continuarão globais |
| **Admin** | Criar coluna `perfil` na tabela `usuarios` + middleware `verificaAdmin` |

---

## 2. Status da Migração para 3 Camadas (Controller → Service → Repository)

| Módulo | Controller | Service | Repository | Status |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | Completo |
| Home/Dashboard | ✅ | ✅ | ✅ | Completo |
| Meus FIIs | ✅ | ✅ | ✅ | Completo |
| Rendimentos | ✅ | ✅ | ✅ | Completo |
| Operações KPIs | ✅ | ✅ | ✅ | Completo |
| Usuários | ✅ parcial | ✅ parcial | ✅ | Parcial — falta `atualizarUser` e `deleteUser` |
| **Seguimentos** | ❌ direto no DB | ❌ não existe | ❌ não existe | Não migrado |
| **Operações CRUD** | ❌ direto no DB | ❌ não existe | ❌ não existe | Não migrado |

### Seguimentos — o que migrar

| Função atual | Service | Repository |
|---|---|---|
| Validação de campo / duplicata | `seguimentos.services.js` | — |
| `listarSeguimentos` | `listarSeguimentos()` | `findSeguimentos()` |
| `contarSeguimentos` | `contarSeguimentos()` | `countSeguimentos()` |
| `cadastrarSeguimento` | `cadastrarSeguimento()` | `insertSeguimento()` |
| `deleteSeguimento` | `excluirSeguimento()` | `deleteSeguimento()` |
| `updateSeguimento` | `atualizarSeguimento()` | `updateSeguimento()` |

### Operações CRUD — o que migrar

| Função atual | Service | Repository |
|---|---|---|
| `carregaAtivosDropList` | `carregarAtivosDropdown()` | `findAtivosDropdown()` |
| `listarOperacoes` | `listarOperacoes()` + filtro `idUser` | `findOperacoes({ idUser })` |
| `lancarOperacao` | `lancarOperacao()` + grava `idUser` | `insertOperacao()` |
| `carregaDadosGraficoOperacoes` | `carregarGraficoOperacoes()` + filtro `idUser` | `findGraficoOperacoes({ idUser })` |
| `excluirOperacao` | `excluirOperacao()` + verifica `idUser` | `deleteOperacao({ id, idUser })` |

### Usuários — o que falta

| Função | Situação |
|---|---|
| `atualizarUser` | Acessa banco direto, fora das rotas |
| `deleteUser` | Acessa banco direto com transação manual, fora das rotas |

---

## 3. Funcionalidades Incompletas no Frontend

| Módulo | Funcionalidade | Observação |
|---|---|---|
| Seguimentos | Editar seguimento | Lógica comentada no hook, retorna só toast |
| Usuários | Editar usuário | Retorna só toast informativo |
| Usuários | Resetar senha | Retorna só toast "será implementado em breve" |

---

## 4. Backlog

### Alta Prioridade

- [ ] **Migrar Operações CRUD para 3 camadas** + filtro `idUser` em todas as queries
- [ ] **Cards de Operações** — adicionar `totalAportado`, `totalVendido` e `capitalLiquido` na tela de Operações (spec abaixo)
- [ ] **Coluna `perfil` na tabela `usuarios`** + middleware `verificaAdmin`
- [ ] **Ocultar menu "Usuários" para não-admins** no frontend + guard de rota

### Média Prioridade

- [ ] **Migrar Seguimentos para 3 camadas**
- [ ] **Implementar edição de seguimento** (front + back)
- [ ] **Implementar edição de usuário** (front — back já tem a query)
- [ ] **Implementar reset de senha** (front + back)
- [ ] **Migrar `atualizarUser` e `deleteUser`** e expor nas rotas
- [ ] **Coluna `reinvestido` na tabela `operacoes`**

### Baixa Prioridade / Melhorias

- [ ] Remover `import { openDb }` não utilizado do `meusFundos.controller.js`
- [ ] Remover `console.log(id, newValue)` de debug em `usuarios.repositories.js`
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato em lote (multer + S3 já configurados)
- [ ] Rota de refresh de token JWT
- [ ] Endpoint de relatório consolidado por período
- [ ] Posição consolidada da carteira (preço médio, quantidade, valor atual)
- [ ] Integração com API externa para cotação em tempo real
- [ ] Testes automatizados
- [ ] Dockerização
- [ ] Documentação Swagger / OpenAPI

---

## 5. Banco de Dados — Alterações Pendentes

```sql
-- 1. Perfil do usuário (admin/user)
ALTER TABLE usuarios
ADD COLUMN perfil VARCHAR(20) NOT NULL DEFAULT 'user';

UPDATE usuarios SET perfil = 'admin' WHERE id = <id_do_admin>;

-- 2. Flag de reinvestimento nas operações
ALTER TABLE operacoes
ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false;
```

---

## 6. Spec — Cards de Operações

> Feature de alta prioridade. Adicionar três cards na tela de Operações seguindo o padrão visual de Rendimentos.

### Indicadores

| Card | Fórmula | Cor sugerida |
|---|---|---|
| Total aportado | `SUM(quantidade * preco)` onde `tipo = 'Compra'` | Verde/Azul |
| Total vendido | `SUM(quantidade * preco)` onde `tipo = 'Venda'` | Laranja/Vermelho discreto |
| Capital líquido | `totalAportado - totalVendido` | Ciano/Amarelo |

Os cards acompanham os filtros de `ano` e `mes` da tela. Quando não há dados, exibem `R$ 0,00`.

### Contrato da API

```
POST /cardsOperacoes
```

Requisição:
```json
{ "mes": "Todos", "ano": 2026 }
```

Resposta:
```json
{ "totalAportado": 1500.00, "totalVendido": 500.00, "capitalLiquido": 1000.00 }
```

### Query sugerida (backend)

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
- `operacoes.repositories.js` — adicionar `getCardsOperacoes({ idUser, ano, mes })`
- `operacoes.services.js` — adicionar `cardsOperacoes({ idUser, ano, mes })`
- `operacoes.controller.js` — adicionar `getCardsOperacoes`
- `operacoes.routes.js` — registrar `POST /cardsOperacoes` com `verificaToken`

**Frontend:**
- `operacoesService.js` — adicionar método `cardsOperacoes({ mes, ano })`
- `useOperacoes.js` — adicionar estado `cardsOperacoes`, `loadingCards` e função `getCardsOperacoes`
- `operacoes.jsx` — renderizar os 3 cards acima do gráfico

### Ajuste em Rendimentos (após cards de Operações prontos)

Avaliar renomear o card atual "Total Investido" → "Total Aportado" (campo interno `totalCompras`). O cálculo do YoC não muda — continua usando o total histórico de compras como base.

---

## 7. Resumo Visual

```
BACK-END
├── ✅ Login
├── ✅ Home/Dashboard
├── ✅ Meus FIIs (multi-usuário)
├── ✅ Rendimentos (multi-usuário + KPIs + lançamento)
├── ✅ Operações KPIs
├── ⚠️  Usuários (parcial — falta editar/deletar migrados + verificaAdmin)
├── ⚠️  Operações CRUD (sem 3 camadas, sem idUser)
└── ⚠️  Seguimentos (sem 3 camadas)

FRONT-END
├── ✅ Login
├── ✅ Dashboard
├── ✅ Meus FIIs
├── ✅ Operações
├── ✅ Rendimentos
├── ⚠️  Usuários (parcial — editar/resetar não implementados)
├── ⚠️  Seguimentos (parcial — editar não implementado)
└── 🚧 Controle de Ativos / Precificação / Relatórios / Configurações
```
