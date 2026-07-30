# Spec — Tela Controle de Ativos

> Versão: 1.0 — 29/07/2026
> Status: Aguardando aprovação antes do desenvolvimento

---

## Visão Geral

Tela principal de acompanhamento de rentabilidade e rebalanceamento da carteira de FIIs. Substitui uma planilha e consolida em um único lugar: posição atual, performance por ativo, cotação em tempo real (fechamento anterior) e quanto comprar/vender para equilibrar a carteira.

**Rota:** `/controle-ativos`

---

## Arquivos a Criar

Seguindo o padrão do projeto (`service → hook → página`):

```
src/
├── services/
│   └── controleAtivos/
│       └── controleAtivosService.js
├── hooks/
│   └── controleAtivos/
│       └── useControleAtivos.js
└── pages/
    └── controleAtivos/
        └── controleAtivos.jsx          ← substitui o placeholder atual
```

---

## 1. Estrutura Visual da Tela

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER DA PÁGINA                                               │
│  Ícone + "Controle de Ativos"  |  [Atualizar Cotações]         │
│  "Cotações: fechamento do último dia útil · Fonte: Brapi"       │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│ Custo    │ Valor    │ Rent.    │ Total de Proventos           │
│ Total    │ Atual    │ Total    │ (histórico)                  │
├──────────┴──────────┴──────────┴──────────────────────────────┤
│  TABELA DE ATIVOS (DataGrid)                                    │
│  [loading skeleton enquanto busca cotações]                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cards do Header (KPIs)

Quatro cards usando o componente `DataCard` existente, dispostos em linha:

| Card | Campo da API | Formato | Cor |
|---|---|---|---|
| Custo Total | `custoTotal` | R$ moeda | `#60a5fa` (azul) |
| Valor Atual | `valorAtualTotal` | R$ moeda | `#10b981` (verde) |
| Rentabilidade R$ | `rentabilidadeReais` | R$ moeda, condicional | verde/vermelho |
| Total de Proventos | `totalProventos` | R$ moeda | `#a78bfa` (roxo) |

O card de Rentabilidade R$ deve exibir também o percentual abaixo do valor: `(+12,4%)` em fonte menor.

**Aviso de cotação** (abaixo dos cards, texto sutil):
```
ℹ  Cotações baseadas no fechamento do último dia útil · Fonte: Brapi
```
Estilo: `fontSize: '11px', color: '#475569'`

---

## 3. Tabela de Ativos

O `GridDados` existente **não suporta inputs editáveis inline**. Para esta tela, a tabela deve ser implementada diretamente na página (sem usar `GridDados`), pois precisa de:
- Células com `<input>` editável (Preço Teto e % Ideal)
- Badges coloridos condicionais (Ação para Equilíbrio)
- Ordenação por cabeçalho
- Tipografia numérica tabular

### 3.1 Definição das Colunas

| # | Coluna | Campo API | Formato | Alinhamento | Largura |
|---|---|---|---|---|---|
| 1 | Ativo | `ticker` | Texto negrito, badge pill | left | 90px |
| 2 | Segmento | `segmento` | Texto | left | 110px |
| 3 | Cotação | `cotacao` | R$ moeda | right | 90px |
| 4 | Quant. | `quantidade` | Inteiro | center | 70px |
| 5 | Preço Médio | `precoMedio` | R$ moeda | right | 100px |
| 6 | Custo | `custo` | R$ moeda | right | 110px |
| 7 | Valor Atual | `valorAtual` | R$ moeda | right | 110px |
| 8 | Rent. R$ | `rentabilidadeReais` | R$ moeda, cor | right | 100px |
| 9 | Rent. % | `rentabilidadePerc` | %, cor | right | 80px |
| 10 | Rent. + Prov. | `rentabilidadeTotalPerc` | %, cor | right | 100px |
| 11 | Preço Teto | `precoTeto` | INPUT R$ | center | 100px |
| 12 | Desconto | `desconto` | %, cor | right | 80px |
| 13 | % Atual | `percAtual` | % | right | 75px |
| 14 | % Ideal | `percIdeal` | INPUT % | center | 75px |
| 15 | Ação | `acaoEquilibrio` | Badge/Chip | center | 110px |
| 16 | C/V Equilíbrio | `valorEquilibrio` | R$ moeda | right | 110px |

**Total de colunas: 16** — tabela com scroll horizontal em telas menores.

### 3.2 Renderização de Cada Coluna

#### Coluna 1 — Ativo
```jsx
<td>
  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
    {row.ticker}
  </span>
</td>
```

#### Coluna 3 — Cotação
```jsx
<td style={{ color: '#cbd5e1', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
  {fmt(row.cotacao)}
</td>
```

