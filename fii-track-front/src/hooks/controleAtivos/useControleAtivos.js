import { useState, useCallback } from 'react';
import { handleError, toastSuccess } from '../../utils/responseUtils';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';

export const useControleAtivos = () => {
  const [resumo, setResumo]               = useState(null);
  const [ativos, setAtivos]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);

  // ── Carrega carteira completa ─────────────────────────────────────────────
  const getCarteira = useCallback(async () => {
    setLoading(true);
    try {
      const data = await controleAtivosService.listar();
      setResumo(data.resumo);
      setAtivos(data.ativos);
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
      const data = await controleAtivosService.listar(); // Força a busca dos dados mais recentes
      setResumo(data.resumo);
      setAtivos(data.ativos);
      toastSuccess('Cotações atualizadas!');
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingCotacoes(false);
    }
  }, []); // O service garante que os dados são os mais recentes

  // ── Salvar Preço Teto ─────────────────────────────────────────────────────
  const handleSalvarPrecoTeto = async (idAtivo, novoPrecoTeto) => {
    const valor = parseFloat(novoPrecoTeto);
    if (isNaN(valor) || valor <= 0) return;
    try {
      await controleAtivosService.salvarPrecoTeto(idAtivo, valor);
      toastSuccess('Preço teto salvo!');
      // Atualização otimista da UI
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
    const valor = parseFloat(novoPercIdeal) / 100; // input é em %, converte para decimal
    if (isNaN(valor) || valor < 0) return;
    try {
      await controleAtivosService.salvarPercIdeal(idAtivo, valor);
      toastSuccess('Meta atualizada!');
      setAtivos((prev) => {
        const atualizados = prev.map((a) =>
          a.idAtivo === idAtivo ? { ...a, percIdeal: valor } : a
        );
        // Recalcula acaoEquilibrio e valorEquilibrio localmente para toda a carteira
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
