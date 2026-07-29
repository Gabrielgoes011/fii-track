import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { rendimentosService } from '../../services/rendimentos/rendimentosService';

export const useRendimentos = () => {
  const [rendimentos,      setRendimentos]      = useState([]);
  const [detalheMensal,    setDetalheMensal]    = useState([]); // [{ mes, ano, totalRendimento }]
  const [detalheAnual,     setDetalheAnual]     = useState([]); // [{ ano, totalRendimento }]
  const [comparacaoAnual,  setComparacaoAnual]  = useState([]); // [{ mes, ano, totalRendimento }]
  const [cardsRendimentos, setCardsRendimentos] = useState(null); // { totalPeriodo, totalAcumulado, totalAcumulado12Meses, totalCompras, totalReinvestido, aporteProprio, yieldOnCost12Meses, retornoAcumulado, percProprio, percReinvestido }
  const [loading,          setLoading]          = useState(false);
  const [loadingGrafico,   setLoadingGrafico]   = useState(false);
  const [loadingComp,      setLoadingComp]      = useState(false);
  const [loadingDelete,    setLoadingDelete]    = useState(false);
  const [loadingCards,     setLoadingCards]     = useState(false);

  // Busca a lista de rendimentos (tabela histórico)
  const getRendimentos = useCallback(async ({ mes, ano, idAtivo }) => {
    setLoading(true);
    try {
      const data = await rendimentosService.listar({ mes, ano, idAtivo });
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

  // Cria um novo rendimento
  const criarRendimento = useCallback(async ({ idAtivo, dtRendimento, valorRecebido, reinvestido }) => {
    try {
      await rendimentosService.criarRendimento({ idAtivo, dtRendimento, valorRecebido, reinvestido });
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, []);

  // Busca os dados dos cards de KPIs de rendimentos
  const getCardsRendimentos = useCallback(async ({ mes, ano, idAtivo }) => {
    setLoadingCards(true);
    try {
      const data = await rendimentosService.cardsRendimentos({ mes, ano, idAtivo });
      setCardsRendimentos(data || null);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  // Exclui um rendimento e atualiza a lista local
  const deleteRendimento = useCallback(async (id) => {
    // 1. Extrai o ID real caso a função receba um Evento do React por acidente
    const targetId = (typeof id === 'object' && id !== null) ? id.id || id.target?.value : id;
    if (!targetId) return false;

    setLoadingDelete(true);
    try {
      await rendimentosService.excluir(targetId);
      // 2. Converte para String na hora de comparar, evitando falhas de tipos diferentes (Number vs String)
      setRendimentos((prev) => prev.filter((item) => String(item.id) !== String(targetId)));
      toastSuccess('Rendimento excluído com sucesso!');
      return true; // Retorna true para o componente saber que deu certo
    } catch (error) {
      handleError(error);
      return false; // Retorna false em caso de falha
    } finally {
      setLoadingDelete(false);
    }
  }, []);

  // Atualiza apenas o estado local até existir uma rota específica para persistir o reinvestimento.
  const marcarComoReinvestido = useCallback((id) => {
    setRendimentos((prev) => prev.map((item) =>
      String(item.id) === String(id) ? { ...item, reinvestido: true } : item
    ));
  }, []);

  return {
    rendimentos,
    detalheMensal,
    detalheAnual,
    comparacaoAnual,
    cardsRendimentos,
    loading,
    loadingGrafico,
    loadingComp,
    loadingDelete,
    loadingCards,
    getRendimentos,
    getGrafico,
    getComparacaoAnual,
    getCardsRendimentos,
    criarRendimento,
    deleteRendimento,
    marcarComoReinvestido,
  };
};
