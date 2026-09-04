import { useState, useEffect, useCallback } from 'react';
import { handleError } from '../../utils/responseUtils';
import { homeService } from '../../services/home/homeService';

export function useHomeCards() {
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCards = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await homeService.carregarCards();
      setCards({
        operacoes: data?.operacoes ?? 0,
        fundos: data?.fundos ?? 0,
        patrimonio: data?.patrimonio ?? 0,
        custoTotal: data?.custoTotal ?? 0,
        proventos: data?.proventos ?? 0,
        rentabilidadePerc: data?.rentabilidadePerc ?? 0,
        rentabilidadeComProventosPerc: data?.rentabilidadeComProventosPerc ?? 0,
        rendaMensalMedia: data?.rendaMensalMedia ?? 0,
      });
    } catch (err) {
      handleError(err);
      setError(err.message || 'Erro ao carregar dados dos cards');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchCards(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchCards]);

  return { cards, loading, error, refreshCards: fetchCards };
}
