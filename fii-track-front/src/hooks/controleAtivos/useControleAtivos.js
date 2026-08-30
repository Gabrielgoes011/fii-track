import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';

// ── Helpers de cálculo ────────────────────────────────────────────────────────

// Monta cada ativo com os campos que a tela consome
function calcularAtivo(raw) {
  const quantidade   = Number(raw.quantidade)    || 0;
  const precoMedio   = Number(raw.precoMedio)    || 0;
  const custo        = Number(raw.custo)         || 0;
  const totalProventos = Number(raw.totalProventos) || 0;

  // Sem cotação em tempo real ainda — usa preço médio como referência
  const cotacao      = precoMedio;
  const valorAtual   = quantidade * cotacao;
  const rentabilidadeReais = valorAtual - custo + totalProventos;
  const rentabilidadePerc  = custo > 0 ? (valorAtual - custo) / custo : null;
  const rentabilidadeTotalPerc = custo > 0 ? rentabilidadeReais / custo : null;

  return {
    idAtivo:      raw.idAtivo,
    id:           raw.id,
    ticker:       raw.ticker,
    segmento:     raw.segmento,
    idSegmento:   raw.idSegmento,
    percIdeal:    Number(raw.percIdeal) || 0,
    objetivo:     raw.objetivo,
    dtCadastro:   raw.dtCadastro,
    quantidade,
    precoMedio,
    cotacao,
    valorAtual,
    custo,
    totalProventos,
    rentabilidadeReais,
    rentabilidadePerc,
    rentabilidadeTotalPerc,
    precoTeto:    raw.precoTeto ?? null,
    desconto:     null,
    // equilibrio calculado depois (precisa do total da carteira)
    percAtual:       0,
    valorEquilibrio: 0,
    acaoEquilibrio:  'equilibrio',
  };
}

// Recalcula percAtual, valorEquilibrio e acaoEquilibrio para toda a lista
function recalcularEquilibrio(lista) {
  const valorTotal = lista.reduce((s, a) => s + a.valorAtual, 0);
  const tolerancia = valorTotal * 0.005; // 0,5%

  return lista.map((a) => {
    const percAtual      = valorTotal > 0 ? a.valorAtual / valorTotal : 0;
    const metaValor      = a.percIdeal * valorTotal;
    const diff           = metaValor - a.valorAtual;
    const acaoEquilibrio =
      diff > tolerancia  ? 'aportar' :
      diff < -tolerancia ? 'acima'   : 'equilibrio';

    return { ...a, percAtual, valorEquilibrio: diff, acaoEquilibrio };
  });
}

// Monta o objeto resumo a partir da lista calculada
function calcularResumo(lista) {
  const custoTotal        = lista.reduce((s, a) => s + a.custo, 0);
  const valorAtualTotal   = lista.reduce((s, a) => s + a.valorAtual, 0);
  const rentabilidadeReais = valorAtualTotal - custoTotal;
  const rentabilidadePerc  = custoTotal > 0 ? rentabilidadeReais / custoTotal : null;

  return { custoTotal, valorAtualTotal, rentabilidadeReais, rentabilidadePerc };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useControleAtivos = () => {
  const [resumo, setResumo]               = useState(null);
  const [ativos, setAtivos]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);

  // ── Processa a resposta bruta da API ──────────────────────────────────────
  const processarResposta = (rows) => {
    const calculados   = rows.map(calcularAtivo);
    const comEquilibrio = recalcularEquilibrio(calculados);
    setAtivos(comEquilibrio);
    setResumo(calcularResumo(comEquilibrio));
  };

  // ── Carrega carteira completa ─────────────────────────────────────────────
  const getCarteira = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await controleAtivosService.listar();
      processarResposta(Array.isArray(rows) ? rows : []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Atualiza cotações ─────────────────────────────────────────────────────
  const atualizarCotacoes = useCallback(async () => {
    setLoadingCotacoes(true);
    try {
      const rows = await controleAtivosService.listar();
      processarResposta(Array.isArray(rows) ? rows : []);
      toastSuccess('Cotações atualizadas!');
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingCotacoes(false);
    }
  }, []);

  // ── Salvar Preço Teto ─────────────────────────────────────────────────────
  const handleSalvarPrecoTeto = async (idAtivo, novoPrecoTeto) => {
    const valor = parseFloat(novoPrecoTeto);
    if (isNaN(valor) || valor <= 0) return;
    try {
      await controleAtivosService.salvarPrecoTeto(idAtivo, valor);
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

  // ── Salvar % Ideal ────────────────────────────────────────────────────────
  const handleSalvarPercIdeal = async (idAtivo, novoPercIdeal) => {
    const valor = parseFloat(novoPercIdeal) / 100;
    if (isNaN(valor) || valor < 0) return;
    try {
      await controleAtivosService.salvarPercIdeal(idAtivo, valor);
      toastSuccess('Meta atualizada!');
      setAtivos((prev) => {
        const atualizados = prev.map((a) =>
          a.idAtivo === idAtivo ? { ...a, percIdeal: valor } : a
        );
        return recalcularEquilibrio(atualizados);
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
