import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';

// ─── Dados mock para desenvolvimento (remover quando backend estiver pronto) ───
const MOCK_DATA = {
  resumo: {
    custoTotal:          50190.14,
    valorAtualTotal:     48823.58,
    rentabilidadeReais:  -1366.56,
    rentabilidadePerc:   -0.0272,
    totalProventos:       4250.80,
    dataAtualizacaoCotacoes: '2026-07-28',
  },
  ativos: [
    {
      idAtivo: 1, ticker: 'BRCO11', segmento: 'Logística',
      cotacao: 113.72, quantidade: 7, precoMedio: 116.16,
      custo: 813.12, valorAtual: 796.04,
      rentabilidadeReais: -17.08, rentabilidadePerc: -0.021,
      rentabilidadeTotalPerc: 0.1821,
      precoTeto: 94.25, desconto: -0.1712,
      percAtual: 0.0352, percIdeal: 0.05,
      acaoEquilibrio: 'aportar', valorEquilibrio: 333.34,
    },
    {
      idAtivo: 2, ticker: 'BTCI11', segmento: 'Papel',
      cotacao: 9.09, quantidade: 181, precoMedio: 9.23,
      custo: 1671.21, valorAtual: 1645.29,
      rentabilidadeReais: -25.92, rentabilidadePerc: -0.0155,
      rentabilidadeTotalPerc: 0.1836,
      precoTeto: null, desconto: null,
      percAtual: 0.0728, percIdeal: 0.075,
      acaoEquilibrio: 'equilibrio', valorEquilibrio: -48.78,
    },
    {
      idAtivo: 3, ticker: 'HGRU11', segmento: 'Urb. Renda',
      cotacao: 123.64, quantidade: 14, precoMedio: 124.03,
      custo: 1736.43, valorAtual: 1730.96,
      rentabilidadeReais: -5.47, rentabilidadePerc: -0.0032,
      rentabilidadeTotalPerc: 0.1535,
      precoTeto: 128.40, desconto: 0.0385,
      percAtual: 0.075, percIdeal: 0.075,
      acaoEquilibrio: 'equilibrio', valorEquilibrio: -36.89,
    },
    {
      idAtivo: 4, ticker: 'HSML11', segmento: 'Shoppings',
      cotacao: 86.13, quantidade: 23, precoMedio: 87.62,
      custo: 2015.35, valorAtual: 1980.99,
      rentabilidadeReais: -34.36, rentabilidadePerc: -0.017,
      rentabilidadeTotalPerc: 0.1315,
      precoTeto: 88.78, desconto: 0.0308,
      percAtual: 0.0877, percIdeal: 0.0834,
      acaoEquilibrio: 'acima', valorEquilibrio: -97.19,
    },
    {
      idAtivo: 5, ticker: 'MALL11', segmento: 'Shoppings',
      cotacao: 100.82, quantidade: 18, precoMedio: 109.97,
      custo: 1979.50, valorAtual: 1814.76,
      rentabilidadeReais: -164.74, rentabilidadePerc: -0.0832,
      rentabilidadeTotalPerc: 0.0646,
      precoTeto: 102.39, desconto: 0.0156,
      percAtual: 0.0812, percIdeal: 0.0833,
      acaoEquilibrio: 'acima', valorEquilibrio: -66.79,
    },
    {
      idAtivo: 6, ticker: 'MXRF11', segmento: 'Papel',
      cotacao: 9.63, quantidade: 182, precoMedio: 9.54,
      custo: 1736.78, valorAtual: 1752.66,
      rentabilidadeReais: 15.88, rentabilidadePerc: 0.0091,
      rentabilidadeTotalPerc: 0.1485,
      precoTeto: null, desconto: null,
      percAtual: 0.0776, percIdeal: 0.08,
      acaoEquilibrio: 'acima', valorEquilibrio: -58.59,
    },
    {
      idAtivo: 7, ticker: 'PVBI11', segmento: 'Lajes Corp.',
      cotacao: 69.20, quantidade: 15, precoMedio: 85.01,
      custo: 1275.11, valorAtual: 1038.00,
      rentabilidadeReais: -237.11, rentabilidadePerc: -0.186,
      rentabilidadeTotalPerc: -0.0705,
      precoTeto: null, desconto: null,
      percAtual: 0.1486, percIdeal: 0.05,
      acaoEquilibrio: 'aportar', valorEquilibrio: 91.38,
    },
    {
      idAtivo: 8, ticker: 'VGIR11', segmento: 'Papel',
      cotacao: 9.43, quantidade: 193, precoMedio: 9.54,
      custo: 1841.53, valorAtual: 1819.99,
      rentabilidadeReais: -21.54, rentabilidadePerc: -0.0117,
      rentabilidadeTotalPerc: 0.2055,
      precoTeto: null, desconto: null,
      percAtual: 0.0806, percIdeal: 0.075,
      acaoEquilibrio: 'acima', valorEquilibrio: -125.92,
    },
    {
      idAtivo: 9, ticker: 'XPML11', segmento: 'Shoppings',
      cotacao: 104.84, quantidade: 23, precoMedio: 106.45,
      custo: 2448.39, valorAtual: 2411.32,
      rentabilidadeReais: -37.07, rentabilidadePerc: -0.0151,
      rentabilidadeTotalPerc: 0.0998,
      precoTeto: 106.45, desconto: -0.0151,
      percAtual: 0.1068, percIdeal: 0.0833,
      acaoEquilibrio: 'acima', valorEquilibrio: -29.77,
    },
    {
      idAtivo: 10, ticker: 'JSRE11', segmento: 'Lajes Corp.',
      cotacao: 58.80, quantidade: 12, precoMedio: 72.78,
      custo: 873.40, valorAtual: 705.60,
      rentabilidadeReais: -167.80, rentabilidadePerc: -0.1921,
      rentabilidadeTotalPerc: -0.0272,
      precoTeto: 53.52, desconto: -0.0897,
      percAtual: 0.0312, percIdeal: 0.05,
      acaoEquilibrio: 'aportar', valorEquilibrio: 423.78,
    },
    {
      idAtivo: 11, ticker: 'LVBI11', segmento: 'Logística',
      cotacao: 102.26, quantidade: 10, precoMedio: 97.93,
      custo: 979.25, valorAtual: 1022.60,
      rentabilidadeReais: 43.35, rentabilidadePerc: 0.0443,
      rentabilidadeTotalPerc: 0.1532,
      precoTeto: 94.16, desconto: -0.0792,
      percAtual: 0.0312, percIdeal: 0.05,
      acaoEquilibrio: 'aportar', valorEquilibrio: 106.78,
    },
    {
      idAtivo: 12, ticker: 'TRXF11', segmento: 'Urb. Renda',
      cotacao: 91.10, quantidade: 21, precoMedio: 102.50,
      custo: 2152.55, valorAtual: 1913.10,
      rentabilidadeReais: -239.45, rentabilidadePerc: -0.1112,
      rentabilidadeTotalPerc: 0.0305,
      precoTeto: 94.33, desconto: 0.0354,
      percAtual: 0.0847, percIdeal: 0.075,
      acaoEquilibrio: 'acima', valorEquilibrio: -219.03,
    },
    {
      idAtivo: 13, ticker: 'HGLG11', segmento: 'Logística',
      cotacao: 146.90, quantidade: 8, precoMedio: 161.74,
      custo: 1293.88, valorAtual: 1175.20,
      rentabilidadeReais: -118.68, rentabilidadePerc: -0.0917,
      rentabilidadeTotalPerc: 0.0639,
      precoTeto: 134.51, desconto: -0.0843,
      percAtual: 0.052, percIdeal: 0.05,
      acaoEquilibrio: 'acima', valorEquilibrio: -45.82,
    },
    {
      idAtivo: 14, ticker: 'ALZR11', segmento: 'Híbridos',
      cotacao: 9.90, quantidade: 130, precoMedio: 11.82,
      custo: 1536.27, valorAtual: 1277.10,
      rentabilidadeReais: -259.17, rentabilidadePerc: -0.1687,
      rentabilidadeTotalPerc: -0.0675,
      precoTeto: 90.76, desconto: 8.1672,
      percAtual: 0.0566, percIdeal: 0.05,
      acaoEquilibrio: 'acima', valorEquilibrio: -147.72,
    },
    {
      idAtivo: 15, ticker: 'IRDM11', segmento: 'Papel',
      cotacao: 65.39, quantidade: 0, precoMedio: 70.72,
      custo: 0.00, valorAtual: 0.00,
      rentabilidadeReais: -345.00, rentabilidadePerc: -0.1866,
      rentabilidadeTotalPerc: -0.1616,
      precoTeto: null, desconto: null,
      percAtual: 0.2080, percIdeal: 0.075,
      acaoEquilibrio: 'aportar', valorEquilibrio: 190.10,
    },
  ],
};

