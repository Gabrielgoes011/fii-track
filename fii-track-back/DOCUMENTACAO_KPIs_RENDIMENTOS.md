# Documentação — KPIs de Rendimentos (Dashboard Cards)

> Status: ✅ **Implementado** (backend e frontend).
> Última atualização: **30/07/2026**
>
> Este documento descreve o cálculo implementado dos KPIs da tela de Rendimentos (cards + Efeito Bola de Neve).

---

## Endpoint

```
POST /cardsRendimentos
Authorization: Bearer <token>
```

**Body:**
```json
{ "mes": 7, "ano": 2026, "idAtivo": null }
```

- `mes`: número de `1` a `12`, ou `null`/`"Todos"` para o ano inteiro
- `ano`: obrigatório
- `idAtivo`: opcional — filtra os KPIs por um ativo específico (`null`/`"Todos"` = todos os ativos)

Controller: `getCardsRendimentos` em `src/controllers/rendimentos.controller.js`
Service: `calculoCardsRendimento` em `src/services/rendimentos.services.js`
Repository: funções `getRendimentosFiltro`, `getTotalAcumulado`, `getAcumulado12Meses`, `getTotalCompras`, `getTotalReinvestido` em `src/repositories/rendimentos.repositories.js`

---

## Resposta

```json
{
  "success": true,
  "message": "Dados dos cards calculados com sucesso.",
  "data": {
    "totalPeriodo": 4850.25,
    "totalAcumulado": 46837.41,
    "totalAcumulado12Meses": 12300.10,
    "totalCompras": 125560.52,
    "totalReinvestido": 18450.00,
    "aporteProprio": 107110.52,
    "retornoAcumulado": 37.30,
    "yieldOnCost12Meses": 9.8,
    "percProprio": 85.3,
    "percReinvestido": 14.7
  }
}
```

No frontend, esse objeto fica disponível no hook `useRendimentos` como `cardsRendimentos` (ver `getCardsRendimentos` em `src/hooks/rendimentos/useRendimentos.js`).

---

## Definições e Fórmulas (implementadas em `calculoCardsRendimento`)

As 5 queries do repositório rodam em paralelo (`Promise.all`) para performance.

### 1. `totalPeriodo`
Soma de `valorRecebido` da tabela `rendimentos` filtrado por `mes`/`ano`/`idAtivo` (todos opcionais exceto `ano`).
Repository: `getRendimentosFiltro`.

### 2. `totalAcumulado`
Soma histórica de todos os rendimentos recebidos pelo usuário, sem filtro de período.
Repository: `getTotalAcumulado`.

### 3. `totalAcumulado12Meses`
Soma dos rendimentos recebidos nos últimos 12 meses (`dtRendimento >= CURRENT_DATE - INTERVAL '12 months'`).
Repository: `getAcumulado12Meses`.

### 4. `totalCompras`
Soma de `preco * quantidade` das operações do tipo `'Compra'`.
Repository: `getTotalCompras`.

### 5. `totalReinvestido`
Soma de `valorRecebido` dos rendimentos marcados com `reinvestido = true`.
Repository: `getTotalReinvestido`.

> **Atenção:** a coluna `reinvestido` está na tabela **`rendimentos`**, não em `operacoes`. Um rendimento reinvestido é aquele cujo valor recebido foi usado para comprar mais cotas do próprio fundo — a flag fica no registro do provento, não na operação de compra.

### 6. `aporteProprio`
```
aporteProprio = totalCompras - totalReinvestido
```
Representa o quanto saiu do bolso do investidor (sem contar o que "se pagou sozinho" via reinvestimento).

### 7. `retornoAcumulado` (YoC — Yield on Cost desde o início)
```
retornoAcumulado = totalCompras > 0 ? (totalAcumulado / totalCompras) * 100 : 0
```
Arredondado para 2 casas decimais.

### 8. `yieldOnCost12Meses`
```
yieldOnCost12Meses = totalCompras > 0 ? (totalAcumulado12Meses / totalCompras) * 100 : 0
```
Arredondado para 2 casas decimais.

### 9. `percProprio` e `percReinvestido` (Efeito Bola de Neve)
```
percProprio      = totalCompras > 0 ? (aporteProprio / totalCompras) * 100 : 0
percReinvestido  = totalCompras > 0 ? (totalReinvestido / totalCompras) * 100 : 0
```
Ambos arredondados para 1 casa decimal.

---

## Frontend

### `rendimentosService.js`
```js
cardsRendimentos: async ({ mes, ano, idAtivo }) => {
  const res = await api.post('/cardsRendimentos', {
    mes: mes ? Number(mes) : null,
    ano: Number(ano),
    idAtivo: idAtivo ? Number(idAtivo) : null,
  });
  return res.data;
},
```

### `useRendimentos.js`
```js
const [cardsRendimentos, setCardsRendimentos] = useState(null);
const [loadingCards, setLoadingCards] = useState(false);

const getCardsRendimentos = useCallback(async ({ mes, ano, idAtivo }) => {
  setLoadingCards(true);
  try {
    const data = await rendimentosService.cardsRendimentos({ mes, ano, idAtivo });
    setCardsRendimentos(data || null);
  } catch (error) {
    handleError(error);
  } finally {
    setLoadingCards(false);
  }
}, []);
```

A página `rendimentos.jsx` consome `cardsRendimentos` do hook e renderiza os cards de Total do Período, Total Acumulado, YoC e o Efeito Bola de Neve.

---

## Lançamento de Rendimento (relacionado)

O card "Efeito Bola de Neve" depende da flag `reinvestido`, definida no momento do lançamento:

```
POST /criarRendimento
Body: { "idAtivo": 1, "dtRendimento": "2026-07-15", "valorRecebido": 95.50, "reinvestido": true }
```

Controller: `criarRendimentoController` → Service: `criarRendimento` → Repository: `insertRendimento`.

Exclusão: `DELETE /rendimentos/:id` (garante que o rendimento pertence ao `idUser` logado antes de excluir).
