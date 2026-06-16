# Documentação — KPIs de Rendimentos (Cards)

> Guia para implementar no back-end os dados necessários para os 4 cards
> da tela de Rendimentos do FII Track.

---

## Visão geral dos 4 cards

| # | Card            | Cor    | Fonte de dados          | Status         |
|---|-----------------|--------|-------------------------|----------------|
| 1 | Total Recebido  | Verde  | tabela `rendimentos`    | ✅ Funcionando |
| 2 | Total Acumulado | Amarelo| tabela `rendimentos`    | ✅ Funcionando |
| 3 | Total Investido + YoC | Azul | tabela `operacoes` | 🔲 Pendente    |
| 4 | Reinvestido     | Roxo   | tabela `operacoes`      | 🔲 Pendente    |

---

## Card 3 — Total Investido + Yield on Cost (YoC)

### O que é

**Total Investido** = soma de todos os valores gastos em compras de FIIs.

**Yield on Cost (YoC)** = quanto % do total investido você já recebeu de volta
em proventos (calculado sobre o custo histórico, não sobre o preço atual).

### Fórmula

```
YoC = (Total Acumulado de Proventos / Total Investido) * 100
```

**Exemplo:**
- Total Investido: R$ 20.000
- Total Acumulado de Proventos: R$ 2.400
- YoC = (2.400 / 20.000) * 100 = **12% a.a**

### Estrutura esperada da tabela `operacoes`

```sql
-- Colunas relevantes para este cálculo:
-- id
-- idAtivo         → FK para ativos
-- tipoOperacao    → 'COMPRA' | 'VENDA'
-- quantidade      → número de cotas
-- precoUnitario   → preço pago por cota
-- valorTotal      → quantidade * precoUnitario
-- dtOperacao      → data da operação
-- reinvestido     → BOOLEAN DEFAULT false
--                   (true = esse valor veio de proventos reinvestidos)
```

### Query sugerida

```sql
-- Total investido (soma de todas as compras)
SELECT
    SUM(o."valorTotal") AS "totalInvestido"
FROM operacoes o
WHERE o."tipoOperacao" = 'COMPRA';
```

---

## Card 4 — Total Reinvestido

### O que é

Mostra quanto do dinheiro gasto em compras de FIIs veio de **proventos
reinvestidos** — ou seja, dinheiro que o próprio investimento gerou e foi
usado para comprar mais cotas, em vez de ser sacado.

Isso evidencia o **efeito bola de neve**: quanto maior esse número, mais
o portfólio está se autofinanciando.

### Fórmula

```
% Reinvestido = (Total Reinvestido / Total Investido) * 100
```

**Exemplo:**
- Total Investido: R$ 20.000
- Total Reinvestido: R$ 4.500 (veio de proventos)
- % Reinvestido = (4.500 / 20.000) * 100 = **22,5%**

Leitura: "22,5% do que você investiu veio dos próprios proventos"

### Como identificar no banco

O campo `reinvestido = true` em uma operação de COMPRA indica que aquele
aporte foi feito com proventos, não com dinheiro novo do bolso.

### Query sugerida

```sql
-- Total investido via reinvestimento de proventos
SELECT
    SUM(o."valorTotal") AS "totalReinvestido"
FROM operacoes o
WHERE
    o."tipoOperacao" = 'COMPRA'
    AND o."reinvestido" = true;
```

---

## Endpoint a criar

Criar um único endpoint que retorne os dois valores de uma vez, evitando
duas chamadas separadas.

### Rota sugerida

```
GET /kpis-operacoes
```

Sem body. Requer token (verificaToken).

### Retorno esperado

```json
{
  "success": true,
  "message": "KPIs de operações carregados com sucesso.",
  "data": {
    "totalInvestido":   20000.00,
    "totalReinvestido":  4500.00
  }
}
```

### Query completa (uma só chamada ao banco)

```sql
SELECT
    SUM("valorTotal")                                        AS "totalInvestido",
    SUM(CASE WHEN "reinvestido" = true THEN "valorTotal" ELSE 0 END) AS "totalReinvestido"
FROM operacoes
WHERE "tipoOperacao" = 'COMPRA';
```

---

## Alteração necessária no banco

### Adicionar coluna `reinvestido` na tabela `operacoes`

```sql
ALTER TABLE operacoes
ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false;
```

> Registros existentes ficam com `reinvestido = false` automaticamente
> (default), o que é o comportamento correto.

---

## Onde conectar no front-end

Quando o endpoint estiver pronto, o fluxo é:

### 1. Adicionar no `rendimentosService.jsx`

```js
kpisOperacoes: async () => {
  const res = await api.get('/kpis-operacoes');
  return res.data; // { totalInvestido, totalReinvestido }
},
```

### 2. Atualizar o `useRendimentos.jsx`

Substituir o `const kpisOperacoes = null` por:

```js
const [kpisOperacoes, setKpisOperacoes] = useState(null);

const getKpisOperacoes = useCallback(async () => {
  try {
    const data = await rendimentosService.kpisOperacoes();
    setKpisOperacoes(data);
  } catch (error) {
    handleError(error);
  }
}, []);
```

E chamar no `useEffect` inicial da página:

```js
useEffect(() => { getKpisOperacoes(); }, [getKpisOperacoes]);
```

### 3. No `rendimentos.jsx` — nada muda

A página já está preparada. As variáveis `totalInvestido` e
`totalReinvestido` já leem de `kpisOperacoes` com fallback para `0`
enquanto o backend não estiver pronto:

```js
const totalInvestido   = kpisOperacoes?.totalInvestido   ?? 0;
const totalReinvestido = kpisOperacoes?.totalReinvestido ?? 0;
```

---

## Resumo das tarefas

- [ ] `ALTER TABLE operacoes ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false`
- [ ] Criar `repositories` → função `findKpisOperacoes()`
- [ ] Criar `services` → função `carregarKpisOperacoes()`
- [ ] Criar `controllers` → função `carregarKpisOperacoesController()`
- [ ] Criar rota `GET /kpis-operacoes` com `verificaToken` em `operacoes.routes.js`
- [ ] Atualizar `rendimentosService.jsx` com método `kpisOperacoes()`
- [ ] Atualizar `useRendimentos.jsx` — trocar `null` por chamada real
