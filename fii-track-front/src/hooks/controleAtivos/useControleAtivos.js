import { useState, useCallback, useRef } from 'react';
import { handleError, toastSuccess, toastInfo, toastWarn } from '../../utils/responseUtils';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';

// ── Helpers de cálculo ────────────────────────────────────────────────────────

// Monta cada ativo com os campos que a tela consome.
// `cotacoesMap` é o mapa ticker -> dados da brapi (pode estar vazio: aí caímos
// no preço médio como referência, até o usuário clicar em "Atualizar Cotações").
function calcularAtivo(raw, cotacoesMap = {}) {
  const quantidade = Number(raw.quantidade) || 0;
  const precoMedio = Number(raw.precoMedio) || 0;
  const custo = Number(raw.custo) || 0;
  const totalProventos = Number(raw.totalProventos) || 0;

  // Cotação vinda da brapi (último preço / fechamento do pregão anterior)
  const cotacaoObj = cotacoesMap[String(raw.ticker || '').toUpperCase()];
  const cotacaoApi = cotacaoObj?.preco;
  const temCotacao = cotacaoApi != null && Number(cotacaoApi) > 0;
  const cotacao = temCotacao ? Number(cotacaoApi) : precoMedio;
  // Variação percentual do dia (fração, ex.: 0,015 = +1,5%) — usada na seção de
  // oportunidades (altas/baixas do dia). Vem da brapi em % → converte p/ fração.
  const variacaoDiaRaw = cotacaoObj?.variacaoPerc;
  const variacaoDia = variacaoDiaRaw != null && !Number.isNaN(Number(variacaoDiaRaw))
    ? Number(variacaoDiaRaw) / 100
    : null;

  const valorAtual = quantidade * cotacao;
  const rentabilidadeReais = valorAtual - custo + totalProventos;
  const rentabilidadePerc = custo > 0 ? (valorAtual - custo) / custo : null;
  const rentabilidadeTotalPerc = custo > 0 ? rentabilidadeReais / custo : null;

  const precoTeto = raw.precoTeto != null ? Number(raw.precoTeto) : null;
  const modoPrecoTeto = raw.modoPrecoTeto === 'pvp' ? 'pvp' : 'manual';
  // Desconto: quanto a cota está abaixo (+) ou acima (−) do preço teto
  const desconto = precoTeto && precoTeto > 0 ? (precoTeto - cotacao) / precoTeto : null;

  return {
    idAtivo: raw.idAtivo,
    id: raw.id,
    ticker: raw.ticker,
    segmento: raw.segmento,
    idSegmento: raw.idSegmento,
    percIdeal: Number(raw.percIdeal) || 0,
    objetivo: raw.objetivo,
    dtCadastro: raw.dtCadastro,
    quantidade,
    precoMedio,
    cotacao,
    temCotacao,
    variacaoDia,
    valorAtual,
    custo,
    totalProventos,
    rentabilidadeReais,
    rentabilidadePerc,
    rentabilidadeTotalPerc,
    precoTeto,
    modoPrecoTeto,
    desconto,
    // equilibrio calculado depois (precisa do total da carteira)
    percAtual: 0,
    valorEquilibrio: 0,
    acaoEquilibrio: 'equilibrio',
  };
}

// Recalcula percAtual, valorEquilibrio e acaoEquilibrio para toda a lista
function recalcularEquilibrio(lista) {
  const valorTotal = lista.reduce((s, a) => s + a.valorAtual, 0);
  const tolerancia = valorTotal * 0.005; // 0,5%

  return lista.map((a) => {
    const percAtual = valorTotal > 0 ? a.valorAtual / valorTotal : 0;
    const metaValor = a.percIdeal * valorTotal;
    const diff = metaValor - a.valorAtual;
    const acaoEquilibrio =
      diff > tolerancia ? 'aportar' :
        diff < -tolerancia ? 'acima' : 'equilibrio';

    return { ...a, percAtual, valorEquilibrio: diff, acaoEquilibrio };
  });
}

