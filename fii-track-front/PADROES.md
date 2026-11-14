# FIITrack Frontend — Padrões e Como Usar

> Guia para desenvolver novas páginas e componentes seguindo o padrão do projeto.

---

## Estrutura de Arquivos

```
src/
├── components/       # Componentes reutilizáveis
├── hooks/            # Hooks customizados (.js)
├── services/         # Chamadas à API (.js)
├── pages/            # Páginas da aplicação (.jsx)
├── utils/            # Utilitários (.js)
├── config/           # Configuração do axios (api.js)
├── context/          # Contextos React
└── styles/           # CSS global
```

**Regra de extensão:**
- `.jsx` → componentes React (retornam JSX)
- `.js` → hooks, services, utils (sem JSX)

---

## Tokens de design

O app é **só escuro**. As cores, raios e sombras ficam como variáveis CSS em `src/styles/global.css` (`:root`).
Em código novo use `var(--nome)` no lugar de hex solto:

```jsx
<div style={{ background: 'var(--surface)', border: '1px solid var(--borda)', borderRadius: 'var(--raio-md)' }} />
```

| Hex que aparece no código | Token | Uso |
|---|---|---|
| `#0a0f1e` | `--bg-app` | fundo geral do app |
| `#0b1120` | `--bg-pagina` | fundo das páginas |
| `#0f172a` | `--surface` | cards, tabelas, painéis |
| `#1e293b` | `--surface-2` / `--borda` | cabeçalhos, modais, hover / bordas finas |
| `#334155` | `--borda-forte` | bordas de campos e modais |
| `#f8fafc`, `#f1f5f9` | `--texto` | títulos e valores |
| `#cbd5e1` | `--texto-2` | texto corrido |
| `#94a3b8` | `--texto-suave` | legendas |
| `#64748b` | `--texto-mudo` | rótulos e dicas (o valor do token é `#7283a0`: contraste 4,65:1, passa no AA) |
| `#475569` | `--texto-apagado` | SÓ desabilitado ou decorativo (3,3:1). Texto que precisa ser lido usa `--texto-mudo` ou mais claro |
| `#10b981` | `--accent` | marca (verde) |
| `#059669` | `--accent-forte` | marca, parte escura |
| `#34d399` | `--accent-claro` | marca, hover |
| `linear-gradient(135deg, #10b981, #059669)` | `--accent-gradiente` | botão principal |
| `#4ade80` / `#f87171` / `#fbbf24` / `#60a5fa` / `#a78bfa` | `--sucesso` / `--perigo` / `--aviso` / `--info` / `--destaque` | status |

Regras:
- Tela nova **não** escreve hex: usa os tokens. Se faltar um token, crie em `global.css` em vez de espalhar o hex.
- Tela antiga migra aos poucos (ao mexer nela). Não precisa trocar tudo de uma vez.
- Não use `var()` onde o valor é manipulado em JS (ex.: `cor + '33'` para transparência) nem em atributos SVG (`fill="..."`): lá continua o hex.

## Layout mobile (tela travada)

No celular a tela tem altura fixa (`100dvh`) e **só o conteúdo rola**. A barra inferior (`BottomNav`) fica no fluxo, abaixo da área que rola,
em vez de `position: fixed`. Assim ela não sobe junto quando a barra de endereço do navegador recolhe.

- Quem monta isso é o `Layout.jsx`, com as classes `.app-shell-mobile` (raiz) e `.app-scroll-mobile` (área que rola), definidas no `global.css`.
- Página que quer ocupar a tela inteira usa `minHeight: 'var(--altura-util, 100vh)'` (no PC cai em `100vh`). **Não use `minHeight: '100vh'` solto**: no celular ele cria rolagem sobrando.
- Não crie elementos `position: fixed` colados embaixo no mobile. Se precisar de uma barra de ações, ponha-a no fluxo da página.
- Campos de texto ficam com 16px no celular (regra no `global.css`), senão o Safari do iPhone dá zoom ao focar.

---
## Kit de UI (`src/components/ui`)

Peças prontas, feitas só com os tokens. Importe sempre do índice: `import { Botao, Card } from '../../components/ui';`
Hover e foco ficam no `ui.css` (nada de `onMouseOver` em cada botão).

