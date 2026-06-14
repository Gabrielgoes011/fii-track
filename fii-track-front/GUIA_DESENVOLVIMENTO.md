# 📚 Guia de Desenvolvimento - FIITrack Frontend

Documentação completa sobre como usar funções, utilitários, hooks e componentes da aplicação frontend.

---

## 📑 Sumário

1. [Utilitários (Utils)](#utilitários-utils)
2. [Configurações (Config)](#configurações-config)
3. [Hooks Personalizados](#hooks-personalizados)
4. [Serviços (Services)](#serviços-services)
5. [Componentes Principais](#componentes-principais)
6. [Padrões e Boas Práticas](#padrões-e-boas-práticas)
7. [Exemplos de Implementação](#exemplos-de-implementação)

---

## 🔧 Utilitários (Utils)

### `dateUtils.jsx` - Formatação de Datas

Funções para padronizar a formatação de datas em formato brasileiro (PT-BR).

#### **`formatarDataBR(data: string | Date): string`**

Formata uma data para o padrão brasileiro (DD/MM/YYYY).

```javascript
import { formatarDataBR } from '../../utils/dateUtils';

// Uso:
const dataBR = formatarDataBR('2026-06-09'); // "09/06/2026"
const dataVazia = formatarDataBR(null);       // ""
const dataHoje = formatarDataBR(new Date()); // "09/06/2026"
```

**Parâmetros:**
- `data` (string | Date | null): Data a ser formatada

**Retorno:**
- String no formato DD/MM/YYYY ou string vazia se inválido

**Notas:**
- Retorna `''` se a data for nula/indefinida
- Funciona com strings ISO (ex: "2026-06-09") e objetos Date

---

#### **`formatarDataComHora(data: string | Date): string`**

Formata uma data com hora no padrão brasileiro (DD/MM/YYYY HH:MM:SS).

```javascript
import { formatarDataComHora } from '../../utils/dateUtils';

// Uso:
const dataComHora = formatarDataComHora('2026-06-09T14:30:00'); 
// "09/06/2026, 14:30:00"

const dataSemHora = formatarDataComHora(null); // ""
```

**Parâmetros:**
- `data` (string | Date | null): Data a ser formatada

**Retorno:**
- String no formato DD/MM/YYYY, HH:MM:SS ou string vazia

---

### `responseUtils.jsx` - Tratamento de Respostas HTTP

Centraliza o tratamento de respostas HTTP e exibição de notificações via `react-toastify`.

#### **Funções Helper (Toast)**

Disparam notificações rápidas sem precisar de uma resposta de API.

```javascript
import { 
  toastSuccess, toastError, toastWarn, toastInfo 
} from '../../utils/responseUtils';

// Sucesso (verde)
toastSuccess('Operação realizada com sucesso!');

// Erro (vermelho)
toastError('Não foi possível completar a ação.');

// Aviso (amarelo)
toastWarn('Atenção: você está prestes a deletar.');

// Informação (azul)
toastInfo('Dados carregados com sucesso.');
```

---

#### **`handleResponse(response, customMsg?): void`**

Trata respostas de sucesso (status 2xx) da API.

```javascript
import { handleResponse } from '../../utils/responseUtils';

try {
  const res = await api.post('/usuarios', { nome: 'João' });
  handleResponse(res); // Exibe mensagem padrão baseado no status
  
  // Ou com mensagem customizada:
  handleResponse(res, 'Usuário criado com sucesso!');
} catch (error) {
  handleError(error);
}
```

**Parâmetros:**
- `response` (AxiosResponse): Resposta do axios
- `customMsg` (string, opcional): Mensagem personalizada

**Comportamento:**
- Se status 204 (No Content): exibe mensagem de sucesso
- Se status 2xx: busca mensagem em: `customMsg` → `response.data.message` → `response.data.mensagem` → padrão
- Dispara um toast com a mensagem apropriada

**Mensagens Padrão por Status:**
```
200: "Operação realizada com sucesso!"
201: "Cadastro realizado com sucesso!"
204: "Registro removido com sucesso!"
```

---

#### **`handleError(error): void`**

Trata erros de requisição HTTP (4xx, 5xx, network).

```javascript
import { handleError } from '../../utils/responseUtils';

try {
  await api.get('/dados');
} catch (error) {
  handleError(error); // Identifica tipo de erro e exibe mensagem apropriada
}
```

**Identifica automaticamente:**
- `401` → "Sessão expirada. Faça login novamente."
- `403` → "Você não tem permissão para realizar esta ação."
- `404` → "Recurso não encontrado."
- `422` → "Não foi possível processar os dados enviados."
- `5xx` → "Erro interno no servidor. Tente novamente mais tarde."
- Sem conexão → "Sem conexão com o servidor. Verifique sua internet."
- Timeout → "A requisição demorou demais. Tente novamente."

---

## ⚙️ Configurações (Config)

### `api.js` - Cliente HTTP com Axios

Configuração centralizada do cliente HTTP com interceptadores automáticos.

#### **Inicialização**

```javascript
import api from '../../config/api';

// A base URL é carregada de VITE_API_URL no .env
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

#### **Interceptadores Automáticos**

**1. Request Interceptor - Anexa Token JWT**

Toda requisição automaticamente inclui o token armazenado em localStorage:

```javascript
// O token é anexado automaticamente:
api.get('/usuarios'); 
// Equivalente a: GET /usuarios com header "Authorization: Bearer {token}"
```

**2. Response Interceptor - Padroniza Respostas**

Extrai automaticamente o `data` de respostas estruturadas:

```javascript
// Se a API retorna: { success: true, data: { usuarios: [...] } }
// O frontend recebe automaticamente: { usuarios: [...] }
```

#### **Exemplo de Uso**

```javascript
import api from '../../config/api';

// GET
const usuarios = await api.get('/usuarios');
console.log(usuarios.data); // Array de usuários

// POST
const novoUsuario = await api.post('/usuario/cadastrar', {
  nome: 'João',
  email: 'joao@example.com'
});

// PUT
await api.put('/users/update/123', { nome: 'João Silva' });

// DELETE
await api.delete('/users/delete/123');
```

---

## 🎣 Hooks Personalizados

### Padrão Geral dos Hooks

Todos os hooks seguem um padrão:
1. Gerenciam estado de dados, loading e erro
2. Chamam serviços para buscar/manipular dados
3. Retornam estado + funções de ação

---

### **`useHomeCards()`**

Hook para carregar dados do dashboard home.

```javascript
import { useHomeCards } from '../../hooks/useHomeCards';

export default function Dashboard() {
  const { cards, loading, error } = useHomeCards();

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <div>
      <p>Operações: {cards.operacoes}</p>
      <p>Fundos: {cards.fundos}</p>
    </div>
  );
}
```

**Retorno:**
```javascript
{
  cards: { operacoes: 0, fundos: 0 },
  loading: boolean,
  error: string | null
}
```

---

### **`useUsuarios()`**

Hook completo para CRUD de usuários.

```javascript
import { useUsuarios } from '../../hooks/hooksCadastros/useUsuarios';

export default function PaginaUsuarios() {
  const {
    users,           // Array de usuários
    loading,         // boolean
    onEdit,          // Usuário em edição (null se não)
    activeTab,       // 'ativos' | 'inativos'
    dashboard,       // { ativos, inativos, total }
    showModal,       // boolean
    userSelected,    // Usuário selecionado para ação
    modalAction,     // 'delete' | 'edit' etc
    showFormModal,   // boolean
    
    // Funções de ação
    getUsers,        // () => Promise<void>
    getDashboard,    // () => Promise<void>
    handleAddUser,   // (novoUsuario) => Promise<void>
    handleUpdateUser,// (usuarioAtualizado) => Promise<void>
    handleDeleteUser,// (userId) => Promise<void>
    handleInativar,  // (userId) => Promise<void>
    handleReativar,  // (userId) => Promise<void>
    setOnEdit,
    setActiveTab,
    setShowModal,
    setUserSelected,
    setModalAction,
    setShowFormModal,
    resetForm
  } = useUsuarios();

  useEffect(() => {
    getUsers();
    getDashboard();
  }, [activeTab]);

  return (
    // Renderizar tabela, modais, etc
  );
}
```

---

### **`useSeguimentos()`**

Hook para CRUD de seguimentos (setores/categorias).

```javascript
import { useSeguimentos } from '../../hooks/hooksCadastros/useSeguimentos';

const {
  seguimentos,
  loading,
  getSeguimentos,
  handleAddSeguimento,
  handleUpdateSeguimento,
  handleDeleteSeguimento,
  showModal,
  setShowModal
} = useSeguimentos();
```

---

### **`useMeusFiis()`**

Hook para gerenciar fundos imobiliários do usuário.

```javascript
import { useMeusFiis } from '../../hooks/hooksCadastros/useMeusFiis';

const {
  fiis,
  loading,
  getMeusFiis,
  handleAddFii,
  handleUpdateFii,
  handleDeleteFii,
  // ... estado de modais e seleções
} = useMeusFiis();
```

---

### **`useOperacoes()`**

Hook para gerenciar operações de compra/venda.

```javascript
import { useOperacoes } from '../../hooks/hooksOperacoes/useOperacoes';

const {
  operacoes,
  chartData,
  loading,
  getOperacoes,    // ({ mes, ano })
  getChartData,    // ({ ano })
  handleLancarOperacao,
  handleExcluirOperacao
} = useOperacoes();
```

---

### **`useRendimentos()`**

Hook para gerenciar rendimentos (dividendos).

```javascript
import { useRendimentos } from '../../hooks/hooksRendimentos/useRendimentos';

const {
  rendimentos,
  loading,
  getRendimentos,
  handleAddRendimento,
  handleDeleteRendimento
} = useRendimentos();
```

---

## 📡 Serviços (Services)

Serviços são wrappers diretos para a API, sem lógica de estado.

### **`usuariosService.jsx`**

```javascript
import { usuariosService } from '../../services/servCadastros/usuariosService';

// Listar todos (status: 'on' | 'off')
const usuarios = await usuariosService.listarTodos('on'); // Retorna array

// Criar novo usuário
const novoUser = await usuariosService.criar({
  nome: 'João',
  email: 'joao@example.com',
  cpf: '123.456.789-00',
  dataNascimento: '1990-01-15'
});

// Atualizar usuário
const updated = await usuariosService.atualizar(userId, {
  nome: 'João Silva',
  email: 'joao.silva@example.com'
});

// Inativar/Reativar (toggle)
const toggled = await usuariosService.inativarReativar(userId);

// Contar usuários
const stats = await usuariosService.contar();
// Retorna: { ativos: 5, inativos: 2, total: 7 }

// Deletar definitivamente
await usuariosService.deletar(userId);
```

---

### **`seguimentosService.jsx`**

```javascript
import { seguimentosService } from '../../services/servCadastros/seguimentosService';

// Listar todos
const seguimentos = await seguimentosService.listarTodos();

// Criar
const novo = await seguimentosService.criar({
  nome: 'Tecnologia',
  descricao: 'Fundos de tecnologia'
});

// Atualizar
await seguimentosService.atualizar(id, { nome: 'Tech' });

// Deletar
await seguimentosService.deletar(id);
```

---

### **`meusFiisService.jsx`**

```javascript
import { meusFiisService } from '../../services/servCadastros/meusFiisService';

// Listar FIIs do usuário
const fiis = await meusFiisService.listarMeusFiis();

// Adicionar FII à carteira
await meusFiisService.adicionarFii({
  fiiId: 123,
  qtde: 100,
  precoMedio: 95.50
});

// Deletar FII
await meusFiisService.deletarFii(fiiId);
```

---

## 🎨 Componentes Principais

### **`GridDados` - Tabela Universal**

Componente reutilizável para exibir dados em tabelas com funcionalidades como busca, paginação e ações.

#### Props

```javascript
<GridDados
  // OBRIGATÓRIAS
  coluna={Array<IColuna>}      // Definição das colunas
  data={Array<any>}            // Dados a exibir
  
  // OPCIONAIS
  itemsPerPage={10}            // Itens por página
  labelpesquisa="Buscar..."    // Placeholder da busca
  
  // AÇÕES (Opcional ativar apenas as que usa)
  usaVisualizar={false}
  acaoVisualizar={(row) => {}}
  usaEditar={false}
  acaoEditar={(row) => {}}
  usaExcluir={false}
  acaoExcluir={(row) => {}}
  usaResetarSenha={false}
  acaoResetarSenha={(row) => {}}
  usaInativar={false}
  acaoInativar={(row) => {}}
  usaReativar={false}
  acaoReativar={(row) => {}}
/>
```

#### Interface `IColuna`

Define a estrutura de cada coluna:

```typescript
interface IColuna {
  titulo: string;           // Rótulo da coluna (aparece no header)
  acesso: string;           // Chave do objeto de dados (ex: "nome")
  width?: string;           // Largura (ex: "100px", "20%", "auto")
  align?: 'left'|'center'|'right';  // Alinhamento do conteúdo
  truncate?: boolean;       // Se deve truncar com ellipsis
  sticky?: 'left'|'right';  // Fixa coluna na lateral
  render?: (val, row) => ReactNode; // Renderização customizada (opcional)
}
```

#### Exemplo de Uso

```javascript
import { GridDados } from '../../components/GridDados';
import { useUsuarios } from '../../hooks/hooksCadastros/useUsuarios';

export default function PaginaUsuarios() {
  const { users, handleEdit, handleDelete } = useUsuarios();

  const colunas = [
    { titulo: 'ID', acesso: 'id', width: '60px', align: 'center' },
    { titulo: 'Nome', acesso: 'nome', width: '200px' },
    { titulo: 'Email', acesso: 'email', width: '250px', truncate: true },
    { 
      titulo: 'Data Cadastro', 
      acesso: 'dataCadastro',
      width: '120px',
      align: 'center',
      render: (val) => formatarDataBR(val) // Render customizado
    },
    {
      titulo: 'Status',
      acesso: 'ativo',
      width: '100px',
      align: 'center',
      render: (val) => val ? '✓ Ativo' : '✗ Inativo'
    }
  ];

  return (
    <GridDados
      coluna={colunas}
      data={users}
      itemsPerPage={10}
      labelpesquisa="Buscar usuários..."
      usaEditar={true}
      acaoEditar={handleEdit}
      usaExcluir={true}
      acaoExcluir={handleDelete}
    />
  );
}
```

---

### **`DataCard` - Container de Tabela**

Wrapper padrão que envolve uma `GridDados` com título, subtítulo, botão de ação e rodapé.

```javascript
import DataCard from '../../components/DataCard/DataCard';

<DataCard
  titulo="Usuários Cadastrados"
  subtitulo="Gestão de usuários do sistema"
  botaoLabel="+ Novo Usuário"
  onBotaoClick={() => setShowModal(true)}
  coluna={colunas}
  data={usuarios}
  usaEditar={true}
  acaoEditar={handleEdit}
  usaExcluir={true}
  acaoExcluir={handleDelete}
  rodape="Total de usuários: 42"
/>
```

---

### **`ModalFormulario` - Modal de Formulário**

Modal para captar dados do usuário (criar/editar).

```javascript
import ModalFormulario from '../../components/ModalFormulario/ModalFormulario';

<ModalFormulario
  isOpen={showFormModal}
  onClose={() => setShowFormModal(false)}
  titulo="Novo Usuário"
  campos={[
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'cpf', label: 'CPF', type: 'text', maxLength: 14 }
  ]}
  onSubmit={(dados) => handleAddUser(dados)}
  botaoLabel="Cadastrar"
/>
```

---

### **`ModalConfirmacao` - Modal de Confirmação**

Modal para confirmar ações destrutivas.

```javascript
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';

<ModalConfirmacao
  isOpen={showDeleteModal}
  titulo="Deletar Usuário?"
  mensagem={`Tem certeza que deseja deletar ${userSelected?.nome}?`}
  botaoPrimario="Deletar"
  botaoSecundario="Cancelar"
  onPrimario={() => handleDelete(userSelected.id)}
  onSecundario={() => setShowDeleteModal(false)}
  isDanger={true}
/>
```

---

### **`SkeletonTable` - Skeleton Loader para Tabelas**

Placeholder enquanto dados carregam.

```javascript
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';

{loading ? (
  <SkeletonTable rows={5} cols={4} />
) : (
  <GridDados {...props} />
)}
```

---

### **`Layout` - Layout Principal**

Wrapper que fornece Sidebar e TopBar.

```javascript
import Layout from '../../components/Layout/Layout';

export default function Dashboard() {
  return (
    <Layout>
      {/* Seu conteúdo aqui */}
    </Layout>
  );
}
```

---

## 📋 Padrões e Boas Práticas

### **1. Estrutura de um Hook**

```javascript
import { useState, useCallback, useEffect } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { meuService } from '../../services/minhaServico';

export const meuHook = () => {
  // Estado de dados
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado de UI (modal, edicao)
  const [showModal, setShowModal] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // Função para fetch (com useCallback para evitar re-renders)
  const getDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await meuService.listar();
      setDados(result);
    } catch (err) {
      handleError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função CRUD
  const handleCreate = async (novoItem) => {
    try {
      await meuService.criar(novoItem);
      toastSuccess('Criado com sucesso!');
      getDados(); // Recarrega lista
      setShowModal(false);
    } catch (err) {
      handleError(err);
    }
  };

  // Auto-fetch ao montar
  useEffect(() => {
    getDados();
  }, [getDados]);

  // Return sempre com mesmo padrão
  return {
    dados, loading, error,
    showModal, setShowModal,
    itemSelecionado, setItemSelecionado,
    getDados,
    handleCreate
  };
};
```

---

### **2. Estrutura de um Serviço**

```javascript
import api from '../../config/api';

export const meuService = {
  listar: async (filtros) => {
    try {
      const res = await api.get('/endpoint', { params: filtros });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  criar: async (dados) => {
    try {
      const res = await api.post('/endpoint', dados);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  atualizar: async (id, dados) => {
    try {
      const res = await api.put(`/endpoint/${id}`, dados);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  deletar: async (id) => {
    try {
      const res = await api.delete(`/endpoint/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  }
};
```

---

### **3. Estrutura de um Componente Página**

```javascript
import { useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import DataCard from '../../components/DataCard/DataCard';
import ModalFormulario from '../../components/ModalFormulario/ModalFormulario';
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';
import { useMeuHook } from '../../hooks/useMeuHook';

export default function MinhaPage() {
  const {
    dados,
    loading,
    showModal, setShowModal,
    itemSelecionado, setItemSelecionado,
    getDados,
    handleCreate,
    handleDelete
  } = useMeuHook();

  // Carregar dados quando página monta
  useEffect(() => {
    getDados();
  }, []);

  // Definir colunas
  const colunas = [
    { titulo: 'ID', acesso: 'id', width: '60px' },
    { titulo: 'Nome', acesso: 'nome', width: '200px' }
  ];

  return (
    <Layout>
      <main style={{ padding: '2rem' }}>
        <DataCard
          titulo="Meus Dados"
          botaoLabel="+ Novo"
          onBotaoClick={() => setShowModal(true)}
          coluna={colunas}
          data={dados}
          usaEditar={true}
          usaExcluir={true}
          acaoExcluir={(item) => {
            setItemSelecionado(item);
            setShowDeleteModal(true);
          }}
        />

        <ModalFormulario
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          titulo="Novo Item"
          campos={[...]}
          onSubmit={handleCreate}
        />

        <ModalConfirmacao
          isOpen={showDeleteModal}
          onPrimario={() => handleDelete(itemSelecionado.id)}
          // ...
        />
      </main>
    </Layout>
  );
}
```

---

## 💡 Exemplos de Implementação

### Exemplo 1: Listar Dados Simples

```javascript
import { useEffect } from 'react';
import { GridDados } from '../../components/GridDados';
import api from '../../config/api';
import { handleError } from '../../utils/responseUtils';

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/produtos');
        setProdutos(res.data);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const colunas = [
    { titulo: 'Produto', acesso: 'nome', width: '250px' },
    { titulo: 'Preço', acesso: 'preco', width: '100px', align: 'right' },
    { titulo: 'Estoque', acesso: 'estoque', width: '80px', align: 'center' }
  ];

  return <GridDados coluna={colunas} data={produtos} />;
}
```

---

### Exemplo 2: CRUD Completo com Hook

```javascript
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import DataCard from '../../components/DataCard/DataCard';
import ModalFormulario from '../../components/ModalFormulario/ModalFormulario';
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';
import { useMeuHook } from '../../hooks/useMeuHook';

export default function GerenciadorCompleto() {
  const {
    dados,
    loading,
    getDados,
    handleCreate,
    handleDelete,
    showModal,
    setShowModal
  } = useMeuHook();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemADeletar, setItemADeletar] = useState(null);

  useEffect(() => {
    getDados();
  }, []);

  const colunas = [
    { titulo: 'ID', acesso: 'id', width: '60px', align: 'center' },
    { titulo: 'Nome', acesso: 'nome', width: '300px' },
    { titulo: 'Status', acesso: 'ativo', width: '100px', align: 'center', 
      render: (val) => val ? '✓' : '✗' }
  ];

  return (
    <Layout>
      <DataCard
        titulo="Gerenciador"
        botaoLabel="+ Novo"
        onBotaoClick={() => setShowModal(true)}
        coluna={colunas}
        data={dados}
        usaExcluir={true}
        acaoExcluir={(item) => {
          setItemADeletar(item);
          setShowDeleteConfirm(true);
        }}
      />

      <ModalFormulario
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        titulo="Novo Item"
        campos={[
          { name: 'nome', label: 'Nome', type: 'text', required: true }
        ]}
        onSubmit={handleCreate}
      />

      <ModalConfirmacao
        isOpen={showDeleteConfirm}
        titulo="Confirmar Deleção"
        mensagem={`Deletar ${itemADeletar?.nome}?`}
        botaoPrimario="Deletar"
        isDanger={true}
        onPrimario={() => {
          handleDelete(itemADeletar.id);
          setShowDeleteConfirm(false);
        }}
        onSecundario={() => setShowDeleteConfirm(false)}
      />
    </Layout>
  );
}
```

---

### Exemplo 3: Formatação de Datas em Tabela

```javascript
import { formatarDataBR, formatarDataComHora } from '../../utils/dateUtils';

const colunas = [
  { 
    titulo: 'Criado em', 
    acesso: 'dataCriacao',
    render: (val) => formatarDataBR(val) // Apenas data
  },
  { 
    titulo: 'Atualizado em', 
    acesso: 'dataAtualizacao',
    render: (val) => formatarDataComHora(val) // Data + hora
  }
];
```

---

### Exemplo 4: Tratamento de Erros Customizado

```javascript
import { handleError, toastError } from '../../utils/responseUtils';

const handleDeleteUsuario = async (usuarioId) => {
  try {
    await usuariosService.deletar(usuarioId);
    // sucesso é tratado automaticamente
  } catch (error) {
    // handleError já faz o toast automaticamente
    handleError(error);
    
    // Ou customizar mensagem:
    if (error.response?.status === 403) {
      toastError('Você não pode deletar este usuário.');
    } else {
      handleError(error);
    }
  }
};
```

---

## 🚀 Checklist para Criar Nova Feature

- [ ] Criar serviço em `src/services/servXXX/`
- [ ] Criar hook em `src/hooks/hookXXX.jsx`
- [ ] Criar página em `src/pages/novaPage/`
- [ ] Importar componentes (GridDados, DataCard, Modal)
- [ ] Implementar padrão CRUD no hook
- [ ] Definir colunas (IColuna[])
- [ ] Testar fluxo completo (listar, criar, editar, deletar)
- [ ] Adicionar rota em router
- [ ] Testar notificações (toast)
- [ ] Tratar erros com handleError()

---

## 📞 Suporte Rápido

| Preciso... | Use... |
|-----------|--------|
| Formatar data | `formatarDataBR()`, `formatarDataComHora()` |
| Chamar API | `api.get()`, `api.post()`, `api.put()`, `api.delete()` |
| Exibir notificação | `toastSuccess()`, `toastError()`, `handleError()` |
| Gerenciar dados | `useXxxHook()` |
| Exibir tabela | `GridDados` com `IColuna[]` |
| Modal de formulário | `ModalFormulario` |
| Confirmação | `ModalConfirmacao` |
| Carregando... | `SkeletonTable` |

---

**Última atualização:** 09/06/2026  
**Versão:** 1.0
