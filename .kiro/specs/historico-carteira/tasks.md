# Implementation Plan: Histórico da Carteira

## Overview

O plano implementa o recurso de forma incremental: primeiro as migrations e o schema (base de tudo), depois as funções puras de cálculo (com PBT), então o módulo `historico` (repository → service → controller → routes), a seguir a integração da gravação da Captura no fluxo existente de `controleAtivos.service`, e por fim a reorganização do frontend em duas abas com gráficos, agrupamento por dia, privacidade e estados de vazio/erro. Cada etapa se apoia na anterior, sem código órfão.

A linguagem de implementação é **JavaScript (Node/Express + React/Vite)**, conforme o design e o projeto existente. Testes property-based usam **fast-check** (mínimo de 100 iterações por propriedade); testes de exemplo/integração usam o runner do projeto e React Testing Library no frontend.

## Tasks

- [x] 1. Criar migrations e permissões das novas tabelas
  - [x] 1.1 Criar migration `db/migrations/004_historico_cotacoes.sql`
    - `CREATE TABLE IF NOT EXISTS public.historico_cotacoes` com colunas `id bigserial PK`, `ticker varchar(10) NOT NULL`, `preco numeric(12,2)`, `fechamentoAnterior numeric(12,2)`, `variacao numeric(12,4)`, `variacaoPerc numeric(8,4)`, `dtPregao timestamptz`, `dtCaptura timestamptz NOT NULL DEFAULT now()`
    - Criar índice `IF NOT EXISTS` em `(ticker, dtCaptura, dtPregao)`
    - `ALTER TABLE ... OWNER TO neondb_owner` e `GRANT SELECT, INSERT, UPDATE, DELETE ... TO app_fiitrack`
    - Sem RLS (dado de mercado compartilhado)
    - _Requirements: 2.2, 2.4, 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Criar migration `db/migrations/005_historico_carteira.sql`
    - `CREATE TABLE IF NOT EXISTS public.historico_carteira_ativo` (`id`, `idUser integer NOT NULL`, `idAtivo integer NOT NULL`, `ticker varchar(10)`, `quantidade numeric(20,8)`, `precoMedio numeric(12,2)`, `custo numeric(14,2)`, `valorMercado numeric(14,2)`, `rentabilidadeRs numeric(14,2)`, `rentabilidadePerc numeric(8,2)`, `proventos numeric(14,2)`, `precoIndisponivel boolean NOT NULL DEFAULT false`, `dtCaptura timestamptz NOT NULL`)
    - `CREATE TABLE IF NOT EXISTS public.historico_carteira_geral` (`id`, `idUser integer NOT NULL`, `custoTotal numeric(16,2)`, `valorMercadoTotal numeric(16,2)`, `rentabilidadeRs numeric(16,2)`, `rentabilidadePerc numeric(8,2)`, `proventosTotais numeric(16,2)`, `dtCaptura timestamptz NOT NULL`)
    - Índices `IF NOT EXISTS` em `(idUser, idAtivo, dtCaptura)` e `(idUser, dtCaptura)`
    - `OWNER neondb_owner` e `GRANT SELECT, INSERT, UPDATE, DELETE ... TO app_fiitrack` para ambas
    - Habilitar RLS + política idempotente por `idUser` (bloco `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_policies ...)`) para as duas tabelas, usando `current_setting('app.current_user_id', true)`
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 1.3 Adicionar as políticas RLS das novas tabelas a `db/RLS.sql`
    - Replicar os blocos idempotentes de `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` de `historico_carteira_ativo` e `historico_carteira_geral` no arquivo fonte-única-de-verdade
    - _Requirements: 7.2, 8.5_

  - [ ]* 1.4 Testes de schema/smoke das migrations
    - Consultar `information_schema.columns` para tabelas/colunas com escalas corretas; `pg_policies` para RLS presente em `historico_carteira_*` e ausente em `historico_cotacoes`; presença de `idUser`
    - Verificar idempotência: executar `004`/`005` duas vezes sem falha e sem duplicar políticas (Requirements 8.2, 8.5)
    - _Requirements: 2.2, 2.4, 7.1, 8.1, 8.3, 8.4_

