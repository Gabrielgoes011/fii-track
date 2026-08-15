import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PaginaDashboard from './pages/dashboard/dashboard';
import PaginaUsuarios from './pages/cadastros/usuarios/usuarios';
import PaginaConfiguracoes from './pages/configuracoes/configuracoes';
import PaginaPerfil from './pages/perfil/perfil';
import PaginaControleAtivos from './pages/controleAtivos/controleAtivos';
import PaginaRendimentos from './pages/rendimentos/rendimentos';
import PaginaPrecificacao from './pages/precificacao/precificacao';
import PaginaOperacoes from './pages/operacoes/operacoes';
import PaginaRelatorios from './pages/relatorios/relatorios';
import PaginaSeguimentos from './pages/cadastros/seguimentos/seguimentos';
import PaginaMeusFiis from './pages/cadastros/meusFundos/meusFiis';
import Login from './pages/login/login';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { PrivacyProvider } from './context/PrivacyContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsuarioLogado(null);
  };

  const handleLogin = (loggedIn, usuario = null) => {
    setIsLoggedIn(loggedIn);
    setUsuarioLogado(usuario);
  };

  // Restaura a autenticação se houver um token válido em localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
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
        <Outlet />
      </Layout>
    ) : (
      <Navigate to="/login" replace />
    );
  };

  return (
    <PrivacyProvider>
      <SpeedInsights />
      <ToastContainer autoClose={3000} />
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
    </PrivacyProvider>
  );
}

export default App;
