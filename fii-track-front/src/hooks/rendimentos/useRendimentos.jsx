import { useState, useCallback } from 'react';
import { handleError } from '../../utils/responseUtils';
import { rendimentosService } from '../../services/rendimentos/rendimentosService';

export const useRendimentos = () => {
  const [rendimentos,     setRendimentos]     = useState([]);
  const [detalheMensal,   setDetalheMensal]   = useState([]); // [{ mes, ano, totalRendimento }]
  const [detalheAnual,    setDetalheAnual]    = useState([]); // [{ ano, totalRendimento }]
  const [comparacaoAnual, setComparacaoAnual] = useState([]); // [{ mes, ano, totalRendimento }]
  const [loading,         setLoading]         = useState(false);
  const [loadingGrafico,  setLoadingGrafico]  = useState(false);
  const [loadingComp,     setLoadingComp]     = useState(false);

  // Busca a lista de rendimentos (tabela histórico)
  const getRendimentos = useCallback(async ({ mes, ano }) => {
    setLoading(true);
    try {
      const data = await rendimentosService.listar({ mes, ano });
      setRendimentos(data || []);
    } catch (error) {
      handleError(error);
      setRendimentos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca dados dos gráficos (mensal + anual)
  const getGrafico = useCallback(async ({ ano }) => {
    setLoadingGrafico(true);
    try {
      const data = await rendimentosService.dadosGrafico({ ano });
      setDetalheMensal(data?.detalheMensal || []);
      setDetalheAnual(data?.detalheAnual   || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingGrafico(false);
    }
  }, []);

  // Busca comparação mensal entre múltiplos anos
  const getComparacaoAnual = useCallback(async ({ anos }) => {
    setLoadingComp(true);
    try {
      const data = await rendimentosService.comparacaoAnual({ anos });
      setComparacaoAnual(data || []);
    } catch (error) {
      handleError(error);
      setComparacaoAnual([]);
    } finally {
      setLoadingComp(false);
    }
  }, []);

  return {
    rendimentos,
    detalheMensal,
    detalheAnual,
    comparacaoAnual,
    loading,
    loadingGrafico,
    loadingComp,
    getRendimentos,
    getGrafico,
    getComparacaoAnual,
  };
};
