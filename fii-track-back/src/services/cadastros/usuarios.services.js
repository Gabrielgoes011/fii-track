import bcrypt from 'bcrypt';
import {
  listarUsuariosRepository,
  checkEmailRepository,
  checkCpfRepository,
  cadastrarUserRepository,
  countUserRepository,
  isAtivoRepository,
  onOffUserRepository
} from "../../repositories/cadastros/usuarios.repositories.js";
import { converterDataParaPostgres } from "../../utils/dateUtils.js";

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

  //passa senha padrão para novo usuario
  const senhaPadrao = 'Track@123';

  //passa criptografia para a senha
  const hash = await bcrypt.hash(senhaPadrao, 10);

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






export {
  listarUsuariosService,
  cadastrarUserService,
  countUserService,
  onOffUserService
}
