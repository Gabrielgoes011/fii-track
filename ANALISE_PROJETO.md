# Análise do Projeto FIITrack — Backlog, Débitos Técnicos e Roadmap

> Atualizado em 09/07/2026 após merge da branch gabriel-Dev01.

---

## 1. Conceito Multi-usuário — ✅ Implementado

O sistema já opera em modo **multi-usuário real**. Cada usuário logado vê
apenas seus próprios dados. A implementação está presente em todas as camadas:

### O que já foi feito

| Camada | Status | Detalhe |
|---|---|---|
| `verificaToken.js` | ✅ | Decodifica o JWT e injeta `req.user` (com `id`) em toda requisição protegida |
| `rendimentos.repositories.js` | ✅ | Todas as queries filtram por `"idUser"` |
| `meuFundos.repositories.js` | ✅ | `listar`, `cadastrar` e `contar` filtram/gravam com `idUser` |
| `rendimentos.controller.js` | ✅ | Extrai `req.user.id` e passa para o service em todas as funções |
| `meusFundos.controller.js` | ✅ | Passa `idUser` para o service |
| `rendimentos.services.js` | ✅ | Repassa `idUser` para o repositório |
| Rotas de rendimentos | ✅ | `DELETE /rendimentos/:id` e `POST /cardsRendimentos` agora têm `verificaToken` |
| Rota `POST /criarRendimento` | ✅ | Nova rota de lançamento de rendimento implementada |

### O que ainda falta para completar o multi-usuário

| Módulo | O que falta |
|---|---|
| **Operações** | Queries de `listarOperacoes`, `lancarOperacao`, `excluirOperacao` e `carregaDadosGraficoOperacoes` ainda **não filtram por `idUser`** |
| **Seguimentos** | Seguimentos hoje são globais — decidir se serão por usuário ou continuarão globais |
| **Admin** | Criar coluna `perfil` na tabela `usuarios` e middleware `verificaAdmin` para proteger rotas de gestão de usuários |

---

## 2. Conflitos de Merge Resolvidos

O arquivo `rendimentos.repositories.js` e `rendimentos.controller.js` tinham
marcadores de conflito git (`<<<<<<< Updated upstream` / `>>>>>>> Stashed changes`)
que foram resolvidos mantendo a versão com `idUser` (branch gabriel-Dev01).

---

## 3. Migração para 3 Camadas — Status Atual

| Módulo | Controller | Service | Repository | Status |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | Completo |
| Home/Dashboard | ✅ | ✅ | ✅ | Completo |
| Usuários | ✅ (parcial) | ✅ (parcial) | ✅ | Parcialmente migrado |
| Meus FIIs | ✅ | ✅ | ✅ | Completo |
| Rendimentos | ✅ | ✅ | ✅ | Completo |
| Operações KPIs | ✅ | ✅ | ✅ | Completo |
| **Seguimentos** | ❌ acesso direto | ❌ não existe | ❌ não existe | Não migrado |
| **Operações CRUD** | ❌ acesso direto | ❌ não existe | ❌ não existe | Não migrado |

### 3.1 Seguimentos — Não migrado

`seguimentos.controller.js` acessa o banco com `openDb()` direto em todas as funções.
Não existe `seguimentos.services.js` nem `seguimentos.repositories.js`.

| Função | Para service | Para repository |
|---|---|---|
| Validação de campo vazio / duplicata | `seguimentos.services.js` | — |
| `listarSeguimentos` | `listarSeguimentos()` | `findSeguimentos()` |
| `contarSeguimentos` | `contarSeguimentos()` | `countSeguimentos()` |
| `cadastrarSeguimento` | `cadastrarSeguimento()` | `insertSeguimento()` |
| `deleteSeguimento` | `excluirSeguimento()` | `deleteSeguimento()` |
| `updateSeguimento` | `atualizarSeguimento()` | `updateSeguimento()` |

### 3.2 Operações CRUD — Não migrado

