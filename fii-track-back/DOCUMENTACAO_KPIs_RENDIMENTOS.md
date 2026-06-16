# Documentação — KPIs de Rendimentos (Dashboard Cards)

> Guia para implementar no back-end os dados necessários para os 4 cards da tela de Rendimentos do FII Track.
> Os cards foram atualizados para incluir o indicador YoC e o gráfico proporcional do Efeito Bola de Neve.

---

## Visão geral dos 4 cards

| # | Card | Cor | Campos do JSON | Fonte de dados |
|---|---|---|---|---|
| 1 | **Total Recebido** | Verde | `totalRecebidoPeriodo` | Tabela `rendimentos` (filtrado por período) |
| 2 | **Total Acumulado** | Amarelo | `totalAcumulado` | Tabela `rendimentos` (histórico completo) |
| 3 | **Total Investido + YoC** | Azul | `totalInvestido`, `yoc` | Tabela `operacoes` e cálculo de rendimento histórico |
| 4 | **Efeito Bola de Neve** | Roxo / Indigo | `totalReinvestido`, `aporteProprio`, `percProprio`, `percReinvestido` | Tabela `operacoes` (compras normais vs. reinvestidas) |

---

## Estrutura do JSON Esperada pelo Front-end

O front-end passará os parâmetros de filtro `mes` e `ano` na query string e espera receber um objeto consolidado no seguinte formato:

```json
{
  "success": true,
  "message": "KPIs carregados com sucesso.",
  "data": {
    "totalRecebidoPeriodo": 4850.25,
    "totalAcumulado": 46837.41,
    "totalInvestido": 125560.52,
    "totalReinvestido": 18450.00,
    "aporteProprio": 107110.52,
    "yoc": 37.30,
    "percProprio": 85.3,
    "percReinvestido": 14.7
  }
}
```

---

## Definições e Fórmulas de Cálculo no Back-end

### 1. `totalRecebidoPeriodo`
* **Definição:** Soma de todos os rendimentos recebidos no mês e ano selecionados.
* **Query sugerida:**
  ```sql
  SELECT SUM("valorRecebido") AS "totalRecebidoPeriodo"
  FROM rendimentos
  WHERE 
    ("mes" = :mes OR :mes = 'Todos') 
    AND "ano" = :ano;
  ```

### 2. `totalAcumulado`
* **Definição:** Soma histórica de todos os rendimentos recebidos desde o início.
* **Query sugerida:**
  ```sql
  SELECT SUM("valorRecebido") AS "totalAcumulado"
  FROM rendimentos;
  ```

### 3. `totalInvestido`
* **Definição:** Soma total das compras de ativos realizadas.
* **Query sugerida:**
  ```sql
  SELECT SUM("valorTotal") AS "totalInvestido"
  FROM operacoes
  WHERE "tipoOperacao" = 'COMPRA';
  ```

### 4. `totalReinvestido`
* **Definição:** Soma total das compras marcadas como proventos reinvestidos (`reinvestido = true`).
* **Query sugerida:**
  ```sql
  SELECT SUM("valorTotal") AS "totalReinvestido"
  FROM operacoes
  WHERE "tipoOperacao" = 'COMPRA' AND "reinvestido" = true;
  ```

### 5. `aporteProprio`
* **Cálculo:** `totalInvestido - totalReinvestido`

### 6. `yoc` (Yield on Cost)
* **Cálculo:** `(totalAcumulado / totalInvestido) * 100`
* **Nota:** Retornar como valor numérico float (ex: `37.30`). Se `totalInvestido` for 0, retornar `0.00`.

### 7. `percProprio` e `percReinvestido`
* **Cálculo `percReinvestido`:** `(totalReinvestido / totalInvestido) * 100`
* **Cálculo `percProprio`:** `(aporteProprio / totalInvestido) * 100` (ou `100 - percReinvestido`)
* **Nota:** Retornar como float de um dígito decimal (ex: `85.3` e `14.7`). Se `totalInvestido` for 0, retornar `0.0` para ambos.

---

## Endpoint no Back-end

### Rota
```
GET /kpis-rendimentos?mes=XX&ano=YYYY
```
* **Parâmetros Query:** 
  * `mes`: String (`'01'` a `'12'` ou `'Todos'`)
  * `ano`: String (`'2023'` a `'2026'`)
* **Segurança:** Requer middleware de autenticação (ex: `verificaToken`).

---

## Alteração Necessária no Banco de Dados

Caso ainda não possua a coluna `reinvestido` na tabela `operacoes`, execute a migration ou script SQL abaixo:

```sql
ALTER TABLE operacoes
ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false;
```
*(As compras passadas assumem automaticamente `false`, significando que vieram do bolso)*

---

## Onde conectar no Front-end

### 1. Atualizar em `rendimentosService.jsx`
```js
kpisRendimentos: async ({ mes, ano }) => {
  const res = await api.get('/kpis-rendimentos', { params: { mes, ano } });
  return res.data; // Retorna { totalRecebidoPeriodo, totalAcumulado, ... }
},
```

### 2. Atualizar em `useRendimentos.jsx`
Substituir o estado antigo por:
```js
const [kpis, setKpis] = useState(null);

const getKpis = useCallback(async ({ mes, ano }) => {
  try {
    const data = await rendimentosService.kpisRendimentos({ mes, ano });
    setKpis(data);
  } catch (error) {
    handleError(error);
  }
}, []);
```
E disparar no `useEffect` de filtros na página ou no hook.

### 3. No arquivo `rendimentos.jsx`
Substituir o mock fixo `const apiResponse = { ... }` pelo estado retornado pelo hook:
```js
const {
  rendimentos,
  loading,
  kpis, // Novo estado retornado pelo hook
  ...
} = useRendimentos();

// Usar kpis retornado do backend ou o mock de fallback para segurança
const apiResponse = kpis ?? {
  totalRecebidoPeriodo: 0,
  totalAcumulado: 0,
  totalInvestido: 0,
  totalReinvestido: 0,
  aporteProprio: 0,
  yoc: 0,
  percProprio: 100,
  percReinvestido: 0
};
```

---

## Resumo das tarefas (Checklist para o Back-end)

- [ ] Executar migration para adicionar `reinvestido` na tabela `operacoes`
- [ ] Criar a query consolidada ou service para calcular as 8 propriedades do dashboard
- [ ] Criar controlador `getKpisRendimentos`
- [ ] Configurar a rota `GET /kpis-rendimentos` com parâmetros de query
- [ ] Integrar no Front-end substituindo o objeto mockado `apiResponse` pelo estado dinâmico `kpis`
