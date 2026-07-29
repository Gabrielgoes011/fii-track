# FIITrack — Frontend

Interface web para gerenciamento de carteira de FIIs (Fundos de Investimento Imobiliário). Construída com **React 19** e **Vite**, usando inline styles como padrão de estilização.

---

## Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| react / react-dom | ^19.2.4 | UI |
| react-router-dom | ^7.14.2 | Roteamento SPA |
| axios | ^1.13.6 | Requisições HTTP |
| react-toastify | ^11.0.5 | Notificações toast |
| react-icons | ^5.6.0 | Ícones |
| @vercel/speed-insights | ^2.0.0 | Métricas de performance |
| vite | ^8.0.10 | Bundler / dev server |

---

## Estrutura do Projeto

```
src/
├── App.jsx                      # Roteamento principal e controle de autenticação
├── index.jsx                    # Entry point React
├── components/
│   ├── Charts/                  # Gráficos (BarChart, AreaChart)
│   ├── DataCard/                # Card de dados/KPI
│   ├── GridDados/               # Tabela universal com busca e paginação
│   ├── Layout/                  # Layout com sidebar e topbar
│   ├── ModalDeConfirmacao/      # Modal de confirmação de ações
│   ├── ModalFormulario/         # Modal de formulário (usado em Usuários)
│   ├── PaginaEmDesenvolvimento/ # Placeholder para páginas em construção
│   ├── Sidebar/                 # Menu lateral de navegação
│   ├── SkeletonTable/           # Loading skeleton para tabelas
│   ├── SlideModal/              # Modal lateral deslizante
│   ├── TopBar/                  # Barra superior
│   └── ValorPrivado/            # Wrapper para ocultar valores financeiros
├── config/
│   └── api.js                   # Cliente axios com interceptores de token e 401
├── context/
│   └── PrivacyContext.jsx       # Contexto do modo privacidade
├── hooks/
│   ├── useIsMobile.js           # Detecta breakpoint mobile (< 768px)
│   ├── cadastros/
│   │   ├── useMeusFiis.js
│   │   ├── useSeguimentos.js
│   │   └── useUsuarios.js
│   ├── home/
│   │   └── useHomeCards.js
│   ├── operacoes/
│   │   └── useOperacoes.js
│   └── rendimentos/
│       └── useRendimentos.js
├── pages/
│   ├── login/                   # ✅ Login com autenticação JWT
│   ├── dashboard/               # ✅ Dashboard com cards e stats
│   ├── rendimentos/             # ✅ Rendimentos — lançamento e histórico
│   ├── operacoes/               # ✅ Compras e vendas — lançamento e histórico
│   ├── cadastros/
│   │   ├── meusFundos/          # ✅ CRUD de FIIs da carteira
│   │   ├── seguimentos/         # ✅ CRUD de seguimentos
│   │   └── usuarios/            # ✅ CRUD de usuários
│   ├── controleAtivos/          # 🚧 Em desenvolvimento
│   ├── precificacao/            # 🚧 Em desenvolvimento
│   ├── relatorios/              # 🚧 Em desenvolvimento
│   └── configuracoes/           # 🚧 Em desenvolvimento
├── services/
│   ├── auth/authService.js
│   ├── cadastros/
│   │   ├── meusFiisService.js
│   │   ├── seguimentosService.js
│   │   └── usuariosService.js
│   ├── home/homeService.js
│   ├── operacoes/operacoesService.js
│   └── rendimentos/rendimentosService.js
├── styles/
│   └── global.css               # Reset, tipografia, scrollbar, modo privacidade
└── utils/
    ├── dateUtils.js             # formatarDataBR, formatarDataComHora
    └── responseUtils.js         # toastSuccess/Error/Warn/Info, handleError, handleResponse
```

---

## Pré-requisitos

- Node.js v18+
- Backend rodando (ver `fii-track-back/README.md`)

---

## Instalação

```bash
cd fii-track-front
npm install
```

### Variáveis de ambiente

```bash
cp .env.example .env.development
```

```env
VITE_API_URL=http://localhost:3000
```

---

## Scripts

```bash
npm run dev       # Desenvolvimento
npm run demo      # Modo demo
npm run build     # Build de produção
npm run preview   # Preview do build
```

---

## Rotas da Aplicação

| Rota | Página | Status |
|---|---|---|
| `/login` | Login | ✅ |
| `/` | Dashboard | ✅ |
| `/rendimentos` | Rendimentos | ✅ |
| `/operacoes` | Operações | ✅ |
| `/cadastros/meusfiis` | Meus FIIs | ✅ |
| `/cadastros/seguimentos` | Seguimentos | ✅ |
| `/cadastros/usuarios` | Usuários | ✅ |
| `/controle-ativos` | Controle de Ativos | 🚧 |
| `/precificacao` | Precificação | 🚧 |
| `/relatorios` | Relatórios | 🚧 |
| `/configuracoes` | Configurações | 🚧 |

Todas as rotas exceto `/login` são protegidas. Sem token válido o usuário é redirecionado automaticamente.

---

## Autenticação

Token JWT armazenado no `localStorage`, anexado automaticamente via interceptor do axios em toda requisição. Ao receber `401`, o interceptor dispara o evento `unauthorized`, desloga o usuário e redireciona para `/login`.

---

## Padrões do Projeto

Ver [`PADROES.md`](./PADROES.md) para guia completo de como criar novas páginas, hooks, services e usar os componentes.

---

## Backlog

### Em andamento

- [ ] Controle de Ativos — posição consolidada da carteira (preço médio, quantidade total, valor de mercado)
- [ ] Precificação — cotação em tempo real dos FIIs

### Pendentes

- [ ] Relatórios — exportação por período (PDF / Excel)
- [ ] Configurações — preferências do usuário
- [ ] Gráfico de evolução patrimonial no Dashboard com dados reais
- [ ] Tema claro (atualmente apenas dark mode)
- [ ] Testes automatizados
