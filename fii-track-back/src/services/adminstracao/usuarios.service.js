import bcrypt from 'bcrypt';
import {
  listarUsuariosRepository,
  checkEmailRepository,
  checkCpfRepository,
  cadastrarUserRepository,
  countUserRepository,
  isAtivoRepository,
  onOffUserRepository,
  buscarUsuarioPorIdRepository,
  atualizarUserRepository,
  deletarUserRepository,
  resetarSenhaRepository
} from "../../repositories/administacao/usuarios.repositories.js";
import { converterDataParaPostgres } from "../../utils/dateUtils.js";

// Senha padrão usada tanto no cadastro quanto no reset — o login já reconhece
// esse valor e sinaliza "defaultPassword" para o usuário trocar no próximo acesso.
const SENHA_PADRAO = 'Track@123';

//  #region => Service para listar os usuários cadastrados
async function listarUsuariosService(blvalor) {

  //verifica se o valor do parâmetro "status" é válido
  if (blvalor !== 'on' && blvalor !== 'off') {
    throw new Error(
      'O valor do parâmetro "status" deve ser "on" ou "off"');
  }

  //converte o valor do parâmetro para booleano
  if (blvalor === 'on') {
    blvalor = true;
  } else {
    blvalor = false;
  }

  //Chama a função do repositório para listar os usuários
  const listarUsuarios = await listarUsuariosRepository(blvalor);

  //retorna lista de usuários (vazia quando não houver registros com o status informado)
  return listarUsuarios;
}
//#endregion

// #region => Service para cadastrar usuário
async function cadastrarUserService(dados) {

  //verifica os campos obrigatórios
  if (!dados.nome || !dados.email) {
    throw new Error('Os campos nome e email são obrigatórios.');
  }

  //faz split do nome para verificar se tem nome e sobrenome
  const nomeCompleto = dados.nome.trim().split(' ');

  //verifica se foi passado nome e sobrenome
  if (nomeCompleto.length < 2) {
    throw new Error('O campo nome deve conter nome e sobrenome.');
  }

  //verifica se cpf foi passado e se é válido
  if (dados.cpf) {
    const cpfLimpo = dados.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      throw new Error('O campo cpf deve conter 11 dígitos.');
    }
  }

  //verifica se o email é válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(dados.email)) {
    throw new Error('O campo email deve conter um endereço de email válido.');
  }

  //chama função repository para verificar se o email e cpf já estão cadastrados 
  const checkEmail = await checkEmailRepository(dados.email);
  if (checkEmail) {
    throw new Error('O email já está cadastrado.');
  }

  //chama função repository para verificar se o cpf já está cadastrado
  if (dados.cpf) {
    const checkCpf = await checkCpfRepository(dados.cpf);
    if (checkCpf) {
      throw new Error('O cpf já está cadastrado.');
    }
  }

  //passa criptografia para a senha padrão do novo usuário
  const hash = await bcrypt.hash(SENHA_PADRAO, 10);

  // Converte a data do formato DD/MM/YYYY para YYYY-MM-DD para o PostgreSQL
  let dataNascimentoFormatada = dados.dataNascimento;
  if (dataNascimentoFormatada) {
    dataNascimentoFormatada = converterDataParaPostgres(dataNascimentoFormatada);
  }

  //prepara os dados para cadastro
  const dadosCadastro = {
    nome: dados.nome,
    dataNascimento: dataNascimentoFormatada,
    email: dados.email,
    cpf: dados.cpf,
    password: hash
  };

  //chama a função do repositório para cadastrar o usuário
  const cadastrarUser = await cadastrarUserRepository(dadosCadastro);

  return cadastrarUser;
}




//#endregion

//#region => Service para contar usuários - dashboard
async function countUserService() {

  //chama a função do repositório para contar os usuários
  const countUser = await countUserRepository();

  //retorna o resultado
  return countUser;
}
//#endregion

//region => Service para inativar ou reativar usuário
async function onOffUserService(id) {

  //chama a função do repositório para inativar ou reativar o usuário
  const isAtivo = await isAtivoRepository(id);

  if (!isAtivo) {
    throw new Error('Usuário não encontrado.');
  }

  //let para o novo valor do status do usuário
  let newValue;

  //pega o valor se esta ativo ou inativo para passar o valor contrario para a query
  if (isAtivo.ativo === true) {
    newValue = false;
  } else {
    newValue = true;
  }

  //chama a função do repositório para inativar ou reativar o usuário
  const onOffUser = await onOffUserRepository(newValue, id);

  return onOffUser;
}
//#endregion

//#region => Service para atualizar usuário
async function atualizarUserService(id, dados) {

  //verifica os campos obrigatórios
  if (!dados.nome || !dados.email || !dados.dataNascimento) {
    throw new Error('Os campos nome, email e data de nascimento são obrigatórios.');
  }

  //verifica se foi passado nome e sobrenome
  if (!dados.nome.trim().includes(' ')) {
    throw new Error('O campo nome deve conter nome e sobrenome.');
  }

  //verifica se o email é válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(dados.email)) {
    throw new Error('O campo email deve conter um endereço de email válido.');
  }

  //verifica se o formato da data de nascimento é válido (DD/MM/AAAA)
  const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dataRegex.test(dados.dataNascimento)) {
    throw new Error('Data de nascimento deve estar no formato DD/MM/AAAA.');
  }

  //verifica se o usuário existe
  const usuarioExistente = await buscarUsuarioPorIdRepository(id);
  if (!usuarioExistente) {
    throw new Error('Usuário não encontrado.');
  }

  //verifica se o email já está em uso por outro usuário
  const checkEmail = await checkEmailRepository(dados.email, id);
  if (checkEmail) {
    throw new Error('O email já está cadastrado para outro usuário.');
  }

  //converte o status "on"/"off" para booleano (undefined mantém o status atual)
  const ativo = dados.status === 'on' ? true : (dados.status === 'off' ? false : undefined);

  //prepara os dados para atualização
  const dadosAtualizacao = {
    nome: dados.nome,
    dataNascimento: converterDataParaPostgres(dados.dataNascimento),
    email: dados.email,
    ativo
  };

  //chama a função do repositório para atualizar o usuário
  const usuarioAtualizado = await atualizarUserRepository(id, dadosAtualizacao);

  return usuarioAtualizado;
}
//#endregion

//#region => Service para deletar usuário
async function deletarUserService(id) {

  //verifica se o usuário existe
  const usuarioExistente = await buscarUsuarioPorIdRepository(id);
  if (!usuarioExistente) {
    throw new Error('Usuário não encontrado.');
  }

  //chama a função do repositório para deletar o usuário (e suas credenciais)
  await deletarUserRepository(id);

  return { id, nome: usuarioExistente.nome };
}
//#endregion

//#region => Service para resetar a senha do usuário para o padrão
async function resetarSenhaService(id) {

  //verifica se o usuário existe
  const usuarioExistente = await buscarUsuarioPorIdRepository(id);
  if (!usuarioExistente) {
    throw new Error('Usuário não encontrado.');
  }

  //gera o hash da senha padrão e grava nas credenciais
  const hash = await bcrypt.hash(SENHA_PADRAO, 10);
  await resetarSenhaRepository(id, hash);

  return { id, nome: usuarioExistente.nome };
}
//#endregion






export {
  listarUsuariosService,
  cadastrarUserService,
  countUserService,
  onOffUserService,
  atualizarUserService,
  deletarUserService,
  resetarSenhaService
}
