# Melhoria — Cards de Operações

> Especificação para adicionar indicadores financeiros à tela de Operações do FII Track.
>
> Objetivo: concentrar na tela de Operações os valores relacionados à movimentação de compra e venda, mantendo a tela de Rendimentos focada em proventos, YoC e efeito bola de neve.

---

## Escopo da primeira entrega

Adicionar três cards à página de Operações, seguindo o padrão visual dos cards da página de Rendimentos:

1. **Total aportado**
2. **Total vendido**
3. **Capital líquido**

Os cards devem acompanhar os filtros de **ano** e **mês** selecionados na tela.

### Fora do escopo inicial

O indicador **Custo da carteira atual** não deve ser implementado nesta primeira etapa. Ele exige uma regra formal para considerar vendas parciais, como:

- custo médio; ou
- método FIFO (primeiro ativo comprado, primeiro ativo baixado).

Esse indicador deve ser tratado em uma melhoria separada, depois que a regra de cálculo for definida.

---

## Motivação

Atualmente, o card **Total Investido** da tela de Rendimentos soma todas as compras históricas. Esse valor é útil para calcular o YoC, mas representa uma movimentação de capital e não um rendimento.

Por isso:

- os indicadores de compra e venda devem ficar em **Operações**;
- o card de Rendimentos deve deixar de ser interpretado como posição atual;
- o nome **Total Aportado** deve ser usado para deixar claro que o valor representa a soma das compras históricas.

---

## Definição dos indicadores

### 1. Total aportado

Soma do valor de todas as operações de compra do usuário dentro do período filtrado.

```text
Total aportado = soma(quantidade * preco) das operações tipo Compra
```

Exemplo:

- Compra de R$ 1.000,00
- Compra de R$ 500,00

**Total aportado:** R$ 1.500,00

---

### 2. Total vendido

Soma do valor de todas as operações de venda do usuário dentro do período filtrado.

```text
Total vendido = soma(quantidade * preco) das operações tipo Venda
```

Exemplo:

- Venda de R$ 300,00
- Venda de R$ 200,00

**Total vendido:** R$ 500,00

> Importante: o total vendido representa o valor bruto das vendas. Ele não representa lucro ou prejuízo, pois não desconta o custo de aquisição dos ativos.

---

### 3. Capital líquido

Diferença entre o total aportado e o total vendido no período filtrado.

```text
Capital líquido = total aportado - total vendido
```

Exemplo:

- Total aportado: R$ 1.500,00
- Total vendido: R$ 500,00

**Capital líquido:** R$ 1.000,00

Esse indicador representa a movimentação financeira líquida registrada no período. Ele não deve ser chamado de custo da carteira atual.

---

## Regras de filtro

Os três cards devem usar os mesmos filtros da tabela e do gráfico da tela de Operações:

- `ano`: obrigatório;
- `mes`: mês de `1` a `12` ou `Todos`;
- `idUser`: obtido pelo token autenticado, nunca recebido livremente do frontend.

Quando o mês for `Todos`, a consulta deve considerar todos os meses do ano selecionado.

Quando não existirem operações no filtro escolhido, os três valores devem retornar `0`.

---

## Contrato sugerido da API

### Rota

```text
POST /cardsOperacoes
```

A rota deve usar o middleware de autenticação já utilizado pelas rotas de Operações.

### Requisição

```json
{
  "mes": "Todos",
  "ano": 2026
}
```

### Resposta

```json
{
  "totalAportado": 1500.00,
  "totalVendido": 500.00,
  "capitalLiquido": 1000.00
}
```

Os valores devem ser numéricos e normalizados para `0` quando a soma SQL retornar `NULL`.

---

## Implementação no backend

### 1. Repository ou camada de acesso a dados

Criar uma consulta agregada para a tabela `operacoes`, usando:

- `quantidade * preco` como valor da operação;
- `tipo = 'Compra'` para o total aportado;
- `tipo = 'Venda'` para o total vendido;
- filtro por `idUser`;
- filtro por ano;
- filtro opcional por mês.

Exemplo de consulta:

```sql
SELECT
  COALESCE(SUM(CASE
    WHEN tipo = 'Compra' THEN quantidade * preco
    ELSE 0
  END), 0) AS "totalAportado",
  COALESCE(SUM(CASE
    WHEN tipo = 'Venda' THEN quantidade * preco
    ELSE 0
  END), 0) AS "totalVendido",
  COALESCE(SUM(CASE
    WHEN tipo = 'Compra' THEN quantidade * preco
    WHEN tipo = 'Venda' THEN -(quantidade * preco)
    ELSE 0
  END), 0) AS "capitalLiquido"
FROM operacoes
WHERE "idUser" = $1
  AND EXTRACT(YEAR FROM "dtOperacao") = $2
  AND ($3 IS NULL OR EXTRACT(MONTH FROM "dtOperacao") = $3);
```

Os parâmetros devem continuar sendo parametrizados. Não concatenar valores recebidos do usuário diretamente na query.