| Componente | Para quê | Props principais |
|---|---|---|
| `Botao` | botão padrão | `variante` (`primario` verde, `secundario`, `perigo`, `fantasma`), `tamanho` (`md`, `sm`), `icone`, `bloco` |
| `BotaoIcone` | editar, excluir, visualizar | `icone`, `tom` (`info`, `perigo`, `neutro`), `rotulo` (obrigatório, vira `title` e `aria-label`) |
| `Card` | container padrão | `titulo`, `subtitulo`, `acao`, `destaque` (faixa verde), `compacto`, `semPadding` |
| `CardMetrica` | número de destaque | `rotulo`, `valor`, `tom`, `privado` (blur no modo privacidade) |
| `CabecalhoPagina` | título + ação da página | `titulo`, `subtitulo`, `acao` (o título já se ajusta ao celular) |
| `Campo` | rótulo + input com foco verde | `rotulo`, `erro` e as props do `<input>` |
| `Selo` | etiqueta de status | `tom` (`neutro`, `sucesso`, `aviso`, `perigo`, `info`) |
| `EstadoVazio` | lista vazia ou carregando | `children` |

Modais: use `SlideModal` como base (título, largura, animação) e o kit dentro dele. `ModalConfirmacao` já usa o kit e aceita `entidade`
("seguimento", "fundo"...) para a mensagem não dizer "usuário" quando é outra coisa.

Página de exemplo já migrada: `pages/cadastros/seguimentos/seguimentos.jsx`. Ao mexer em uma tela antiga, troque os botões, cards e campos
escritos à mão por estas peças e os hex por tokens. Validação de formulário usa `toastError` (não `alert`).

Modais: `SlideModal`, `ModalFormulario`, `ModalTrocarSenha` e `modalNovaOperacao` já usam os tokens e o `Botao` (a paleta azulada antiga foi removida).
Ainda com estilo escrito à mão: as telas grandes (`controleAtivos`, `rendimentos`, `operacoes`), `GridDados`, `Sidebar` e `TopBar`.
## Acessibilidade e app instalado

- **Contraste:** texto de leitura usa no mínimo `--texto-mudo` (4,65:1). `--texto-apagado` é só para desabilitado/decorativo. Ao criar um token de texto novo, calcule o contraste (mínimo 4,5:1 sobre `--surface`).
- **Foco:** `global.css` define `:focus-visible` (anel verde). Não esconda o contorno com `outline: none` sem dar outro indicador de foco.
- **Botão só com ícone:** sempre com `aria-label` e `title` (o `BotaoIcone` do kit já exige o `rotulo`).
- **Movimento:** quem pede menos animação no sistema (`prefers-reduced-motion`) não recebe transições; não dependa de animação para o app funcionar.
- **Fontes:** carregadas só pelo `<link>` do `index.html`. Não use `@import` de fonte no CSS (baixaria duas vezes).
- **App instalado (PWA):** o `index.html` tem `viewport-fit=cover`, `color-scheme: dark` e as metas `apple-mobile-web-app-*` (barra de status preta). A barra inferior soma `env(safe-area-inset-bottom)`.
## Carregamento sob demanda (lazy)

Cada tela vira um arquivo separado, baixado só quando a rota abre. O pacote principal tem o Layout, o login do boot e as bibliotecas comuns.

- **Tela nova:** registre em `App.jsx` com `const PaginaX = lazy(() => import('./pages/.../x'));` (nunca `import PaginaX from ...` direto). O `Suspense` já está no `App.jsx`.
- **Biblioteca pesada:** importe só onde usa e, se for usada por uma ação do usuário, com `await import('...')` dentro da função. Exemplo: `xlsx` (425 KB) só é baixada quando se importa um arquivo B3 em Rendimentos.
- **Conferir o efeito:** rode `npm run build` e olhe os tamanhos em `assets/`. O `index-*.js` deve ficar perto de 360 KB (era 952 KB antes do lazy).

## Troca de hex por tokens (feita em lote)