- [x] 2. Implementar funções puras de cálculo no `historico.service`
  - [x] 2.1 Criar `src/modules/historico/historico.service.js` com `calcularSnapshotAtivo(posicaoAtivo, cotacao)`
    - `valorMercado = preco != null ? round2(quantidade * preco) : custo`; `precoIndisponivel = (preco == null)`
    - `rentabilidadeRs = round2(valorMercado - custo)`; `rentabilidadePerc = custo > 0 ? round2(((valorMercado - custo)/custo)*100) : 0`
    - Definir helper `round2` interno
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 2.2 Property test de `calcularSnapshotAtivo`
    - **Property 3: Cálculo do Snapshot_por_Ativo**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7**
    - Geradores: quantidade até 8 casas, custo incluindo 0, preço incluindo `null`; tag `// Feature: historico-carteira, Property 3: ...`; mínimo 100 iterações
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 2.3 Implementar `calcularSnapshotGeral(snapshotsAtivo)`
    - Somas de `custoTotal`, `valorMercadoTotal`, `proventosTotais` arredondadas para 2 casas; carteira vazia → todos zero
    - Rentabilidade total em R$ e % derivadas dos agregados
    - _Requirements: 3.2, 3.8, 3.9_

  - [ ]* 2.4 Property test de `calcularSnapshotGeral`
    - **Property 4: Consistência do Snapshot_Geral com os snapshots por ativo**
    - **Validates: Requirements 3.8, 3.9**
    - Incluir gerador de carteira vazia; tag `// Feature: historico-carteira, Property 4: ...`; mínimo 100 iterações
    - _Requirements: 3.8, 3.9_

  - [x] 2.5 Implementar `calcularVariacoes(serie, extrairValor)`
    - Primeiro ponto: `variacaoRs/variacaoPerc/direcao` indefinidas
    - `variacaoRs = round2(v_i - v_{i-1})`; `variacaoPerc = v_{i-1} != 0 ? round2(((v_i - v_{i-1})/v_{i-1})*100) : indefinida`
    - `direcao`: `subiu` se diff > 0.01; `desceu` se diff < -0.01; senão `estável`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 2.6 Property test de `calcularVariacoes`
    - **Property 5: Cálculo de variação de série**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
    - Geradores: séries com valores anteriores 0 e diferenças no limiar de 0.01; tag `// Feature: historico-carteira, Property 5: ...`; mínimo 100 iterações
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 2.7 Implementar `agruparPorDia(pontos, timeZone = 'America/Sao_Paulo')`
    - Particiona por data-calendário no fuso; mantém, por dia, o ponto de maior `dtCaptura`
    - _Requirements: 5.4_

  - [ ]* 2.8 Property test de `agruparPorDia`
    - **Property 11: Agrupamento por dia seleciona a Captura mais recente**
    - **Validates: Requirements 5.4**
    - Geradores: timestamps atravessando limites de dia (virada de meia-noite, UTC vizinhos); tag `// Feature: historico-carteira, Property 11: ...`; mínimo 100 iterações
    - _Requirements: 5.4_

- [x] 3. Checkpoint - cálculos puros validados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar o `historico.repository` (gravação e consulta)
  - [x] 4.1 Criar `src/modules/historico/historico.repository.js` — leitura de posição e inserções append-only
    - `getPosicaoCarteira(idUser)` reaproveitando as CTEs de `getControleAtivosRepo` (quantidade/precoMedio/custo/proventos por ativo)
    - `inserirHistoricoCotacoes(itens)`, `inserirSnapshotsAtivo(itens)`, `inserirSnapshotGeral(registro)` — todos `INSERT` puros (sem UPSERT), preservando precisão dos valores de mercado
    - Usar o contexto `req.db`/`dbContext` do request para manter transação/RLS
    - _Requirements: 1.2, 1.3, 5.5, 7.1_

  - [x] 4.2 Implementar consultas do repository com filtro de período e ordenação
    - `listarHistoricoCotacoes(ticker, periodo)` ordenado por `dtCaptura ASC, dtPregao ASC` (sem RLS)
    - `listarSnapshotGeral(idUser, periodo)` e `listarSnapshotAtivo(idUser, idAtivo, periodo)` ordenados por `dtCaptura ASC` (com RLS)
    - Filtro `de <= dtCaptura <= ate` quando período informado
    - _Requirements: 2.1, 2.3, 2.5, 3.10, 3.11, 7.3_

  - [ ]* 4.3 Property tests de ordenação e filtro do repository (repositório em memória/mocado)
    - **Property 6: Ordenação do histórico de ticker** — **Validates: Requirements 2.1**
    - **Property 7: Ordenação do histórico de patrimônio** — **Validates: Requirements 3.10**
    - **Property 8: Filtro de período** — **Validates: Requirements 2.3, 2.5**
    - Um teste por propriedade; tags `// Feature: historico-carteira, Property {6|7|8}: ...`; mínimo 100 iterações
    - _Requirements: 2.1, 2.3, 2.5, 3.10_

  - [ ]* 4.4 Property tests de gravação/round-trip (repositório de teste)
    - **Property 1: Round-trip de gravação de Historico_Cotacoes preserva precisão** — **Validates: Requirements 1.2**
    - **Property 2: Snapshots de uma Captura compartilham o mesmo instante** — **Validates: Requirements 1.3**
    - **Property 12: Gravação é append-only (registros brutos preservados)** — **Validates: Requirements 5.5**
    - Um teste por propriedade; tags `// Feature: historico-carteira, Property {1|2|12}: ...`; mínimo 100 iterações
    - _Requirements: 1.2, 1.3, 5.5_