#### Colunas 8 e 9 — Rentabilidade R$ e %
Cor condicional baseada no valor:
```jsx
const corRent = (v) => v > 0 ? '#4ade80' : v < 0 ? '#f87171' : '#94a3b8';

// R$
<td style={{ color: corRent(row.rentabilidadeReais), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
  {fmtSinal(row.rentabilidadeReais)}
</td>

// %
<td style={{ color: corRent(row.rentabilidadePerc), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
  {fmtPerc(row.rentabilidadePerc)}
</td>
```

Funções de formatação:
```js
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtSinal = (v) => (v > 0 ? '+' : '') + fmt(v);
const fmtPerc = (v) => (v > 0 ? '+' : '') + (v * 100).toFixed(2).replace('.', ',') + '%';
```

#### Coluna 11 — Preço Teto (INPUT EDITÁVEL)
```jsx
<td style={{ textAlign: 'center' }}>
  <input
    type="number"
    value={precoTetoLocal}
    onChange={(e) => setPrecoTetoLocal(e.target.value)}
    onBlur={() => handleSalvarPrecoTeto(row.idAtivo, precoTetoLocal)}
    style={{
      width: '88px', padding: '4px 6px',
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: '6px', color: '#f8fafc',
      fontSize: '12px', textAlign: 'right',
      fontVariantNumeric: 'tabular-nums', outline: 'none',
    }}
    onFocus={(e) => e.target.style.borderColor = '#10b981'}
    onBlurCapture={(e) => e.target.style.borderColor = '#334155'}
    placeholder="0,00"
  />
</td>
```

O estado local do input deve ser gerenciado por linha para evitar re-render da tabela inteira. Usar `useRef` ou estado isolado por linha.

#### Coluna 12 — Desconto
Percentual entre cotação atual e preço teto. Verde se cotação < teto (desconto real), vermelho se cotação > teto (acima do teto):
```jsx
const corDesconto = (d) => d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#94a3b8';

<td style={{ color: corDesconto(row.desconto), textAlign: 'right' }}>
  {fmtPerc(row.desconto)}
</td>
```

#### Coluna 14 — % Ideal (INPUT EDITÁVEL)
```jsx
<td style={{ textAlign: 'center' }}>
  <input
    type="number" min="0" max="100" step="0.1"
    value={percIdealLocal}
    onChange={(e) => setPercIdealLocal(e.target.value)}
    onBlur={() => handleSalvarPercIdeal(row.idAtivo, percIdealLocal)}
    style={{
      width: '60px', padding: '4px 6px',
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: '6px', color: '#f8fafc',
      fontSize: '12px', textAlign: 'right', outline: 'none',
    }}
    placeholder="0,0"
  />
</td>
```

Abaixo da tabela, exibir o total dos % ideais:
```
Soma % Ideal: 87,5% de 100%  ← em vermelho se < 100%, verde se = 100%
```

#### Coluna 15 — Ação Para Equilíbrio (Badge)
Valores possíveis retornados pela API: `'aportar'` | `'equilibrio'` | `'acima'`

```jsx
const badgeConfig = {
  aportar:    { bg: 'rgba(16,185,129,0.15)', cor: '#4ade80',  borda: 'rgba(16,185,129,0.3)',  texto: 'Aportar'      },
  equilibrio: { bg: 'rgba(251,191,36,0.15)', cor: '#fbbf24',  borda: 'rgba(251,191,36,0.3)',  texto: 'Equilíbrio'   },
  acima:      { bg: 'rgba(248,113,113,0.15)',cor: '#f87171',  borda: 'rgba(248,113,113,0.3)', texto: 'Acima Ideal'  },
};

const cfg = badgeConfig[row.acaoEquilibrio] ?? badgeConfig.equilibrio;

<td style={{ textAlign: 'center' }}>
  <span style={{
    background: cfg.bg, color: cfg.cor,
    border: `1px solid ${cfg.borda}`,
    borderRadius: '9999px', padding: '3px 10px',
    fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
  }}>
    {cfg.texto}
  </span>
</td>
```

#### Coluna 16 — C/V para Equilíbrio
Positivo = precisa comprar (verde). Negativo = deveria vender (vermelho):
```jsx
<td style={{ color: corRent(row.valorEquilibrio), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
  {fmtSinal(row.valorEquilibrio)}
</td>
```

### 3.3 Linha de Totais (Rodapé da Tabela)
Uma linha fixa no final da tabela com fundo diferenciado:

| Coluna | Conteúdo |
|---|---|
| Ativo | **Total** |
| Custo | soma de todos os custos |
| Valor Atual | soma de todos os valores atuais |
| Rent. R$ | soma das rentabilidades |
| Rent. % | rentabilidade geral da carteira |
| % Atual | deve somar 100% |
| % Ideal | deve somar 100% (com indicador visual) |
| C/V Equilíbrio | soma do que falta aportar/resgatar |

