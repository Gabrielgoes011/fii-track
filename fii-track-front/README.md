# API Node — Frontend

Interface web para gerenciamento de carteira de FIIs (Fundos de Investimento Imobiliário). Construída com **React 19**, **Vite** e **Tailwind CSS**.

---

## Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| react / react-dom | ^19.2.4 | UI |
| react-router-dom | ^7.14.2 | Roteamento SPA |
| axios | ^1.13.6 | Requisições HTTP |
| react-toastify | ^11.0.5 | Notificações toast |
| react-icons | ^5.6.0 | Ícones |
| react-bootstrap | ^2.10.10 | Componentes de UI |
| tailwindcss | ^3.4.19 | Estilização utilitária |
| vite | ^8.0.10 | Bundler / dev server |

---

## Estrutura do Projeto

```
api-nodefront/
├── public/
├── src/
│   ├── App.jsx                 # Roteamento principal e controle de autenticação
│   ├── index.jsx               # Entry point React
│   ├── components/
│   │   ├── Charts/             # Componentes de gráficos
│   │   ├── DataCard/           # Card de dados genérico
│   │   ├── EmptyState/         # Estado vazio de tabelas/listas
│   │   ├── Layout/             # Layout principal com sidebar
│   │   ├── ModalDeConfirmacao/ # Modal de confirmação de ações
│   │   ├── ModalFormulario/    # Modal genérico de formulário
│   │   ├── ResponsiveForm/     # Formulário responsivo
│   │   ├── Sidebar/            # Menu lateral de navegação
│   │   ├── SkeletonLoader/     # Loading skeleton
│   │   ├── SkeletonTable/      # Loading skeleton para tabelas
│   │   ├── TableAcoes/         # Tabela com ações (editar/deletar)
│   │   ├── Toast/              # Wrapper de notificações
│   │   └── TopBar/             # Barra superior
│   ├── config/                 # Configurações globais (axios, etc.)
│   ├── hooks/                  # Custom hooks
│   ├── pages/
│   │   ├── Dashboard/          # ✅ Dashboard com cards de navegação e stats
│   │   ├── login/              # ✅ Tela de login com autenticação JWT
│   │   ├── cadastros/
│   │   │   ├── usuarios/       # ✅ CRUD de usuários
│   │   │   ├── meusFundos/     # ✅ CRUD de FIIs da carteira
│   │   │   └── seguimentos/    # ✅ CRUD de segmentos
│   │   ├── operacoes/          # ✅ Compras e vendas — lançamento e histórico
│   │   ├── rendimentos/        # ✅ Rendimentos — lançamento e histórico
│   │   ├── controleAtivos/     # 🚧 Em desenvolvimento
│   │   ├── precificacao/       # 🚧 Em desenvolvimento
│   │   ├── relatorios/         # 🚧 Em desenvolvimento
│   │   ├── Usuarios/           # ✅ Gestão de usuários (admin)
│   │   └── Configuracoes/      # 🚧 Em desenvolvimento
│   ├── services/               # Camada de serviços (chamadas à API)
│   ├── styles/
│   │   └── global.css          # Estilos globais
│   └── utils/                  # Utilitários e helpers
└── index.html
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ (recomendado LTS)
- npm
- Backend rodando (ver `api-nodeback/README.md`)

---

## Instalação

```bash
cd api-nodefront
npm install
```

### Variáveis de ambiente

Copie o `.env.example` e configure a URL do backend:

```bash
cp .env.example .env.development
```

```env
VITE_API_URL=http://localhost:3000
```

---

## Scripts

```bash
npm run dev       # Desenvolvimento (modo development)
npm run demo      # Modo demo
npm run build     # Build de produção
npm run preview   # Preview do build de produção
```

---

## Rotas da Aplicação

| Rota | Página | Status |
|---|---|---|
| `/login` | Login | ✅ Pronto |
| `/` | Dashboard | ✅ Pronto |
| `/rendimentos` | Rendimentos | ✅ Pronto |
| `/operacoes` | Compras e Vendas | ✅ Pronto |
| `/cadastros/meusfiis` | Meus FIIs | ✅ Pronto |
| `/cadastros/seguimentos` | Seguimentos | ✅ Pronto |
| `/cadastros/usuarios` | Usuários | ✅ Pronto |
| `/controle-ativos` | Controle de Ativos | 🚧 Em desenvolvimento |
| `/precificacao` | Precificação | 🚧 Em desenvolvimento |
| `/relatorios` | Relatórios | 🚧 Em desenvolvimento |
| `/configuracoes` | Configurações | 🚧 Em desenvolvimento |

> Todas as rotas exceto `/login` são protegidas. Sem token válido no `localStorage`, o usuário é redirecionado para `/login` automaticamente.

---

## Autenticação

O token JWT é armazenado no `localStorage` e enviado automaticamente via interceptor do axios em todas as requisições. Ao receber um `401`, o interceptor dispara o evento `unauthorized`, que desloga o usuário e redireciona para o login.

---

## 📋 Backlog

### Em andamento

- [ ] Controle de Ativos — posição consolidada da carteira (preço médio, quantidade total, valor de mercado)
- [ ] Precificação — cotação em tempo real dos FIIs

### Pendências

- [ ] Página de Relatórios — exportação de dados por período (PDF / Excel)
- [ ] Página de Configurações — preferências do usuário e configurações da conta
- [ ] Gráfico de evolução patrimonial no Dashboard com dados reais da API
- [ ] Responsividade mobile completa
- [ ] Tema claro (atualmente apenas dark mode)
- [ ] Testes automatizados com React Testing Library
- [ ] Internacionalização (i18n)
