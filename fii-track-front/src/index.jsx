import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Após um novo deploy, um cliente com o index.html em cache pode tentar carregar
// chunks JS antigos que não existem mais, disparando um erro de import dinâmico.
// Quando isso acontece, recarregamos a página UMA vez para buscar o bundle novo.
// O flag em sessionStorage evita loop de reload caso o erro seja de outra causa.
function recarregarSeChunkDesatualizado(evento) {
  const msg = String(evento?.reason?.message || evento?.message || '');
  const ehErroDeChunk =
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i.test(msg);

  if (ehErroDeChunk && !sessionStorage.getItem('chunkReloadFeito')) {
    sessionStorage.setItem('chunkReloadFeito', '1');
    window.location.reload();
  }
}

window.addEventListener('error', recarregarSeChunkDesatualizado);
window.addEventListener('unhandledrejection', recarregarSeChunkDesatualizado);

// Carregou com sucesso: limpa o flag para permitir um novo reload em deploys futuros.
window.addEventListener('load', () => sessionStorage.removeItem('chunkReloadFeito'));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);