import bcrypt from 'bcrypt';
import {
  changePassRepository,
  getPassRepository
} from './changePass.repositories.js';

//#region => Service with change password functionality for the user
const changePassService = async (userId, senhaAtual, novaSenha) => {

  if (!userId) {
    throw new Error('Usuário não informado.');
  }

  if (!senhaAtual || !novaSenha) {
    throw new Error('Senha atual e nova senha são obrigatórias.');
  }

  //buscar o hash salvo da senha atual no banco
  const credenciais = await getPassRepository(userId);
  if (!credenciais || !credenciais.password) {
    throw new Error('Usuário não encontrado ou senha não cadastrada.');
  }

  //verificar se a senha atual está correta usando bcrypt.compare
  const senhaCorreta = await bcrypt.compare(senhaAtual, credenciais.password);
  if (!senhaCorreta) {
    throw new Error('A senha atual está incorreta.');
  }

  //verificar se a nova senha é diferente da senha atual
  const novaSenhaIgualAtual = await bcrypt.compare(novaSenha, credenciais.password);
  if (novaSenhaIgualAtual) {
    throw new Error('A nova senha deve ser diferente da senha atual.');
  }

  //verificar se a nova senha atende aos critérios de segurança (ex: tamanho mínimo, caracteres especiais, etc.)
  if (novaSenha.length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
  }

  //verificar se a nova senha contém pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(novaSenha)) {
    throw new Error('A nova senha deve conter pelo menos uma letra maiúscula.');
  }

  //  verificar se a nova senha contém pelo menos uma letra minúscula
  if (!/[a-z]/.test(novaSenha)) {
    throw new Error('A nova senha deve conter pelo menos uma letra minúscula.');
  }

  //verificar se a nova senha contém pelo menos um número 
  if (!/[0-9]/.test(novaSenha)) {
    throw new Error('A nova senha deve conter pelo menos um número.');
  }

  const hashNovaSenha = await bcrypt.hash(novaSenha, 10);

  // Chamar a função de serviço para trocar a senha
  const resultado = await changePassRepository(userId, credenciais.password, hashNovaSenha);

  // Se o UPDATE não afetou nenhuma linha (ex: senha mudou entre a leitura e a
  // gravação, ou userId inválido), não podemos silenciosamente reportar sucesso.
  if (!resultado) {
    throw new Error('Não foi possível atualizar a senha. Tente novamente.');
  }

  // Retornar uma resposta de sucesso
  return resultado;
}
//#endregion

export {
  changePassService
}