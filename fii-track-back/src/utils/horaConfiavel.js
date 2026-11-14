// Hora de referência para o 2FA (TOTP).
//
// O código do app autenticador depende da hora EXATA: ele muda a cada 30 s e o servidor só aceita o código
// atual, o anterior e o próximo. Se o relógio do servidor estiver adiantado ou atrasado alguns minutos
// (acontece em containers como o da Discloud), todo código digitado certo é recusado.
//
// Este módulo mede a diferença entre o relógio do servidor e uma hora de referência (o cabeçalho `Date`
// de sites grandes, com HTTPS) e guarda o deslocamento. Só o 2FA usa a hora corrigida. O resto do app
// (tokens JWT, cookies, banco) continua com o relógio do servidor, que é coerente consigo mesmo.

// Fontes de referência, na ordem. Basta uma responder.
const FONTES = [
  'https://www.google.com/generate_204',
  'https://www.cloudflare.com/cdn-cgi/trace',
];

const INTERVALO_SINCRONIZACAO_MS = 30 * 60 * 1000; // confere de novo a cada 30 minutos
const TEMPO_LIMITE_MS = 5000;
const AVISAR_ACIMA_DE_SEGUNDOS = 2;                // só avisa no log se o desvio for relevante
const DESVIO_MAXIMO_ACEITO_MS = 60 * 60 * 1000;    // desvio acima de 1 h é suspeito: ignora a medição

let deslocamentoMs = 0;        // quanto somar ao relógio do servidor para chegar na hora real
let ultimaMedicaoEm = null;

//#region => medição
// Mede o desvio com uma fonte. O cabeçalho Date tem precisão de 1 s (vem truncado), então soma
// meio segundo; e considera que a resposta demorou metade do tempo de ida e volta.
async function _medirDeslocamento(url) {
  const inicio = Date.now();
  const resposta = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  const fim = Date.now();

  const cabecalho = resposta.headers.get('date');
  if (!cabecalho) throw new Error('resposta sem cabeçalho Date');

  const horaRemotaMs = Date.parse(cabecalho) + 500;
  const horaLocalNoMomentoMs = inicio + (fim - inicio) / 2;
  return horaRemotaMs - horaLocalNoMomentoMs;
}
//#endregion

//#region => sincronização
// Tenta cada fonte até uma funcionar. Nunca lança erro: se nada responder, mantém o deslocamento anterior.
async function sincronizarHora() {
  for (const url of FONTES) {
    try {
      const medido = await _medirDeslocamento(url);

      if (Math.abs(medido) > DESVIO_MAXIMO_ACEITO_MS) {
        console.warn(`Hora de referência ignorada: desvio de ${Math.round(medido / 1000)} s é grande demais (${url}).`);
        continue;
      }

      deslocamentoMs = medido;
      ultimaMedicaoEm = Date.now();

      const segundos = Math.round(medido / 1000);
      if (Math.abs(segundos) >= AVISAR_ACIMA_DE_SEGUNDOS) {
        const sentido = segundos > 0 ? 'ATRASADO' : 'ADIANTADO';
        console.warn(`Relógio do servidor ${sentido} ${Math.abs(segundos)} s em relação à hora de referência. O 2FA usa a hora corrigida.`);
      } else {
        console.log(`Relógio do servidor em dia (desvio de ${segundos} s em relação à hora de referência).`);
      }
      return;
    } catch (erro) {
      console.warn(`Não consegui medir a hora de referência em ${url}: ${erro.message}`);
    }
  }
}

// Mede agora e repete a cada 30 minutos. O timer não impede o processo de encerrar.
function iniciarSincronizacaoDeHora() {
  sincronizarHora();
  setInterval(sincronizarHora, INTERVALO_SINCRONIZACAO_MS).unref();
}
//#endregion

//#region => hora corrigida
// Hora corrigida em segundos (é o formato que o speakeasy espera no parâmetro `time`).
function horaConfiavelSegundos() {
  return Math.floor((Date.now() + deslocamentoMs) / 1000);
}

// Só para diagnóstico no log.
function estadoDaHoraConfiavel() {
  return { deslocamentoSegundos: Math.round(deslocamentoMs / 1000), medido: ultimaMedicaoEm !== null };
}
//#endregion

export { iniciarSincronizacaoDeHora, sincronizarHora, horaConfiavelSegundos, estadoDaHoraConfiavel };