// Monta o objeto resumo a partir da lista calculada
function calcularResumo(lista) {
  const custoTotal = lista.reduce((s, a) => s + a.custo, 0);
  const valorAtualTotal = lista.reduce((s, a) => s + a.valorAtual, 0);
  const totalProventos = lista.reduce((s, a) => s + a.totalProventos, 0);

  const rentabilidadeReais = valorAtualTotal - custoTotal;
  const rentabilidadePerc = custoTotal > 0 ? rentabilidadeReais / custoTotal : null;

  // Rentabilidade considerando os proventos já recebidos
  const rentabilidadeComProventosReais = rentabilidadeReais + totalProventos;
  const rentabilidadeComProventosPerc = custoTotal > 0 ? rentabilidadeComProventosReais / custoTotal : null;

  // Quanto falta aportar (soma só o que está abaixo da meta) para rebalancear
  const totalParaAportar = lista.reduce((s, a) => s + Math.max(a.valorEquilibrio, 0), 0);

  return {
    custoTotal,
    valorAtualTotal,
    totalProventos,
    rentabilidadeReais,
    rentabilidadePerc,
    rentabilidadeComProventosReais,
    rentabilidadeComProventosPerc,
    totalParaAportar,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useControleAtivos = () => {
  const [resumo, setResumo] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCotacoes, setLoadingCotacoes] = useState(false);

  // TTL (em minutos) que uma cotação salva é considerada "fresca".
  // Mantém-se alinhado ao COTACAO_TTL_MINUTOS do backend.
  const TTL_MINUTOS = 15;

  // Guardam o estado "cru" para permitir recalcular sem nova ida à API:
  const rowsRef = useRef([]);   // linhas da carteira (backend)
  const cotacoesRef = useRef({});   // mapa ticker -> cotação (brapi)
  const atualizadoEmRef = useRef(null); // ISO da última atualização de cotações (mais recente)
  // Tickers cuja última consulta está fora do TTL. A defasagem é determinada por
  // esta lista (fonte de verdade do backend), não mais por uma heurística de horas.
  const tickersDesatualizadosRef = useRef([]);

  // ── Recalcula tudo a partir do estado cru + cotações em memória ───────────
  const recomputar = useCallback(() => {
    const calculados = rowsRef.current.map((r) => calcularAtivo(r, cotacoesRef.current));
    const comEquilibrio = recalcularEquilibrio(calculados);

    // "Desatualizada" = existe ao menos um ticker fora do TTL (informado/derivado).
    const desatualizados = tickersDesatualizadosRef.current || [];
    const desatualizada = desatualizados.length > 0;

    setAtivos(comEquilibrio);
    setResumo({
      ...calcularResumo(comEquilibrio),
      dataAtualizacaoCotacoes: atualizadoEmRef.current
        ? new Date(atualizadoEmRef.current).toLocaleString('pt-BR')
        : null,
      cotacoesDesatualizadas: desatualizada,
      // Quantidade e lista de tickers ainda defasados (para exibir o motivo).
      qtdCotacoesDesatualizadas: desatualizados.length,
      tickersDesatualizados: desatualizados,
    });
  }, []);

  // Reconstrói o mapa de cotações a partir do que o backend já enviou (cache)
  const semearCotacoesDasLinhas = (rows) => {
    const mapa = {};
    let maisRecente = null;
    const desatualizados = [];
    const limite = Date.now() - TTL_MINUTOS * 60 * 1000;
    rows.forEach((r) => {
      const tk = String(r.ticker || '').toUpperCase();
      if (r.precoAtual == null) {
        // Sem preço salvo ainda: considera defasado.
        if (tk) desatualizados.push(tk);
        return;
      }
      mapa[tk] = {
        preco: Number(r.precoAtual),
        variacaoPerc: r.variacaoPercDia != null ? Number(r.variacaoPercDia) : null,
        dtConsulta: r.dtConsultaCotacao || null,
      };
      if (r.dtConsultaCotacao) {
        const t = new Date(r.dtConsultaCotacao).getTime();
        // Carimbo exibido = consulta mais recente (não o mais antigo).
        if (maisRecente === null || t > maisRecente) maisRecente = t;
        if (t < limite) desatualizados.push(tk);
      } else {
        desatualizados.push(tk);
      }
    });
    cotacoesRef.current = mapa;
    atualizadoEmRef.current = maisRecente !== null ? new Date(maisRecente).toISOString() : null;
    tickersDesatualizadosRef.current = desatualizados;
  };

  // ── Carrega carteira completa (usa o cache do backend, NÃO chama a brapi) ──
  const getCarteira = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await controleAtivosService.listar();
      rowsRef.current = Array.isArray(rows) ? rows : [];
      semearCotacoesDasLinhas(rowsRef.current);
      recomputar();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [recomputar]);

  // ── Atualiza cotações (consome 1 requisição da brapi — só sob demanda) ────
  const atualizarCotacoes = useCallback(async () => {
    if (rowsRef.current.length === 0) return false;

    setLoadingCotacoes(true);
    try {
      const { cotacoes, atualizadoEm, origem, proximaAtualizacaoEm, tickersDesatualizados } =
        await controleAtivosService.atualizarCotacoes();

      // Normaliza as chaves do mapa para MAIÚSCULO (bate com o ticker)
      const mapa = {};
      Object.entries(cotacoes || {}).forEach(([ticker, dados]) => {
        mapa[ticker.toUpperCase()] = dados;
      });

      cotacoesRef.current = mapa;
      atualizadoEmRef.current = atualizadoEm || atualizadoEmRef.current || new Date().toISOString();
      // Fonte de verdade da defasagem: lista vinda do backend.
      tickersDesatualizadosRef.current = Array.isArray(tickersDesatualizados)
        ? tickersDesatualizados.map((t) => String(t).toUpperCase())
        : [];
      recomputar();

      // Mensagem contextual conforme a origem dos dados (informada pelo backend):
      //  • brapi          → buscou preços novos de fato
      //  • cache          → tudo já estava fresco dentro do TTL; nada mudou
      //  • cache-fallback → tentou buscar, a fonte falhou e usamos o cache
      if (origem === 'cache') {
        const horaProx = proximaAtualizacaoEm
          ? new Date(proximaAtualizacaoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : null;
        toastInfo(
          horaProx
            ? `Cotações já atualizadas. Novos preços a partir das ${horaProx} ou no próximo pregão.`
            : 'Cotações já atualizadas. Novos preços apenas no próximo pregão.'
        );
      } else if (origem === 'cache-fallback') {
        toastWarn('Fonte de cotações indisponível (limite da brapi atingido). Exibindo os últimos preços salvos.');
      } else {
        // origem 'brapi': buscou preços novos. Se ainda restaram tickers fora do
        // TTL (ex.: limite da brapi atingido no meio da atualização), avisa que a
        // atualização foi parcial — evitando um "atualizadas!" verde enganoso.
        const restantes = tickersDesatualizadosRef.current || [];
        if (restantes.length > 0) {
          toastWarn(`Cotações parcialmente atualizadas. ${restantes.length} sem preço novo: ${restantes.join(', ')}.`);
        } else {
          toastSuccess('Cotações atualizadas!');
        }
      }
      return true; // permite à tela recarregar dados dependentes (ex.: histórico)
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setLoadingCotacoes(false);
    }
  }, [recomputar]);

  // ── Salvar Preço Teto ─────────────────────────────────────────────────────
  // valor null/'' limpa o teto. modo: 'manual' | 'pvp' (P/VP só p/ fundos de papel)
  const handleSalvarPrecoTeto = async (idAtivo, novoPrecoTeto, modo = 'manual') => {
    const limpar = novoPrecoTeto === null || novoPrecoTeto === '' || novoPrecoTeto === undefined;
    const valor = limpar ? null : parseFloat(novoPrecoTeto);
    if (!limpar && (isNaN(valor) || valor <= 0)) return;
    try {
      await controleAtivosService.salvarPrecoTeto(idAtivo, valor, modo);
      toastSuccess(limpar ? 'Preço teto removido!' : 'Preço teto salvo!');
      // Atualiza o estado cru para sobreviver a um recálculo
      rowsRef.current = rowsRef.current.map((r) =>
        r.idAtivo === idAtivo ? { ...r, precoTeto: valor, modoPrecoTeto: modo } : r
      );
      recomputar();
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
      // Atualiza o estado cru e recalcula o equilíbrio da carteira inteira
      rowsRef.current = rowsRef.current.map((r) =>
        r.idAtivo === idAtivo ? { ...r, percIdeal: valor } : r
      );
      recomputar();
    } catch (error) {
      handleError(error);
    }
  };

  // ── Excluir ativo da carteira ─────────────────────────────────────────────
  const handleExcluirAtivo = async (idAtivo) => {
    try {
      await controleAtivosService.excluir(idAtivo);
      toastSuccess('Ativo removido da carteira!');
      rowsRef.current = rowsRef.current.filter((r) => r.idAtivo !== idAtivo);
      recomputar();
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal, handleExcluirAtivo,
  };
};
