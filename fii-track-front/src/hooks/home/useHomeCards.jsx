import { useState, useEffect } from 'react';
import { handleError } from '../../utils/responseUtils';
import { homeService } from '../../services/home/homeService';

export function useHomeCards() {
  const [cards,   setCards]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await homeService.carregarCards();
        setCards({
          operacoes: data?.operacoes ?? 0,
          fundos:    data?.fundos    ?? 0,
        });
      } catch (err) {
        handleError(err);
        setError(err.message || 'Erro ao carregar dados dos cards');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  return { cards, loading, error };
}