---

## 4. Contratos da API

### 4.1 GET — Posição da Carteira

```
GET /controle-ativos
Authorization: Bearer {token}
```

Retorno:
```json
{
  "resumo": {
    "custoTotal": 50000.00,
    "valorAtualTotal": 58500.00,
    "rentabilidadeReais": 8500.00,
    "rentabilidadePerc": 0.17,
    "totalProventos": 3200.00,
    "dataAtualizacaoCotacoes": "2026-07-28"
  },
  "ativos": [
    {
      "idAtivo": 1,
      "ticker": "MXRF11",
      "segmento": "Papel",
      "cotacao": 10.25,
      "quantidade": 500,
      "precoMedio": 9.80,
      "custo": 4900.00,
      "valorAtual": 5125.00,
      "rentabilidadeReais": 225.00,
      "rentabilidadePerc": 0.0459,
      "rentabilidadeTotalPerc": 0.1123,
      "precoTeto": 11.00,
      "desconto": 0.0682,
      "percAtual": 0.0875,
      "percIdeal": 0.10,
      "acaoEquilibrio": "aportar",
      "valorEquilibrio": 731.25
    }
  ]
}
```

### 4.2 PUT — Salvar Preço Teto

```
PUT /controle-ativos/preco-teto/:idAtivo
Authorization: Bearer {token}
Body: { "precoTeto": 11.50 }
```

Retorno: `200 OK` com mensagem de sucesso.

### 4.3 PUT — Salvar % Ideal

```
PUT /controle-ativos/perc-ideal/:idAtivo
Authorization: Bearer {token}
Body: { "percIdeal": 0.12 }
```

Retorno: `200 OK` com mensagem de sucesso.

> Os recálculos de `acaoEquilibrio` e `valorEquilibrio` devem ser feitos no backend após salvar o `percIdeal`.

---

## 5. Comportamentos de UX

### 5.1 Loading — Busca de Cotações
Enquanto `loading === true` na chamada inicial:
- Exibir `<SkeletonTable rows={10} cols={8} />` no lugar da tabela
- Exibir cards do header com valores `---` ou skeleton shimmer

### 5.2 Atualização de Cotações (Botão Manual)
Um botão `[↻ Atualizar Cotações]` no header da página. Ao clicar:
- Estado `loadingCotacoes = true` no botão (spinner + "Atualizando...")
- Refaz a chamada GET
- Ao concluir: `toastSuccess('Cotações atualizadas!')` ou `handleError(error)`

### 5.3 Salvar Preço Teto (onBlur)
Ao perder o foco no input de Preço Teto:
1. Se o valor não mudou → não faz nada
2. Se mudou → chama `PUT /controle-ativos/preco-teto/:id`
3. Sucesso → `toastSuccess('Preço teto salvo!')` e atualiza `desconto` localmente
4. Erro → `handleError(error)` e reverte o input para o valor anterior

### 5.4 Salvar % Ideal (onBlur)
Ao perder o foco no input de % Ideal:
1. Se o valor não mudou → não faz nada
2. Se mudou → chama `PUT /controle-ativos/perc-ideal/:id`
3. Sucesso → `toastSuccess('Meta atualizada!')` e refaz o GET completo para recalcular equilíbrio
4. Erro → `handleError(error)` e reverte o input

### 5.5 Ordenação da Tabela
Cada cabeçalho clicável ordena a coluna (asc/desc alternado). Indicador visual: `▲` ou `▼` ao lado do título da coluna ordenada.

```js
const [ordenacao, setOrdenacao] = useState({ campo: 'ticker', direcao: 'asc' });

const dadosOrdenados = [...ativos].sort((a, b) => {
  const mult = ordenacao.direcao === 'asc' ? 1 : -1;
  if (typeof a[ordenacao.campo] === 'string')
    return mult * a[ordenacao.campo].localeCompare(b[ordenacao.campo]);
  return mult * (a[ordenacao.campo] - b[ordenacao.campo]);
});
```

---

## 6. Service

`src/services/controleAtivos/controleAtivosService.js`

```js
import api from '../../config/api';

export const controleAtivosService = {
  listar: async () => {
    const res = await api.get('/controle-ativos');
    return res.data;
  },

  salvarPrecoTeto: async (idAtivo, precoTeto) => {
    const res = await api.put(`/controle-ativos/preco-teto/${idAtivo}`, { precoTeto });
    return res.data;
  },

  salvarPercIdeal: async (idAtivo, percIdeal) => {
    const res = await api.put(`/controle-ativos/perc-ideal/${idAtivo}`, { percIdeal });
    return res.data;
  },
};
```

---

## 7. Hook

`src/hooks/controleAtivos/useControleAtivos.js`

