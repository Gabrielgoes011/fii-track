import { useState, useCallback } from 'react';
import { toastSuccess, handleError } from '../../utils/responseUtils';
import { operacoesService } from '../../services/operacoes/operacoesService';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const useOperacoes = () => {
  const [operacoes, setOperacoes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Busca operações filtradas por mês e ano
  const getOperacoes = useCallback(async ({ mes, ano }) => {
    setLoading(true);
    try {
      const data = await operacoesService.listar({ mes, ano });

      const formatadas = data.map((op) => {
        const dt = new Date(op.dataOperacao);
        return {
          id: op.id,
          data: dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          operacao: op.tipo,
          ativo: op.ticker,
          seguimento: op.nomeSeguimento,
          qtde: op.quantidade,
          preco: op.preco,
        };
      });

      setOperacoes(formatadas);
    } catch (error) {
      handleError(error);
      setOperacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca dados do gráfico por ano
  const getChartData = useCallback(async ({ ano }) => {
    try {
      const data = await operacoesService.dadosGrafico({ ano });

      // Inicializa todos os 12 meses com zero para manter a linha contínua
      const mesesIniciais = MONTH_NAMES.map((nome) => ({
        name: nome, Compra: 0, Venda: 0, Liquido: 0,
      }));

      data.forEach((item) => {
        const mesIndex = parseInt(item.mes, 10) - 1;
        if (mesIndex >= 0 && mesIndex < 12) {
          mesesIniciais[mesIndex].Compra  = parseFloat(item.totalComprado) || 0;
          mesesIniciais[mesIndex].Venda   = parseFloat(item.totalVendido)  || 0;
          mesesIniciais[mesIndex].Liquido = parseFloat(item.totalLiquido)  || 0;
        }
      });

      setChartData(mesesIniciais);
    } catch (error) {
      handleError(error);
    }
  }, []);

  // Carrega lista de ativos para o dropdown do modal
  const getAtivos = useCallback(async () => {
    try {
      const data = await operacoesService.listarAtivos();
      setAtivos(data);
    } catch (error) {
      handleError(error);
    }
  }, []);

  // Lança nova operação e recarrega os dados
  const handleLancarOperacao = async (payload, { ano, mes }) => {
    try {
      await operacoesService.lancar(payload);
      toastSuccess('Operação cadastrada com sucesso!');
      getOperacoes({ mes, ano });
      getChartData({ ano });
    } catch (error) {
      handleError(error);
    }
  };

  // Exclui operação e recarrega os dados
  const handleExcluirOperacao = async (id, { ano, mes }) => {
    try {
      await operacoesService.excluir(id);
      toastSuccess('Operação excluída com sucesso!');
      getOperacoes({ mes, ano });
      getChartData({ ano });
    } catch (error) {
      handleError(error);
    }
  };

  return {
    operacoes,
    chartData,
    ativos,
    loading,
    getOperacoes,
    getChartData,
    getAtivos,
    handleLancarOperacao,
    handleExcluirOperacao,
  };
};