A maior parte dos hex em estilo inline (1.163 ocorrências) foi trocada por `var(--token)` com um script que só mexe em valores de estilo (objetos de `style`),
sem tocar em comparações, somas de texto (`${cor}22`), atributos SVG nem gráficos. Sobraram ~280 hex de propósito:
- cores que o JavaScript usa (`cor="#..."`, `cor: '#...'`, arrays de cores de gráficos, `${cor}15` para transparência);
- gráficos (`components/Charts`) e a tela de login (CSS próprio em string);
- `onMouseOver`/`onMouseEnter` que mudam `style.color` em JS (viram classes CSS quando a tela for para o kit);
- cores de dados/gráficos (ex.: `COR_ANOS`) e `color=` de ícones que ainda não foram revisados.

Uma 2ª passada trocou também atribuições de estilo em JS (`el.style.borderColor = '#...'` vira `var(--token)`), usadas nos hovers antigos.
## Criando uma Nova Página

Toda feature segue o mesmo padrão: **service → hook → página**.

### 1. Service (chamadas à API)

`src/services/minhaFuncionalidade/minhaFuncionalidadeService.js`

```js
import api from '../../config/api';

export const minhaFuncionalidadeService = {
  listar: async () => {
    const res = await api.get('/minha-funcionalidade');
    return res.data;
  },

  criar: async (payload) => {
    const res = await api.post('/minha-funcionalidade', payload);
    return res.data;
  },

  atualizar: async (id, payload) => {
    const res = await api.put(`/minha-funcionalidade/${id}`, payload);
    return res.data;
  },

  excluir: async (id) => {
    const res = await api.delete(`/minha-funcionalidade/${id}`);
    return res.data;
  },
};
```

### 2. Hook (lógica e estado)

`src/hooks/minhaFuncionalidade/useMinhaFuncionalidade.js`

```js
import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { minhaFuncionalidadeService } from '../../services/minhaFuncionalidade/minhaFuncionalidadeService';

export const useMinhaFuncionalidade = () => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado de UI
  const [onEdit, setOnEdit] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [itemSelected, setItemSelected] = useState(null);

  const getDados = useCallback(async () => {
    setLoading(true);
    try {
      const data = await minhaFuncionalidadeService.listar();
      setDados(data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAdd = async (payload) => {
    try {
      await minhaFuncionalidadeService.criar(payload);
      toastSuccess('Criado com sucesso!');
      setShowFormModal(false);
      getDados();
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await minhaFuncionalidadeService.atualizar(onEdit.id, payload);
      toastSuccess('Atualizado com sucesso!');
      setShowFormModal(false);
      getDados();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async () => {
    try {
      await minhaFuncionalidadeService.excluir(itemSelected.id);
      toastSuccess('Removido com sucesso!');
      setShowModal(false);
      getDados();
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCreate = () => {
    setOnEdit(null);
    setShowFormModal(true);
  };

  const handleEdit = (item) => {
    setOnEdit(item);
    setShowFormModal(true);
  };

  const handleOpenModal = (item, action) => {
    setItemSelected(item);
    setShowModal(true);
  };

  return {
    dados, loading, onEdit, showFormModal, showModal, itemSelected,
    getDados, handleAdd, handleUpdate, handleDelete,
    handleOpenCreate, handleEdit, handleOpenModal,
    setShowModal, setShowFormModal,
  };
};
```

### 3. Página (só UI)

`src/pages/minhaFuncionalidade/minhaFuncionalidade.jsx`

```jsx
import { useEffect } from 'react';
import { GridDados } from '../../components/GridDados';
import { useMinhaFuncionalidade } from '../../hooks/minhaFuncionalidade/useMinhaFuncionalidade';
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FiPlus } from 'react-icons/fi';

const colunas = [
  { titulo: 'Nome', acesso: 'nome', width: '60%', align: 'left' },
  { titulo: 'Status', acesso: 'status', width: '20%', align: 'center' },
];

export default function PaginaMinhaFuncionalidade() {
  const {
    dados, loading, onEdit, showFormModal, showModal, itemSelected,
    getDados, handleAdd, handleUpdate, handleDelete,
    handleOpenCreate, handleEdit, handleOpenModal, setShowModal,
  } = useMinhaFuncionalidade();

  const isMobile = useIsMobile();

  useEffect(() => { getDados(); }, [getDados]);

  return (
    <div style={{ padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>Minha Funcionalidade</h1>
        <button onClick={handleOpenCreate}>
          <FiPlus /> {isMobile ? 'Novo' : 'Novo Item'}
        </button>
      </header>

      {loading
        ? <SkeletonTable rows={5} cols={2} />
        : <GridDados
            coluna={colunas} data={dados} labelpesquisa="Buscar..."
            usaEditar acaoEditar={handleEdit}
            usaExcluir acaoExcluir={(item) => handleOpenModal(item, 'delete')}
          />
      }

      {showModal && (
        <ModalConfirmacao
          onClose={() => setShowModal(false)}
          onConfirm={handleDelete}
          action="delete"
          userName={itemSelected?.nome}
        />
      )}
    </div>
  );
}
```

