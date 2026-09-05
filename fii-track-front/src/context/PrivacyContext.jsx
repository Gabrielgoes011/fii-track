import React, { createContext, useContext, useState, useCallback } from 'react';

const PrivacyContext = createContext(null);

/**
 * Provider que controla se os valores financeiros estão visíveis ou ocultos.
 * Envolve toda a aplicação em App.jsx.
 */
export function PrivacyProvider({ children }) {
  // Inicia borrado: ao abrir/recarregar o sistema os valores começam ocultos.
  // Se o usuário desligar o olhinho, permanece visível até fechar/reabrir.
  const [valoresOcultos, setValoresOcultos] = useState(true);

  const togglePrivacidade = useCallback(() => {
    setValoresOcultos(v => !v);
  }, []);

  return (
    <PrivacyContext.Provider value={{ valoresOcultos, togglePrivacidade }}>
      {children}
    </PrivacyContext.Provider>
  );
}

/**
 * Hook para consumir o contexto de privacidade em qualquer componente.
 * Exemplo de uso:
 *   const { valoresOcultos, togglePrivacidade } = usePrivacy();
 */
export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy deve ser usado dentro de <PrivacyProvider>');
  return ctx;
}
