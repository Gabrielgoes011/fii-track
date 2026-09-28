// Serviço do módulo Diversificação.
//
// Calcula a exposição da carteira por segmento (Opção 1: sem estrutura nova no
// banco). Para cada segmento agrega:
//   - exposição atual  = soma do valor de mercado dos ativos / valor total
//   - meta (desejada)  = soma do percIdeal dos ativos do segmento (fração)
//   - desvio           = exposição atual − meta (em fração; + acima, − abaixo)
// e classifica o desvio em um nível (dentro / leve / alto).

import pgErrorHandler from '../../utils/pgErrorHandler.js';
import { getPosicaoParaDiversificacaoRepo } from './diversificacao.repository.js';

// Limites de classificação do desvio, em pontos percentuais (p.p.).
const LIMITE_DESVIO_OK = 0.02;   // até 2 p.p. → dentro da meta
const LIMITE_DESVIO_LEVE = 0.05; // até 5 p.p. → leve desvio; acima → desvio alto

// Classifica o desvio (fração) em um nível textual + chave.
function classificarDesvio(desvioFrac) {
  const abs = Math.abs(desvioFrac);
  if (abs <= LIMITE_DESVIO_OK) return { nivel: 'ok', label: 'Dentro da meta' };
  if (abs <= LIMITE_DESVIO_LEVE) return { nivel: 'leve', label: 'Leve desvio' };
  return { nivel: 'alto', label: 'Desvio alto' };
}

// Calcula o valor de mercado de um ativo. Usa a cotação atual quando disponível;
// caso contrário, cai no preço médio como referência (mesma regra do frontend).
function calcularValorMercado(linha) {
  const quantidade = Number(linha.quantidade) || 0;
  const precoMedio = Number(linha.precoMedio) || 0;
  const precoAtual = linha.precoAtual != null ? Number(linha.precoAtual) : null;
  const cotacao = precoAtual != null && precoAtual > 0 ? precoAtual : precoMedio;
  return quantidade * cotacao;
}

//#region função calcular a diversificação por segmento
async function getDiversificacaoService(idUser) {
  try {

    // Lê a posição da carteira (reaproveita a leitura do Controle de Ativos).
    const linhas = await getPosicaoParaDiversificacaoRepo(idUser);

    // Agrupa por segmento, somando valor de mercado e meta (percIdeal).
    const mapa = new Map();
    let valorTotal = 0;

    for (const linha of linhas) {
      const valorMercado = calcularValorMercado(linha);

      // Considera apenas ativos com posição (valor de mercado > 0).
      if (valorMercado <= 0) continue;

      const segmento = linha.segmento || 'Sem segmento';
      valorTotal += valorMercado;

      const grupo = mapa.get(segmento) || {
        segmento, valorMercado: 0, metaFrac: 0, qtdAtivos: 0,
      };
      grupo.valorMercado += valorMercado;
      grupo.metaFrac += Number(linha.percIdeal) || 0; // percIdeal já é fração
      grupo.qtdAtivos += 1;
      mapa.set(segmento, grupo);
    }

    // Monta a lista final com percentuais, desvio e classificação.
    const segmentos = Array.from(mapa.values()).map((grupo) => {
      const atualFrac = valorTotal > 0 ? grupo.valorMercado / valorTotal : 0;
      const desvioFrac = atualFrac - grupo.metaFrac;
      return {
        segmento: grupo.segmento,
        qtdAtivos: grupo.qtdAtivos,
        valorMercado: grupo.valorMercado,
        atualFrac,               // exposição atual (fração)
        metaFrac: grupo.metaFrac, // meta desejada (fração)
        desvioFrac,              // atual − meta (fração)
        classificacao: classificarDesvio(desvioFrac),
      };
    });

    // Ordena por exposição atual (maior primeiro).
    segmentos.sort((a, b) => b.atualFrac - a.atualFrac);

    // Resumo: segmento mais concentrado e quantos estão fora da meta.
    const maisConcentrado = segmentos[0] || null;
    const foraDaMeta = segmentos.filter((s) => s.classificacao.nivel !== 'ok').length;

    return {
      valorTotal,
      totalSegmentos: segmentos.length,
      maisConcentrado: maisConcentrado ? maisConcentrado.segmento : null,
      foraDaMeta,
      segmentos,
    };

  } catch (error) {
    console.error('Erro ao calcular a diversificação na etapa do service:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao calcular a diversificação da carteira.');
    throw new Error(secureMessage);
  }
}
//#endregion

export {
  getDiversificacaoService,
};
