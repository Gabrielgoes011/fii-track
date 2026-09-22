import {
  getPerfilRepo,
  emailEmUsoRepo,
  updatePerfilRepo,
} from './meuPerfil.repositories.js';

//#region => Buscar o perfil do usuário logado
async function buscarPerfilService(idUser) {
  try {

    //valida o id recebido do token
    if (!idUser) {
      throw new Error('Usuário não informado.');
    }

    //busca o perfil no repositório
    const perfil = await getPerfilRepo(idUser);
    if (!perfil) {
      throw new Error('Perfil não encontrado.');
    }

    //retorna o perfil (sem senha)
    return perfil;

  } catch (error) {
    console.error('Erro ao buscar perfil na etapa do service:', error);
    throw error;
  }
}
//#endregion

//#region => Atualizar os dados cadastrais do próprio usuário
async function atualizarPerfilService(idUser, dados) {
  try {

    //valida o id recebido do token
    if (!idUser) {
      throw new Error('Usuário não informado.');
    }

    const nome = (dados?.nome ?? '').trim();
    const email = (dados?.email ?? '').trim();
    const dataNascimento = dados?.dataNascimento;

    //validações básicas de campos obrigatórios
    if (!nome) {
      throw new Error('O nome não pode ser vazio.');
    }
    if (!email) {
      throw new Error('O email não pode ser vazio.');
    }
    //validação simples de formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('O email informado é inválido.');
    }
    if (!dataNascimento) {
      throw new Error('A data de nascimento não pode ser vazia.');
    }

    //garante que o perfil existe antes de atualizar
    const existente = await getPerfilRepo(idUser);
    if (!existente) {
      throw new Error('Perfil não encontrado.');
    }

    //impede usar um email que já pertence a outro usuário
    const emailDuplicado = await emailEmUsoRepo(email, idUser);
    if (emailDuplicado) {
      throw new Error('Este email já está em uso por outro usuário.');
    }

    //executa a atualização e retorna o perfil atualizado
    const atualizado = await updatePerfilRepo(idUser, { nome, email, dataNascimento });
    if (!atualizado) {
      throw new Error('Não foi possível atualizar o perfil. Tente novamente.');
    }

    return atualizado;

  } catch (error) {
    console.error('Erro ao atualizar perfil na etapa do service:', error);
    throw error;
  }
}
//#endregion

export {
  buscarPerfilService,
  atualizarPerfilService,
}
