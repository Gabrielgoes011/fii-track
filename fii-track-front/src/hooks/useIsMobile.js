import { useState, useEffect } from 'react';

export const MOBILE_BP = 768;

/**
 * Hook que detecta se a tela está em modo mobile (< 768px).
 * Centraliza a lógica de resize listener que antes era duplicada em várias páginas.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}