- [x] 5. Implementar `registrarCaptura` e as consultas de negócio no `historico.service`
  - [x] 5.1 Implementar `registrarCaptura(idUser, cotacoesPorTicker, dtCaptura)`
    - Ler posição via `getPosicaoCarteira`; se carteira vazia, concluir sem gravar e retornar resultado vazio (Requirement 1.5, 3.9)
    - Montar itens de `Historico_Cotacoes`; calcular `Snapshot_por_Ativo` (via `calcularSnapshotAtivo`) e `Snapshot_Geral` (via `calcularSnapshotGeral`) com o mesmo `dtCaptura`
    - Persistir via repository (append-only); tratar preço indisponível (`precoIndisponivel = true`, `valorMercado = custo`) sem interromper os demais
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.2, 3.4, 3.8, 3.9_

  - [x] 5.2 Implementar consultas `getHistoricoTicker`, `getHistoricoPatrimonio`, `getHistoricoAtivo`
    - Chamar o repository, aplicar `calcularVariacoes` para anexar `variacaoRs/variacaoPerc/direcao` por ponto; retornar lista vazia quando não há registros
    - _Requirements: 2.1, 2.5, 3.10, 3.11, 4.1_

  - [ ]* 5.3 Testes de exemplo de `registrarCaptura` (brapi/cache mockados)
    - 1.1 (uma Captura por acionamento; `dtCaptura ≈ now` com tolerância de segundos)
    - 1.4 (cache fresco: brapi não é chamada), 1.6 (fallback com cache + `console.error` dos tickers), 1.7 (ticker sem cotação omitido + log)
    - _Requirements: 1.1, 1.4, 1.6, 1.7_

- [x] 6. Implementar `historico.controller` e `historico.routes`
  - [x] 6.1 Criar `src/modules/historico/historico.controller.js` com validação de parâmetros
    - Validar ticker (não vazio, ≤ 10 caracteres) → `apiResponse.validationError` sem tocar o banco
    - Validar período (datas interpretáveis, `de <= ate`) → erro de período inválido sem tocar o banco
    - Traduzir resultados/erros via `apiResponse`/`pgErrorHandler`
    - _Requirements: 2.6, 2.7_

  - [x] 6.2 Criar `src/modules/historico/historico.routes.js` e registrar no app
    - `GET /historico/cotacoes/:ticker`, `GET /historico/patrimonio`, `GET /historico/patrimonio/:idAtivo`, todas com `verificaToken` + `rlsMiddleware`
    - Registrar o router em `src/app.js`
    - _Requirements: 2.1, 3.10, 7.3, 7.4_

  - [ ]* 6.3 Property tests de validação de parâmetros (controller)
    - **Property 9: Rejeição de ticker inválido** — **Validates: Requirements 2.6**
    - **Property 10: Rejeição de período inválido** — **Validates: Requirements 2.7**
    - Um teste por propriedade; tags `// Feature: historico-carteira, Property {9|10}: ...`; mínimo 100 iterações
    - _Requirements: 2.6, 2.7_

  - [ ]* 6.4 Teste de exemplo de autenticação
    - 7.4 (requisição sem token → 401 sem retornar dados de Historico_Carteira)
    - _Requirements: 7.4_

