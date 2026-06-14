import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    findUserByEmail,
    findUserCredentials
} from '../repositories/login.repositories.js';

//#region => Logica  para login
async function autenticarUsuario(email, password) {

    //valida campos obrigatórios
    if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios.');
    }

    // 1. Buscar user no BD (chama repository)
    const usuario = await findUserByEmail(email);
    if (!usuario) throw new Error('Email Não Cadastrado ou Incorreto.');

    // 2. Buscar credenciais
    const credenciais = await findUserCredentials(usuario.id);

    // 2.5 Validar se usuário está ativo
    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // 3. Validar senha com bcrypt
    if (!credenciais) {
        throw new Error('Senha não encontrada.');
    }

    //descriptografa a senha e compara com a senha do banco de dados
    const senhaValida = await bcrypt.compare(password, credenciais.password);

    // Se senha inválida, lança erro
    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
    }

    let defaultPassword = [];

    //se a senha for a senha padrão, solicita alteração
    if (password === 'Track@123') {
        //se a senha for padrão passa uma flag para o front solicitar alteração de senha
        defaultPassword = true;
    }

    // 4. Gerar token JWT com dados do usuário
    const token = jwt.sign(
        {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            defaultPassword: defaultPassword || false
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            defaultPassword: defaultPassword || false
        }
    };
}

//#endregion

export {
    autenticarUsuario
};