```js
import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';

export const useControleAtivos = () => {
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);

  const getCarteira = useCallback(async () => {
    setLoading(true);
    try {
      const data = await controleAtivosService.listar();
      setResumo(data.resumo || null);
      setAtivos(data.ativos || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarCotacoes = useCallback(async () => {
    setLoadingCotacoes(true);
    try {
      const data = await controleAtivosService.listar();
      setResumo(data.resumo || null);
      setAtivos(data.ativos || []);
      toastSuccess('Cotações atualizadas!');
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingCotacoes(false);
    }
  }, []);

  const handleSalvarPrecoTeto = async (idAtivo, precoTeto) => {
    try {
      await controleAtivosService.salvarPrecoTeto(idAtivo, precoTeto);
      toastSuccess('Preço teto salvo!');
      // Atualiza desconto localmente sem recarregar tudo
      setAtivos((prev) => prev.map((a) =>
        a.idAtivo === idAtivo
          ? { ...a, precoTeto, desconto: (precoTeto - a.cotacao) / precoTeto }
          : a
      ));
    } catch (error) {
      handleError(error);
    }
  };

  const handleSalvarPercIdeal = async (idAtivo, percIdeal) => {
    try {
      await controleAtivosService.salvarPercIdeal(idAtivo, percIdeal);
      toastSuccess('Meta atualizada!');
      await getCarteira(); // recalcula equilíbrio completo
    } catch (error) {
      handleError(error);
    }
  };

  return {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal,
  };
};
```

---

## 8. Backend — Endpoints a Criar

Seguindo a arquitetura Controller → Service → Repository do projeto:

### Arquivos

```
fii-track-back/src/
├── routes/
│   └── controleAtivos.routes.js
├── controllers/
│   └── controleAtivos.controller.js
├── services/
│   └── controleAtivos.services.js
└── repositories/
    └── controleAtivos.repositories.js
```

### Lógica do GET /controle-ativos

O repository deve:
1. Buscar todas as operações do `idUser` e calcular `quantidade` e `precoMedio` por ativo (FIFO ou média ponderada — a ser definido)
2. Buscar cotações da Brapi para cada ticker
3. Buscar total de proventos recebidos por ativo
4. Buscar `precoTeto` e `percIdeal` salvos pelo usuário
5. Calcular: `custo`, `valorAtual`, `rentabilidadeReais`, `rentabilidadePerc`, `desconto`, `percAtual`, `acaoEquilibrio`, `valorEquilibrio`

> **Nota:** O cálculo do `precoMedio` precisa de uma decisão de regra (custo médio ponderado vs FIFO). Ver item do backlog no `ANALISE_PROJETO.md`.

### Tabela de Metas (nova — precisa criar no banco)

```sql
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

---

## 9. Checklist de Implementação

### Backend
- [ ] Criar tabela `metas_carteira` no banco
- [ ] Decidir regra de cálculo do preço médio (custo médio ponderado ou FIFO)
- [ ] `controleAtivos.repositories.js` — queries de posição consolidada
- [ ] Integração com Brapi para cotações (cache recomendado para não estourar limite gratuito)
- [ ] `controleAtivos.services.js` — cálculos de rentabilidade e equilíbrio
- [ ] `controleAtivos.controller.js` — GET, PUT precoTeto, PUT percIdeal
- [ ] `controleAtivos.routes.js` — registrar rotas com `verificaToken`
- [ ] Registrar router no `app.js`

### Frontend
- [ ] `controleAtivosService.js` criado
- [ ] `useControleAtivos.js` criado
- [ ] `controleAtivos.jsx` — header com 4 KPI cards
- [ ] Aviso de cotação (fonte Brapi)
- [ ] Tabela com 16 colunas e scroll horizontal
- [ ] Inputs editáveis com estado local por linha
- [ ] Badges de equilíbrio
- [ ] Linha de totais no rodapé
- [ ] Ordenação por cabeçalho
- [ ] Skeleton no loading inicial
- [ ] Botão "Atualizar Cotações" com loading state
- [ ] `toastSuccess` e `handleError` em todas as interações
- [ ] `useIsMobile` para ajuste de padding
- [ ] Rota `/controle-ativos` no `App.jsx`
- [ ] Item no `Sidebar.jsx`
- [ ] Remover `PaginaEmDesenvolvimento` atual da rota

---

## 10. Decisões Pendentes (Bloqueiam o Backend)

| Decisão | Impacto |
|---|---|
| Regra de cálculo do preço médio (custo médio ponderado vs FIFO) | Query do repositório, campo `precoMedio` e `custo` |
| Cache de cotações Brapi (em memória, Redis, ou coluna no banco) | Estratégia de integração com API externa |
| Frequência de atualização automática de cotações | UX do botão de atualizar |

> Estas decisões devem ser definidas antes de iniciar o backend desta tela.