// Simula delay de API
const mockDelay = (ms = 800) => new Promise((r) => setTimeout(r, ms));
// ─────────────────────────────────────────────────────────────────────────────

export const useControleAtivos = () => {
  const [resumo, setResumo]               = useState(null);
  const [ativos, setAtivos]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);

  // ── Carrega carteira completa (mock) ──────────────────────────────────────
  const getCarteira = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: trocar por controleAtivosService.listar() quando backend estiver pronto
      await mockDelay(900);
      setResumo(MOCK_DATA.resumo);
      setAtivos(MOCK_DATA.ativos);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Atualiza cotações (simula nova chamada) ───────────────────────────────
  const atualizarCotacoes = useCallback(async () => {
    setLoadingCotacoes(true);
    try {
      await mockDelay(1200);
      setResumo(MOCK_DATA.resumo);
      setAtivos(MOCK_DATA.ativos);
      toastSuccess('Cotações atualizadas!');
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingCotacoes(false);
    }
  }, []);

  // ── Salvar Preço Teto (mock: só atualiza local) ───────────────────────────
  const handleSalvarPrecoTeto = async (idAtivo, novoPrecoTeto) => {
    const valor = parseFloat(novoPrecoTeto);
    if (isNaN(valor) || valor <= 0) return;
    try {
      // TODO: await controleAtivosService.salvarPrecoTeto(idAtivo, valor);
      await mockDelay(300);
      toastSuccess('Preço teto salvo!');
      setAtivos((prev) => prev.map((a) => {
        if (a.idAtivo !== idAtivo) return a;
        const desconto = valor > 0 ? (valor - a.cotacao) / valor : null;
        return { ...a, precoTeto: valor, desconto };
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // ── Salvar % Ideal (mock: só atualiza local e recalcula badges) ───────────
  const handleSalvarPercIdeal = async (idAtivo, novoPercIdeal) => {
    const valor = parseFloat(novoPercIdeal) / 100; // input é em %, converte para decimal
    if (isNaN(valor) || valor < 0) return;
    try {
      // TODO: await controleAtivosService.salvarPercIdeal(idAtivo, valor);
      await mockDelay(300);
      toastSuccess('Meta atualizada!');
      setAtivos((prev) => {
        const atualizados = prev.map((a) =>
          a.idAtivo === idAtivo ? { ...a, percIdeal: valor } : a
        );
        // Recalcula acaoEquilibrio e valorEquilibrio localmente
        const valorTotal = atualizados.reduce((s, a) => s + a.valorAtual, 0);
        return atualizados.map((a) => {
          const metaValor  = a.percIdeal * valorTotal;
          const diff       = metaValor - a.valorAtual;
          const tolerancia = valorTotal * 0.005; // 0,5%
          const acao =
            diff > tolerancia   ? 'aportar'    :
            diff < -tolerancia  ? 'acima'      : 'equilibrio';
          return { ...a, valorEquilibrio: diff, acaoEquilibrio: acao };
        });
      });
    } catch (error) {
      handleError(error);
    }
  };

  return {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal,
  };
};
