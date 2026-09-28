// Repositório do módulo Diversificação.
//
// A análise de diversificação NÃO precisa de estrutura nova no banco: ela é
// derivada da posição da carteira que o módulo de Controle de Ativos já lê.
// Para não duplicar a query (CTEs de posição + proventos + cotação), este
// repositório reaproveita `getControleAtivosRepo`.

import { getControleAtivosRepo } from '../controlAtivos/controleAtivos.repository.js';

//#region Query para ler a posição da carteira (reaproveitada do Controle de Ativos)
// Retorna, por ativo do usuário: segmento, percIdeal, quantidade, precoMedio e
// precoAtual (cotação em cache). O agrupamento por segmento é feito no service.
async function getPosicaoParaDiversificacaoRepo(idUser) {

  // Reaproveita a leitura já existente (mesmo contexto/transação RLS do request).
  const linhas = await getControleAtivosRepo(idUser);

  // Retorna as linhas cruas; o service cuida do cálculo e do agrupamento.
  return linhas;
}
//#endregion

export {
  getPosicaoParaDiversificacaoRepo,
};
