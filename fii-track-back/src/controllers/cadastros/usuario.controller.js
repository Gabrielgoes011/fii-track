import { openDb } from "../../config/configDb.js";
import { validaEmailExistente } from '../../utils/validaUser.js';
import { converterDataParaPostgres } from '../../utils/dateUtils.js';
import apiResponse from '../../utils/httpResponse.js';
import {
  listarUsuariosService,
  cadastrarUserService,
  countUserService,
  onOffUserService
} from "../../services/cadastros/usuarios.services.js";


//#region função listarUsuarios - lista usuarios (ativos/inativos)
 async function listarUsuarios(req, res) {
  try {

    //verifica se o valor do parâmetro "status" é válido
    const parametro = req.query.status;

    //Chama a função do service para listar os usuários
    const usuarios = await listarUsuariosService(parametro);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Usuários listados com sucesso!', usuarios, 200, true
    );
  } catch (error) {

    apiResponse.error(res,
      error.message || 'Erro ao listar usuários', 500);
  }
}
//#endregion

//#region função de contagem - contar usuarios - dashboard
 async function contarUsuarios(req, res) {

  try {

    //chama a função do serviço para contar os usuários
    const countUser = await countUserService();

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Contagem de usuários realizada com sucesso!', countUser, 200, true
    );
  }
  catch (error) {
    
    // Log do erro para depuração
    console.error('Erro ao contar usuários:', error);

    // Retorna a mensagem detalhada do erro
    apiResponse.error(res,
      error.message || 'Erro ao contar usuários', 500);
  }
}
//#endregion

//#region Função para cadastrar usuarios
async function cadastrarUser(req, res) {
  //recebe os dados do corpo da requisição
  const dados = req.body;
  //chama a função do serviço para cadastrar o usuário
  try {
    const cadastrarUser = await cadastrarUserService(dados);
    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Usuário cadastrado com sucesso!', cadastrarUser, 201, true
    );
  } catch (error) {
    // Log do erro para depuração
    console.error('Erro ao cadastrar usuário:', error);
    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res, error.message);
  }
}
//#endregion

//NÂO MIGRADO ABAIXO - AINDA FALTA MIGRAR PARA SERVICE E REPOSITORY

//#region PUT - atualizar usuario
export async function atualizarUser(req, res) {
  const { nome, dataNascimento, email, status } = req.body;
  const id = req.params.id;
  const db = await openDb();

  if (nome === undefined || dataNascimento === undefined || email === undefined) {
    return res.status(400).json({ status: 400, message: 'Insira todos os campos obrigatórios !' });
  }
  if (!nome.trim().includes(' ')) {
    return res.status(400).json({ status: 400, message: 'Insira o nome e sobrenome!' });
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ status: 400, message: 'Email inválido !' });
  }

  // Validação da data de nascimento
  const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dataRegex.test(dataNascimento)) {
    return res.status(400).json({ status: 400, message: 'Data de nascimento deve estar no formato DD/MM/AAAA !' });
  }

  if (email) {
    const existeEmail = await validaEmailExistente(email, db);
    if (existeEmail && existeEmail.id != id) {
      return res.status(400).json({ status: 400, message: 'Email já cadastrado !' });
    }
  }

  try {
    const ativo = status === 'on' ? true : (status === 'off' ? false : undefined);
    const dataNascimentoPostgres = converterDataParaPostgres(dataNascimento);

    let sql, params;
    if (ativo !== undefined) {
      sql = `
        UPDATE dbo."tabUser"
        SET nome = $1,
            dataNascimento = $2,
            email = $3,
            ativo = $4
        WHERE id = $5
      `;
      params = [nome, dataNascimentoPostgres, email, ativo, id];
    } else {
      sql = `
        UPDATE dbo."tabUser"
        SET nome = $1,
            dataNascimento = $2,
            email = $3
        WHERE id = $4
      `;
      params = [nome, dataNascimentoPostgres, email, id];
    }

    await db.query(sql, params);
    return res.status(200).json({ status: 200, message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
    return res.status(500).json({ status: 500, message: 'Erro ao atualizar o usuário.' });
  }
}
//#endregion

//#region - Inativa ou Reativa User
async function onOffUserController(req, res) {

  const { id } = req.params;

  try {

    //chama a função do serviço para inativar ou reativar o usuário
    const onOffUser = await onOffUserService(id);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res, 
      onOffUser.ativo
      ? 'Usuário Reativado Com Sucesso!'
      : 'Usuário Inativado Com Sucesso!', onOffUser, 200, true
    );
  }
  catch (error) {

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
  }
}


//#endregion

//#region DELETE - deletar usuario
export async function deleteUser(req, res) {
  const idUser = req.params.id;
  const db = await openDb();

  try {
    const existeUser = await buscaUserId(idUser, db);

    if (!existeUser) {
      return res.status(404).json({ error: 'Usuário não encontrado !' });
    }

    await db.query('BEGIN');

    await db.query(`
      DELETE 
      FROM "credenciaisUsuario"
      WHERE "idUser" = $1 `, [idUser]
    );

    await db.query(`
      DELETE 
      FROM usuarios
      WHERE id = $1 `, [idUser]
    );

    await db.query('COMMIT');

    return res.json({
      statusCode: 'Sucesso (200)',
      usuario: `${existeUser.nome}`,
      message: 'O usuario foi deletado com sucesso !'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Erro ao deletar o usuário:', error);
    return res.status(400).json({ error: 'Erro ao deletar o usuário.' });
  }
}
//#endregion


export {
  listarUsuarios,
  cadastrarUser,
  contarUsuarios,
  onOffUserController
  //atualizarUser,
  //deleteUser
}


