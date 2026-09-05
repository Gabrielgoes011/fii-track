import { useState, useCallback, useRef } from 'react';
import { historicoService } from '../../services/controleAtivos/historicoService';

// ── Hook: useHistoricoCarteira ─────────────────────────────────────────────────
//
// Expõe os dados da aba "Histórico da Carteira":
//   - série de patrimônio (Snapshot_Geral) do usuário;
//   - série de preço de um ticker (carregada sob demanda);
//   - estados de carregamento / vazio / erro (Requirements 5.7, 5.8);
//   - função retry() para refazer a última requisição de patrimônio (Req 5.8).
//
// Segue as convenções do projeto: o `api` já desembrulha { success, data },
// então o service devolve arrays; aqui só gerenciamos o ciclo de vida.

export const useHistoricoCarteira = () => {
  // Série de patrimônio total (Snapshot_Geral)
  const [patrimonio, setPatrimonio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false); // Req 5.8 — falha no carregamento
  const [carregou, setCarregou] = useState(false); // já concluiu ao menos uma carga

  // Série de preço por ticker (carregada sob demanda)
  const [tickerSerie, setTickerSerie] = useState([]);
  const [tickerAtual, setTickerAtual] = useState(null);
  const [loadingTicker, setLoadingTicker] = useState(false);
  const [erroTicker, setErroTicker] = useState(false);

  // Guarda o período usado na última carga para o retry refazer a mesma consulta.
  const periodoRef = useRef({});

  // ── Estado "vazio" (Req 5.7): carregou com sucesso mas sem registros ────────
  const vazio = carregou && !erro && !loading && patrimonio.length === 0;

  // ── Carrega a série de patrimônio total ─────────────────────────────────────
  const carregarPatrimonio = useCallback(async (periodo = {}) => {
    periodoRef.current = periodo;
    setLoading(true);
    setErro(false);
    try {
      const dados = await historicoService.getHistoricoPatrimonio(periodo);
      setPatrimonio(Array.isArray(dados) ? dados : []);
      setCarregou(true);
    } catch (error) {
      setErro(true);
      setPatrimonio([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Carrega a série de preço de um ticker (sob demanda) ─────────────────────
  const carregarTicker = useCallback(async (ticker, periodo = {}) => {
    if (!ticker) return;
    setTickerAtual(ticker);
    setLoadingTicker(true);
    setErroTicker(false);
    try {
      const dados = await historicoService.getHistoricoTicker(ticker, periodo);
      setTickerSerie(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErroTicker(true);
      setTickerSerie([]);
    } finally {
      setLoadingTicker(false);
    }
  }, []);

  // ── Retry (Req 5.8): refaz a última carga de patrimônio ─────────────────────
  const retry = useCallback(() => {
    return carregarPatrimonio(periodoRef.current);
  }, [carregarPatrimonio]);

  return {
    // patrimônio
    patrimonio,
    loading,
    erro,
    vazio,
    carregou,
    carregarPatrimonio,
    retry,

    // ticker (série de preço por ativo)
    tickerSerie,
    tickerAtual,
    loadingTicker,
    erroTicker,
    carregarTicker,
  };
};
