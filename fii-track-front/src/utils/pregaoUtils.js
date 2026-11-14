// Regras de horário do pregão da B3, usadas para saber se uma cotação salva ainda é a mais nova possível.
//
// A brapi só traz preço novo uma vez por dia, no fechamento do pregão. Então uma cotação está "atual"
// se foi buscada DEPOIS do último fechamento. Fora disso (ex.: fim de semana) não existe preço novo,
// e a tela não deve avisar "sem preço novo".
//
// Espelho de fii-track-back/src/utils/pregaoUtils.js (mantenha os dois iguais).

// Fechamento considerado: 18:30 (fim do after-market da B3), horário de Brasília.
const HORA_FECHAMENTO = 18;
const MINUTO_FECHAMENTO = 30;

// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019). A conta não depende do fuso do aparelho.
const OFFSET_BRASILIA_MS = -3 * 60 * 60 * 1000;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

// meia-noite de hoje no relógio de Brasília, escrita como se fosse UTC (só para fazer conta de data)
function _meiaNoiteBrasilia(instante) {
  const relogio = new Date(instante + OFFSET_BRASILIA_MS);
  return Date.UTC(relogio.getUTCFullYear(), relogio.getUTCMonth(), relogio.getUTCDate());
}

// instante real (ms) do fechamento do dia que começa em `meiaNoite`
function _instanteDoFechamento(meiaNoite) {
  const relogioDoFechamento = meiaNoite + (HORA_FECHAMENTO * 60 + MINUTO_FECHAMENTO) * 60 * 1000;
  return relogioDoFechamento - OFFSET_BRASILIA_MS;
}

// dia útil = segunda a sexta (feriados não entram: no pior caso busca uma vez a mais, sem aviso falso)
function _ehDiaUtil(meiaNoite) {
  const diaDaSemana = new Date(meiaNoite).getUTCDay();
  return diaDaSemana !== 0 && diaDaSemana !== 6;
}

// Instante (ms) do fechamento mais recente que já aconteceu, em dia útil.
export function ultimoFechamentoPregao(agora = Date.now()) {
  let dia = _meiaNoiteBrasilia(agora);
  for (;;) {
    const fechamento = _instanteDoFechamento(dia);
    if (_ehDiaUtil(dia) && fechamento <= agora) return fechamento;
    dia -= UM_DIA_MS;
  }
}

// Instante (ms) do próximo fechamento em dia útil, a partir de agora.
export function proximoFechamentoPregao(agora = Date.now()) {
  let dia = _meiaNoiteBrasilia(agora);
  for (;;) {
    const fechamento = _instanteDoFechamento(dia);
    if (_ehDiaUtil(dia) && fechamento > agora) return fechamento;
    dia += UM_DIA_MS;
  }
}

// true quando a consulta foi feita depois do último fechamento (não há preço mais novo para buscar).
export function cotacaoEstaAtual(dtConsulta, agora = Date.now()) {
  if (!dtConsulta) return false;
  return new Date(dtConsulta).getTime() >= ultimoFechamentoPregao(agora);
}
