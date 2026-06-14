import { useState, useEffect } from 'react';
import api from '../../config/api';

export function useHomeCards() {
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/home/cards');
        
        // A API retorna { operacoes: 0, fundos: 0 }
        setCards({
          operacoes: response.data.operacoes || 0,
          fundos: response.data.fundos || 0
        });
        console.log('Dados carregados:', response.data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados dos cards');
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  return { cards, loading, error };
}