---

## Componentes Disponíveis

### GridDados — tabela com busca e paginação

```jsx
import { GridDados } from '../../components/GridDados';

<GridDados
  coluna={[
    { titulo: 'Nome',   acesso: 'nome',   width: '40%', align: 'left'   },
    { titulo: 'Status', acesso: 'status', width: '20%', align: 'center' },
    { titulo: 'Valor',  acesso: 'valor',  render: (val) => `R$ ${val}`  },
  ]}
  data={minhaLista}
  itemsPerPage={10}
  labelpesquisa="Buscar..."
  usaEditar    acaoEditar={(item) => handleEdit(item)}
  usaExcluir   acaoExcluir={(item) => handleOpenModal(item, 'delete')}
  usaInativar  acaoInativar={(item) => handleOpenModal(item, 'inactivate')}
  usaReativar  acaoReativar={(item) => handleOpenModal(item, 'reactivate')}
/>
```

**Definição de coluna:**
```js
{
  titulo: 'Nome',           // texto do header
  acesso: 'nomeCampo',      // chave no objeto de dados
  width: '20%',             // largura (px, % ou 'auto')
  align: 'left',            // 'left' | 'center' | 'right'
  truncate: true,           // trunca com ellipsis
  render: (val, row) => <></> // renderização customizada
}
```

**Props de ação:** `usaVisualizar`, `usaEditar`, `usaExcluir`, `usaReinvestir`, `usaResetarSenha`, `usaInativar`, `usaReativar` — cada uma com seu par `acao*`.

---

### SkeletonTable — loading

```jsx
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';

{loading ? <SkeletonTable rows={5} cols={3} /> : <GridDados ... />}
```

---

### ModalConfirmacao — confirmação de ação destrutiva

```jsx
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';

{showModal && (
  <ModalConfirmacao
    onClose={() => setShowModal(false)}
    onConfirm={executeAction}
    action="delete"       // 'delete' | 'inactivate' | 'reactivate' | 'reset'
    userName={item?.nome}
  />
)}
```

---

### ModalFormulario — modal de formulário (padrão Usuários)

```jsx
import ModalFormulario from '../../components/ModalFormulario/ModalFormulario';

{showFormModal && (
  <ModalFormulario
    onClose={closeFormModal}
    onSubmit={handleSubmit}
    isEditing={!!onEdit}
    formData={formData}
    setFormData={setFormData}
  />
)}
```

---

### SlideModal — modal lateral deslizante

```jsx
import SlideModal from '../../components/SlideModal/SlideModal';

<SlideModal isOpen={showModal} onClose={() => setShowModal(false)} titulo="Título">
  {/* conteúdo */}
</SlideModal>
```

---

### DataCard — card de métrica/KPI

```jsx
import { DataCard } from '../../components/DataCard';

<DataCard titulo="Total" valor="42" cor="#10b981" />
```

---

### PaginaEmDesenvolvimento — placeholder de página

```jsx
import PaginaEmDesenvolvimento from '../../components/PaginaEmDesenvolvimento/PaginaEmDesenvolvimento';
import { FiSettings } from 'react-icons/fi';

<PaginaEmDesenvolvimento
  titulo="Configurações"
  descricao="Personalize as preferências do sistema"
  icon={FiSettings}
  cor="#64748b"
/>
```

---

## Hooks Utilitários

### useIsMobile — detecta tela mobile

