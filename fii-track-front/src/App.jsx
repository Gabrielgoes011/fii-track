import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PaginaDashboard from './pages/dashboard/dashboard';
import PaginaUsuarios from './pages/cadastros/usuarios/usuarios';
import PaginaConfiguracoes from './pages/configuracoes/configuracoes';
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
import './styles/global.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { PrivacyProvider } from './context/PrivacyContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sempre começa deslogado ao abrir o app:
  // remove o token para garantir que o usuário faça login novamente.
  // Isso evita entrar no dashboard enquanto o servidor (Render) ainda está iniciando.
  React.useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  // Escuta o evento disparado pelo interceptor quando recebe 401
  React.useEffect(() => {
    const handleUnauthorized = () => setIsLoggedIn(false);
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  // Componente Layout protegido
  const ProtectedLayout = () => {
    return isLoggedIn ? (
      <Layout onLogout={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }}>
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
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={setIsLoggedIn} />} 
        />

        {/* Rotas protegidas */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<PaginaDashboard />} />
          <Route path="/controle-ativos" element={<PaginaControleAtivos />} />
          <Route path="/operacoes" element={<PaginaOperacoes />} />
          <Route path="/precificacao" element={<PaginaPrecificacao />} />
          <Route path="/rendimentos" element={<PaginaRendimentos />} />
          <Route path="/relatorios" element={<PaginaRelatorios />} />
          <Route path="/configuracoes" element={<PaginaConfiguracoes />} />
          <Route path="/cadastros/usuarios" element={<PaginaUsuarios />} />
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