### 2. Service

Criar uma função de serviço para validar o ano, normalizar o mês e retornar os três indicadores.

Responsabilidades:

- validar `ano`;
- converter `Todos` para `null`;
- chamar o repository;
- calcular ou retornar o `capitalLiquido`;
- padronizar os valores numéricos.

### 3. Controller

Criar um controller semelhante ao `getCardsRendimentos`:

- obter `idUser` de `req.user.id`;
- sanitizar `mes` e `ano`;
- chamar o service;
- retornar status HTTP `200` com o objeto dos cards;
- retornar erro apropriado quando o ano for inválido ou ausente.

### 4. Route

Registrar a rota em:

```text
fii-track-back/src/routes/operacoes.routes.js
```

A rota deve ser protegida pelo middleware de autenticação.

---

## Implementação no frontend

### 1. Service

Adicionar em:

```text
fii-track-front/src/services/operacoes/operacoesService.jsx
```

Um método para chamar `POST /cardsOperacoes`, seguindo o padrão usado por `cardsRendimentos`.

### 2. Hook

Atualizar:

```text
fii-track-front/src/hooks/operacoes/useOperacoes.jsx
```

Adicionar:

- estado `cardsOperacoes`;
- estado `loadingCards` ou reutilização do padrão local existente;
- função `getCardsOperacoes({ mes, ano })`;
- tratamento de erro usando o padrão existente do projeto.

A consulta deve ser atualizada quando `mes` ou `ano` mudar.

### 3. Página

Atualizar:

```text
fii-track-front/src/pages/operacoes/operacoes.jsx
```

Adicionar os cards na área superior da página, próximos do gráfico e antes da tabela, seguindo o padrão visual de Rendimentos:

- mesma estrutura de espaçamento;
- valores formatados como moeda;
- estado de carregamento com `...` ou skeleton;
- estado sem dados exibindo `R$ 0,00`;
- cores distintas para compra, venda e capital líquido.

Sugestão de identidade visual:

| Card | Cor sugerida | Significado |
|---|---|---|
| Total aportado | Azul ou verde | Entrada em compras |
| Total vendido | Laranja ou vermelho discreto | Saída por vendas |
| Capital líquido | Ciano ou amarelo | Resultado da movimentação |

Não reutilizar o nome **Total Investido** nesses cards, pois ele pode ser confundido com custo da posição atual.

---

## Ajuste na tela de Rendimentos

Depois que os cards de Operações estiverem funcionando, avaliar a remoção ou renomeação do card atual:

- nome atual: **Total Investido**;
- nome recomendado: **Total Aportado**;
- campo interno atual: `totalCompras`;
- possível nome futuro: `totalAportado`.

A regra usada nos cálculos de YoC não deve ser alterada nesta melhoria. O YoC continuará usando o total histórico de compras como base, pois essa é a definição de yield sobre o custo investido.

A remoção visual do card de Rendimentos deve ser feita somente depois de confirmar que nenhum cálculo ou componente depende exclusivamente dele.

---

## Testes e validação

### Backend

Validar pelo menos os seguintes cenários:

- usuário com compras e vendas no mesmo mês;
- usuário somente com compras;
- usuário somente com vendas;
- usuário sem operações no filtro;
- filtro `mes = Todos`;
- filtro por um mês específico;
- operações de outro usuário não aparecem no resultado;
- capital líquido negativo quando o total vendido for maior que o total aportado;
- valores decimais e operações com quantidade fracionada.

### Frontend

Validar:

- carregamento inicial dos cards;
- atualização ao trocar o ano;
- atualização ao trocar o mês;
- valores formatados em reais;
- exibição de zero quando não houver operações;
- estado de carregamento;
- comportamento responsivo em desktop e mobile;
- alinhamento visual com os cards de Rendimentos.

### Critérios de aceite

- [ ] Os três cards aparecem na tela de Operações.
- [ ] Os valores respeitam o usuário autenticado.
- [ ] Os valores respeitam os filtros de ano e mês.
- [ ] `capitalLiquido` é igual a `totalAportado - totalVendido`.
- [ ] O resultado vazio retorna e exibe zero.
- [ ] Compras e vendas não são misturadas nos cards.
- [ ] A tela de Rendimentos continua calculando o YoC corretamente.
- [ ] Não existe indicação de que capital líquido seja custo da carteira atual.

---

## Evolução futura — Custo da carteira atual

Criar uma especificação própria antes de implementar esse indicador.

Pontos que precisam ser decididos:

1. Usar custo médio ou FIFO?
2. Como tratar vendas parciais?
3. Como tratar vendas maiores que a posição registrada?
4. Como tratar transferências, bonificações e desdobramentos?
5. O custo será calculado por ativo e depois totalizado?
6. O valor será baseado no custo de aquisição ou no preço atual de mercado?
7. Como corrigir operações antigas lançadas com dados incompletos?

Somente depois dessas decisões o card deve ser chamado de **Custo da carteira atual**.
