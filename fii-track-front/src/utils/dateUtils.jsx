export const formatarDataBR = (data) => {
  if (!data) return '';
  const d = new Date(data);
  
  // Adicionando { timeZone: 'UTC' } para evitar o bug clássico 
  // onde a data "volta um dia" devido ao fuso horário local.
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const formatarDataComHora = (data) => {
  if (!data) return '';
  const d = new Date(data);
  return d.toLocaleString('pt-BR');
};