import React, { createContext, useContext, useState, useCallback } from 'react';

const PrivacyContext = createContext(null);

/**
 * Provider que controla se os valores financeiros estão visíveis ou ocultos.
 * Envolve toda a aplicação em App.jsx.
 */
export function PrivacyProvider({ children }) {
  const [valoresOcultos, setValoresOcultos] = useState(false);

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
