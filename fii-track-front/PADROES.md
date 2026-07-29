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
