import pgErrorHandler from '../utils/pgErrorHandler.js';
import {
  trocarSenhaRepository
} from '../repositories/perfilUser/trocarSenha.repository.js';

//#region => Controller para trocar a senha do usuário
const trocarSenhaService = async (userId, senhaAtual, novaSenha) => {
  try {

    //critografa a senha atual e a nova senha usando bcrypt
    const hashSenhaAtual = await bcrypt.hash(senhaAtual, 10);
    const hashNovaSenha = await bcrypt.hash(novaSenha, 10);

    //verificar se a senha atual está correta
    const senhaCorreta = await verificarSenhaRepository(userId, hashSenhaAtual);
    if (!senhaCorreta) {
      throw new Error('A senha atual está incorreta.');
    }

    //verficar se a nova senha é diferente da senha atual
    if (hashSenhaAtual === hashNovaSenha) {
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

    // Chamar a função de serviço para trocar a senha
    const resultado = await trocarSenhaRepository(userId, hashSenhaAtual, hashNovaSenha);

    // Retornar uma resposta de sucesso
    return resultado;

  } catch (error) {

    // Tratar erros do PostgreSQL 
    const pgError = pgErrorHandler(error);
    if (pgError) {
      return pgError;
    }
  }
}
//#endregion



export {
  trocarSenhaService
}