```js
import { useIsMobile } from '../../hooks/useIsMobile';

const isMobile = useIsMobile(); // true se largura < 768px

// Uso:
padding: isMobile ? '1rem' : '2rem'
fontSize: isMobile ? '1.3rem' : '1.6rem'
```

---

## Notificações (Toasts)

Sempre usar as funções do `responseUtils`. **Nunca importar `toast` direto do `react-toastify`.**

```js
import { toastSuccess, toastError, toastWarn, toastInfo, handleError } from '../../utils/responseUtils';

toastSuccess('Salvo com sucesso!');
toastError('Algo deu errado.');
toastWarn('Atenção!');
toastInfo('Informação.');

// No catch:
try { ... } catch (error) { handleError(error); }
```

`handleError` identifica o status automaticamente e exibe a mensagem certa:
- `401` → Sessão expirada
- `403` → Sem permissão
- `404` → Não encontrado
- `5xx` → Erro no servidor
- Sem conexão → Verifique sua internet

---

## Datas

```js
import { formatarDataBR, formatarDataComHora } from '../../utils/dateUtils';

formatarDataBR('2026-06-09')               // "09/06/2026"
formatarDataComHora('2026-06-09T14:30:00') // "09/06/2026, 14:30:00"
formatarDataBR(null)                       // ""

// Nas colunas do GridDados — detecção automática por nome do campo:
// Se o acesso contiver 'data' ou 'cadastro', o GridDados já formata sozinho.
// Para formatação personalizada, use render:
{ titulo: 'Criado em', acesso: 'dataCriacao', render: (val) => formatarDataBR(val) }
```

---

## Chamadas à API

O `api.js` gerencia token e 401 automaticamente.

```js
import api from '../../config/api';

await api.get('/endpoint');
await api.post('/endpoint', payload);
await api.put('/endpoint/123', payload);
await api.delete('/endpoint/123');
```

---

## Adicionando Rota Nova

Em `src/App.jsx`, dentro do bloco protegido:

```jsx
import PaginaMinhaFuncionalidade from './pages/minhaFuncionalidade/minhaFuncionalidade';

<Route path="/minha-funcionalidade" element={<PaginaMinhaFuncionalidade />} />
```

E no `Sidebar.jsx`, adicionar o item de navegação.

---

## Proibido ❌

```js
// ❌ toast direto
import { toast } from 'react-toastify';
toast.success('...');
// ✅ usar responseUtils
import { toastSuccess } from '../../utils/responseUtils';

// ❌ MOBILE_BP local
const MOBILE_BP = 768;
const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
// ✅ usar hook
import { useIsMobile } from '../../hooks/useIsMobile';
const isMobile = useIsMobile();

// ❌ ToastContainer em páginas (já existe no App.jsx)
<ToastContainer />

// ❌ require() — projeto usa ESM
const x = require('./x');
// ✅
import x from './x';

// ❌ console.log de debug no commit
console.log('DEBUG:', item);
```

---

## Checklist — Nova Feature

- [ ] Service criado em `src/services/nomeFuncionalidade/`
- [ ] Hook criado em `src/hooks/nomeFuncionalidade/`
- [ ] Página criada em `src/pages/nomeFuncionalidade/`
- [ ] Colunas do GridDados definidas
- [ ] `useIsMobile` usado para responsividade
- [ ] Erros tratados com `handleError`
- [ ] Toasts com `toastSuccess` / `toastWarn`
- [ ] Rota adicionada no `App.jsx`
- [ ] Item adicionado no `Sidebar.jsx`

---

## Referência Rápida

| Preciso... | Use |
|---|---|
| Formatar data | `formatarDataBR()`, `formatarDataComHora()` |
| Chamar API | `api.get/post/put/delete()` |
| Toast de sucesso/erro | `toastSuccess()`, `toastError()`, `handleError()` |
| Detectar mobile | `useIsMobile()` |
| Exibir tabela | `GridDados` |
| Loading da tabela | `SkeletonTable` |
| Modal de formulário | `ModalFormulario` ou modal inline |
| Confirmação destrutiva | `ModalConfirmacao` |
| Modal lateral | `SlideModal` |
| Card de métrica | `DataCard` |
| Página em construção | `PaginaEmDesenvolvimento` |
