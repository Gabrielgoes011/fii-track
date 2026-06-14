// Função para converter data de DD/MM/AAAA para YYYY-MM-DD
function converterDataParaPostgres(dataString) {
  if (!dataString) return null;

  // Se já estiver no formato do banco (YYYY-MM-DD), devolvemos como está
  if (dataString.includes('-')) return dataString;

  const partes = dataString.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes}-${dia}`;
}

export { converterDataParaPostgres };