`operacoes.controller.js` ainda acessa o banco diretamente para todas as operações de CRUD.
O `operacoes.repositories.js` e `operacoes.services.js` existem mas cobrem apenas os KPIs.

| Função | Para service | Para repository |
|---|---|---|
| `carregaAtivosDropList` | `carregarAtivosDropdown()` | `findAtivosDropdown()` |
| `listarOperacoes` | `listarOperacoes()` + filtro `idUser` | `findOperacoes({ idUser })` |
| `lancarOperacao` | `lancarOperacao()` + grava `idUser` | `insertOperacao()` |
| `carregaDadosGraficoOperacoes` | `carregarGraficoOperacoes()` + filtro `idUser` | `findGraficoOperacoes({ idUser })` |
| `excluirOperacao` | `excluirOperacao()` + verifica `idUser` | `deleteOperacao({ id, idUser })` |

### 3.3 Usuários — Parcialmente migrado

**Migradas:** `listarUsuarios`, `contarUsuarios`, `cadastrarUser`, `onOffUserController`

| Função | Situação |
|---|---|
| `atualizarUser` | Acessa banco direto, marcada como "NÃO MIGRADO", fora das rotas |
| `deleteUser` | Acessa banco direto com transação manual, fora das rotas |

### 3.4 Resquício a limpar

`meusFundos.controller.js` tem `import { openDb }` que não é mais usado — pode remover.

---

## 4. Funcionalidades Incompletas no Front-end

| Módulo | Funcionalidade | Status | Observação |
|---|---|---|---|
| Seguimentos | Editar seguimento | ⚠️ Em desenvolvimento | Lógica comentada no hook, retorna só toast |
| Usuários | Editar usuário | ⚠️ Em desenvolvimento | Retorna só toast informativo |
| Usuários | Resetar senha | ⚠️ Em desenvolvimento | Retorna só toast "será implementado em breve" |

---

## 5. Backlog Geral

### Alta Prioridade

- [ ] **Migrar Operações CRUD para 3 camadas** + adicionar filtro `idUser` em todas as queries
- [ ] **Coluna `perfil` na tabela `usuarios`** + middleware `verificaAdmin`
- [ ] **Ocultar menu "Usuários" no front para não-admins** + guard de rota

### Média Prioridade

- [ ] **Migrar Seguimentos para 3 camadas**
- [ ] **Implementar edição de seguimento** (front + back)
- [ ] **Implementar edição de usuário** (front — back já tem a query)
- [ ] **Implementar reset de senha** (front + back)
- [ ] **Migrar `atualizarUser` e `deleteUser`** e expor nas rotas
- [ ] **Coluna `reinvestido` na tabela `operacoes`**

```sql
ALTER TABLE operacoes
ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false;
```

### Baixa Prioridade / Melhorias

- [ ] Remover `import { openDb }` desnecessário do `meusFundos.controller.js`
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

## 6. Banco de Dados — Alterações Pendentes

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

## 7. Resumo Visual

```
BACK-END
├── ✅ Login (auth)
├── ✅ Home/Dashboard
├── ✅ Usuários (parcial — falta editar/deletar migrados + verificaAdmin)
├── ✅ Meus FIIs (multi-usuário implementado)
├── ✅ Rendimentos (completo — multi-usuário + KPIs + lançamento)
├── ✅ Operações KPIs (GET /kpis-operacoes)
├── ⚠️ Operações CRUD — sem 3 camadas e sem filtro idUser
└── ⚠️ Seguimentos — sem 3 camadas (decisão: global ou por usuário?)

FRONT-END
├── ✅ Login (authService criado)
├── ✅ Dashboard (homeService criado)
├── ✅ Usuários (parcial — editar/resetar não implementados)
├── ✅ Meus FIIs
├── ✅ Seguimentos (parcial — editar não implementado)
├── ✅ Operações
└── ✅ Rendimentos (4 KPIs)
```
