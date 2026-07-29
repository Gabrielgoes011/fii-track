# FIITrack — Análise do Projeto, Backlog e Débitos Técnicos

> Última atualização: **28/07/2026**
>
> Documentação de desenvolvimento: [`fii-track-front/PADROES.md`](fii-track-front/PADROES.md) | [`fii-track-back/GUIA_DESENVOLVIMENTO.md`](fii-track-back/GUIA_DESENVOLVIMENTO.md)

---

## 1. Status do Multi-usuário

O sistema opera em modo **multi-usuário real**. Cada usuário vê apenas seus próprios dados.

### Implementado ✅

| Módulo | Detalhe |
|---|---|
| `verificaToken.js` | Decodifica o JWT e injeta `req.user.id` em toda requisição protegida |
| Rendimentos | Todas as queries filtram por `idUser` — completo |
| Meus FIIs | `listar`, `cadastrar`, `contar` filtram/gravam com `idUser` |
| Operações | `listarOperacoes`, `lancarOperacao`, `excluirOperacao` e gráfico filtram por `idUser` ✅ |
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
| Meus FIIs | ✅ | ✅ | ✅ | ✅ Completo |
| Rendimentos | ✅ | ✅ | ✅ | ✅ Completo |
| Operações (CRUD + KPIs + Gráfico) | ✅ | ✅ | ✅ | ✅ Completo |
| Usuários | ✅ parcial | ✅ parcial | ✅ | ⚠️ Parcial — falta `atualizarUser` e `deleteUser` |
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
| `atualizarUser` | Acessa banco direto, fora das rotas (marcado como "NÃO MIGRADO" no controller) |
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

- [ ] **Cards de Operações** — `totalAportado`, `totalVendido` e `capitalLiquido` na tela de Operações (spec na seção 6)
- [ ] **Coluna `perfil` na tabela `usuarios`** + middleware `verificaAdmin`
- [ ] **Ocultar menu "Usuários" para não-admins** no frontend + guard de rota

### Média Prioridade

- [ ] **Migrar Seguimentos para 3 camadas** (service + repository)
- [ ] **Implementar edição de seguimento** (front + back — back já tem a query no controller)
- [ ] **Implementar edição de usuário** (front — back já tem `atualizarUser`, só precisa expor na rota)
- [ ] **Implementar reset de senha** (front + back)
- [ ] **Migrar `atualizarUser` e `deleteUser`** para service/repository e expor nas rotas
- [ ] **Coluna `reinvestido` na tabela `operacoes`** (ver SQL na seção 5)

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

### Ajuste em Rendimentos (pós-implementação)

Avaliar renomear o card "Total Investido" → "Total Aportado" (campo `totalCompras`). O cálculo do YoC não muda.

---

## 7. Resumo Visual

```
BACK-END
├── ✅ Login
├── ✅ Home/Dashboard
├── ✅ Meus FIIs (multi-usuário + 3 camadas)
├── ✅ Rendimentos (multi-usuário + 3 camadas + KPIs + lançamento)
├── ✅ Operações (multi-usuário + 3 camadas — CRUD + KPIs + Gráfico)
├── ⚠️  Usuários (3 camadas parcial — falta atualizarUser/deleteUser + verificaAdmin)
└── ❌  Seguimentos (acesso direto ao DB — sem service/repository)

FRONT-END
├── ✅ Login
├── ✅ Dashboard
├── ✅ Meus FIIs
├── ✅ Operações
├── ✅ Rendimentos
├── ⚠️  Usuários (editar/resetar não implementados)
├── ⚠️  Seguimentos (editar não implementado)
└── 🚧 Controle de Ativos / Precificação / Relatórios / Configurações
```
