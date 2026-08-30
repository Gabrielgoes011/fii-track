import {
  findSeguimentosRepo,
  countSeguimentosRepo,
  findSeguimentoByNomeRepo,
  findSeguimentoByIdRepo,
  countAtivosVinculadosRepo,
  insertSeguimentoRepo,
  updateSeguimentoRepo,
  deleteSeguimentoRepo,
} from './seguimentos.repositories.js';

//#region => Listar seguimentos do usuário
async function listarSeguimentosService(idUser) {
  try {

    //chama repositório para buscar os seguimentos
    const seguimentos = await findSeguimentosRepo(idUser);

    //retorna os resultados (pode ser array vazio)
    return seguimentos;

  } catch (error) {
    console.error('Erro ao listar seguimentos na etapa do service:', error);
    throw new Error('Erro ao listar seguimentos: ' + error.message);
  }
}
//#endregion

//#region => Contar seguimentos do usuário
async function contarSeguimentosService(idUser) {
  try {

    //chama repositório para contar os seguimentos
    const total = await countSeguimentosRepo(idUser);

    //retorna o total
    return { total };

  } catch (error) {
    console.error('Erro ao contar seguimentos na etapa do service:', error);
    throw new Error('Erro ao contar seguimentos: ' + error.message);
  }
}
//#endregion

//#region => Cadastrar seguimento
async function cadastrarSeguimentoService(nome, idUser) {
  try {

    //valida campo obrigatório
    if (!nome || !nome.trim()) {
      throw new Error('O nome do seguimento não pode ser vazio.');
    }

    //verifica se já existe seguimento com o mesmo nome para este usuário
    const existente = await findSeguimentoByNomeRepo(nome.trim(), idUser);
    if (existente) {
      throw new Error('Seguimento já cadastrado!');
    }

    //insere o novo seguimento
    const novo = await insertSeguimentoRepo(nome.trim(), idUser);

    //retorna o id criado
    return novo;

  } catch (error) {
    console.error('Erro ao cadastrar seguimento na etapa do service:', error);
    throw error;
  }
}
//#endregion

//#region => Atualizar seguimento
async function atualizarSeguimentoService(idSeguimento, nome, idUser) {
  try {

    //valida campo obrigatório
    if (!nome || !nome.trim()) {
      throw new Error('O nome do seguimento não pode ser vazio.');
    }

    //verifica se o seguimento existe e pertence ao usuário
    const existente = await findSeguimentoByIdRepo(idSeguimento, idUser);
    if (!existente) {
      throw new Error('Seguimento não encontrado.');
    }

    //bloqueia edição de seguimentos padrão do sistema
    if (existente.defaultSistem) {
      throw new Error('Seguimentos padrão do sistema não podem ser editados.');
    }

    //executa a atualização
    await updateSeguimentoRepo(idSeguimento, nome.trim(), idUser);

    //retorna o dado atualizado
    return { id: idSeguimento, nome: nome.trim() };

  } catch (error) {
    console.error('Erro ao atualizar seguimento na etapa do service:', error);
    throw error;
  }
}
//#endregion

//#region => Excluir seguimento
async function excluirSeguimentoService(idSeguimento, idUser) {
  try {

    //verifica se o seguimento existe e pertence ao usuário
    const existente = await findSeguimentoByIdRepo(idSeguimento, idUser);
    if (!existente) {
      throw new Error('Seguimento não encontrado.');
    }

    //bloqueia exclusão de seguimentos padrão do sistema
    if (existente.defaultSistem) {
      throw new Error('Seguimentos padrão do sistema não podem ser excluídos.');
    }

    //verifica se há ativos vinculados a este seguimento — se houver, não pode excluir
    const totalAtivos = await countAtivosVinculadosRepo(idSeguimento, idUser);
    if (totalAtivos > 0) {
      throw new Error(
        `Não é possível excluir o seguimento "${existente.nome}" pois existem ${totalAtivos} ativo(s) vinculado(s) a ele.`
      );
    }

    //executa a exclusão
    await deleteSeguimentoRepo(idSeguimento, idUser);

    //retorna o nome do seguimento excluído para feedback
    return { nome: existente.nome };

  } catch (error) {
    console.error('Erro ao excluir seguimento na etapa do service:', error);
    throw error;
  }
}
//#endregion

export {
  listarSeguimentosService,
  contarSeguimentosService,
  cadastrarSeguimentoService,
  atualizarSeguimentoService,
  excluirSeguimentoService,
}