- [x] 7. Integrar a gravação da Captura no fluxo existente de cotações
  - [x] 7.1 Chamar `registrarCaptura` de dentro de `getCotacoesCarteiraService`
    - Após montar o mapa de cotações (cache + brapi), invocar `registrarCaptura(idUser, cotacoes, dtCaptura)` na mesma transação/contexto RLS do request, com `dtCaptura` = horário do servidor no acionamento
    - Não exigir segunda chamada do frontend; preservar o retorno `{ cotacoes, atualizadoEm }`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 7.2 Testes de integração de RLS e migrations (banco real/container)
    - 7.2/7.3: dois usuários enxergam apenas seus próprios registros de `Historico_Carteira`
    - 8.2/8.5: reexecutar `004`/`005` não falha, não duplica políticas e mantém RLS habilitado
    - _Requirements: 7.2, 7.3, 8.2, 8.5_

- [x] 8. Checkpoint - backend completo e integrado
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Reorganizar a tela de Controle de Ativos em duas abas (frontend)
  - [x] 9.1 Introduzir abas em `pages/controleAtivos/controleAtivos.jsx`
    - Renderizar componente de abas "Carteira de FIIs" (conteúdo atual, inalterado) e "Histórico da Carteira" (nova); aba inicial ativa = "Carteira de FIIs"
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 Criar serviço e hook de dados históricos
    - `services/controleAtivos/historicoService.js` consumindo `GET /historico/patrimonio` e `GET /historico/cotacoes/:ticker`
    - `hooks/controleAtivos/useHistoricoCarteira.js` com estados carregando/vazio/erro e função de retry
    - _Requirements: 5.3, 5.7, 5.8_

  - [x] 9.3 Implementar a aba "Histórico da Carteira" com gráficos e agrupamento por dia
    - `HistoricoPatrimonioChart` (série de patrimônio) e `HistoricoTickerChart` + seletor de ativo, reutilizando `components/Charts/AreaChart.jsx`
    - Ordenação cronológica (antigo → recente); aplicar `agruparPorDia` client-side em `America/Sao_Paulo`
    - Indicador visual de direção (alta/baixa/neutra) por ponto
    - _Requirements: 5.3, 5.4, 5.6_

  - [x] 9.4 Aplicar privacidade e estados de vazio/erro
    - Marcar todos os valores financeiros com `ValorPrivado`/classe `.vp`, reagindo ao `PrivacyContext`
    - Estado vazio: mensagem "sem dados históricos" sem gráfico vazio; estado de erro: mensagem + botão "tentar novamente"
    - _Requirements: 5.7, 5.8, 6.1, 6.2, 6.3_

  - [ ]* 9.5 Testes de UI da aba Histórico (React Testing Library, dados mockados)
    - 5.1/5.2 (abas nomeadas, aba inicial ativa, conteúdo da carteira preservado)
    - 5.3 (séries renderizadas ordenadas), 5.6 (marcação de direção por ponto)
    - 5.7 (estado vazio), 5.8 (estado de erro com "tentar novamente")
    - 6.1/6.2/6.3 (classe `.vp`/blur e reação ao toggle de privacidade)
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3_

- [x] 10. Checkpoint final - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- Os checkpoints garantem validação incremental (cálculos puros, backend integrado, UI).
- Testes property-based (fast-check, mínimo 100 iterações) validam as Propriedades 1–12; cada propriedade tem seu próprio sub-task com a tag `Feature: historico-carteira, Property N: ...`.
- Testes de exemplo/integração cobrem cache/fallback (1.4, 1.6, 1.7), autenticação (7.4), RLS (7.2, 7.3), idempotência de migrations (8.2, 8.5) e UI (5.x, 6.x).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "2.3", "2.5", "2.7"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.2", "2.4", "2.6", "2.8", "4.1"] },
    { "id": 2, "tasks": ["4.2", "4.4", "5.1"] },
    { "id": 3, "tasks": ["4.3", "5.2", "5.3", "6.1"] },
    { "id": 4, "tasks": ["6.2", "9.1", "9.2"] },
    { "id": 5, "tasks": ["6.3", "6.4", "7.1", "9.3"] },
    { "id": 6, "tasks": ["7.2", "9.4"] },
    { "id": 7, "tasks": ["9.5"] }
  ]
}
```
