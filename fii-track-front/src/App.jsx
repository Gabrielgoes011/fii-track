import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { authService } from './services/auth/authService';

// Cada tela vira um arquivo separado, baixado só quando a rota é aberta (code splitting).
// O Layout (barra, menu) continua no pacote principal porque aparece em todas as telas.
const PaginaDashboard = lazy(() => import('./pages/dashboard/dashboard'));
const PaginaUsuarios = lazy(() => import('./pages/cadastros/usuarios/usuarios'));
const PaginaPerfil = lazy(() => import('./pages/perfil/perfil'));
const PaginaControleAtivos = lazy(() => import('./pages/controleAtivos/controleAtivos'));
const PaginaDiversificacao = lazy(() => import('./pages/diversificacao/diversificacao'));
const PaginaRendimentos = lazy(() => import('./pages/rendimentos/rendimentos'));
const PaginaPrecificacao = lazy(() => import('./pages/precificacao/precificacao'));
const PaginaOperacoes = lazy(() => import('./pages/operacoes/operacoes'));
const PaginaRelatorios = lazy(() => import('./pages/relatorios/relatorios'));
const PaginaSeguimentos = lazy(() => import('./pages/cadastros/seguimentos/seguimentos'));
const PaginaMeusFiis = lazy(() => import('./pages/cadastros/meusFundos/meusFiis'));
const Login = lazy(() => import('./pages/login/login'));

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { PrivacyProvider } from './context/PrivacyContext';

// Aviso mostrado enquanto o arquivo da tela é baixado. `cheio` ocupa a tela toda (login);
// sem ele fica só na área de conteúdo (o menu e a barra de cima continuam na tela).
function CarregandoPagina({ cheio = false }) {
  return (
    <div style={{
      minHeight: cheio ? '100vh' : '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: cheio ? 'var(--bg-pagina)' : 'transparent', color: 'var(--texto-mudo)',
      fontFamily: 'sans-serif', fontSize: '14px',
    }}>
      Carregando...
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  // Enquanto validamos a sessão no boot, não renderizamos nada (evita "piscar"
  // o dashboard com usuário vazio antes de decidir login vs. app).
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsuarioLogado(null);
  };

  const handleLogin = (loggedIn, usuario = null) => {
    setIsLoggedIn(loggedIn);
    setUsuarioLogado(usuario);
  };

  // No boot, valida a sessão de verdade: só considera logado se houver token
  // E o /auth/me responder com o usuário. Sem token (ou token inválido), vai
  // direto para o login — sem renderizar o app com um "Usuário" vazio.
  React.useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoggedIn(false);
      setUsuarioLogado(null);
      setVerificandoSessao(false);
      return;
    }

    let ativo = true;
    (async () => {
      try {
        const data = await authService.me();
        const usuario = data?.usuario ?? data ?? null;
        if (!ativo) return;
        if (usuario) {
          setUsuarioLogado(usuario);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUsuarioLogado(null);
        }
      } catch {
        // Token inválido/expirado: limpa e cai no login.
        if (!ativo) return;
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUsuarioLogado(null);
      } finally {
        if (ativo) setVerificandoSessao(false);
      }
    })();

    return () => { ativo = false; };
  }, []);

  // Escuta o evento disparado pelo interceptor quando recebe 401
  React.useEffect(() => {
    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      setUsuarioLogado(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  // Componente Layout protegido
  const ProtectedLayout = () => {
    return isLoggedIn ? (
      <Layout onLogout={handleLogout} user={usuarioLogado}>
        <Suspense fallback={<CarregandoPagina />}>
          <Outlet />
        </Suspense>
      </Layout>
    ) : (
      <Navigate to="/login" replace />
    );
  };

  // Enquanto a sessão está sendo validada no boot, não renderiza as rotas.
  // Evita exibir o dashboard (com usuário vazio) antes de decidir login vs. app.
  if (verificandoSessao) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg-pagina)', color: 'var(--texto-mudo)', fontFamily: 'sans-serif', fontSize: '14px',
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <PrivacyProvider>
      <SpeedInsights />
      <ToastContainer autoClose={3000} />
      <Suspense fallback={<CarregandoPagina cheio />}>
      <Routes>
        {/* Rota de login */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />

        {/* Rotas protegidas */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<PaginaDashboard />} />
          <Route path="/controle-ativos" element={<PaginaControleAtivos />} />
          <Route path="/diversificacao" element={<PaginaDiversificacao />} />
          <Route path="/operacoes" element={<PaginaOperacoes />} />
          <Route path="/precificacao" element={<PaginaPrecificacao />} />
          <Route path="/rendimentos" element={<PaginaRendimentos />} />
          <Route path="/relatorios" element={<PaginaRelatorios />} />
          <Route path="/configuracoes" element={<Navigate to="/" replace />} />
          <Route
            path="/perfil"
            element={usuarioLogado ? <PaginaPerfil usuario={usuarioLogado} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/cadastros/usuarios"
            element={usuarioLogado?.adm ? <PaginaUsuarios /> : <Navigate to="/" replace />}
          />
          <Route path="/cadastros/seguimentos" element={<PaginaSeguimentos />} />
          <Route path="/cadastros/meusfiis" element={<PaginaMeusFiis />} />
          <Route path="/operacao" element={<Navigate to="/operacoes" replace />} />
        </Route>

        {/* Rota padrão - redireciona para login se não encontrar */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
      </Routes>
      </Suspense>
    </PrivacyProvider>
  );
}

export default App;
